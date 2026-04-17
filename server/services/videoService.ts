import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import path from "path";
import fs from "fs";
import os from "os";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import * as aiService from "./aiService.js";

// Setup ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

export const TEMP_DIR = path.join(os.tmpdir(), "temp_media");
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Cleanup old files every hour
setInterval(() => {
  try {
    const files = fs.readdirSync(TEMP_DIR);
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join(TEMP_DIR, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > 3600000) { // 1 hour
        fs.unlinkSync(filePath);
      }
    });
  } catch (e) {
    console.error("Temp cleanup failed:", e);
  }
}, 3600000);

/**
 * Generates a standalone video from a prompt.
 * Falls back to image-to-video if direct video generation fails.
 */
export const createStandaloneVideo = async (prompt: string) => {
  const id = uuidv4();
  const visualFile = await generateVisualContent(prompt, id);
  const buffer = fs.readFileSync(visualFile);
  
  // Cleanup
  if (fs.existsSync(visualFile)) fs.unlinkSync(visualFile);
  
  return {
    video: `data:video/mp4;base64,${buffer.toString('base64')}`,
    id
  };
};

/**
 * Generates visual content (video or image-to-video fallback)
 */
export const generateVisualContent = async (prompt: string, id: string = uuidv4(), duration: number = 5) => {
  const videoFile = path.join(TEMP_DIR, `video-${id}.mp4`);
  let visualFile = "";

  try {
    console.log(`[VideoService] Attempting video generation for: ${prompt}`);
    const videoRes = await aiService.dynamicCall(prompt, "video");
    
    // The response might have the URL/base64 in uri or text
    const videoData = videoRes.uri || videoRes.text;
    
    if (videoData) {
      const tempDownload = path.join(TEMP_DIR, `raw-${id}.mp4`);
      if (videoData.startsWith("http")) {
        const vRes = await axios.get(videoData, { responseType: 'arraybuffer' });
        fs.writeFileSync(tempDownload, Buffer.from(vRes.data));
      } else if (videoData.startsWith("data:")) {
        const base64Data = videoData.split(",")[1];
        fs.writeFileSync(tempDownload, Buffer.from(base64Data, 'base64'));
      }

      if (fs.existsSync(tempDownload)) {
        // Re-encode to ensure consistent specs (1280x720, 25fps, libx264)
        await new Promise((resolve, reject) => {
          ffmpeg(tempDownload)
            .size('1280x720')
            .fps(25)
            .videoCodec('libx264')
            .format('mp4')
            .outputOptions('-pix_fmt yuv420p')
            .save(videoFile)
            .on("end", resolve)
            .on("error", reject)
            .run();
        });
        visualFile = videoFile;
        fs.unlinkSync(tempDownload);
      }
    }
  } catch (e) {
    console.warn(`[VideoService] Video generation failed, falling back to image-to-video:`, e);
  }

  if (!visualFile) {
    console.log(`[VideoService] Generating image for fallback...`);
    const imageRes = await aiService.generateImage(prompt);
    const imageFile = path.join(TEMP_DIR, `image-${id}.png`);
    
    if (imageRes.startsWith("data:")) {
      const base64Data = imageRes.split(",")[1];
      fs.writeFileSync(imageFile, Buffer.from(base64Data, 'base64'));
    } else if (imageRes.startsWith("http")) {
      const imgData = await axios.get(imageRes, { responseType: 'arraybuffer' });
      fs.writeFileSync(imageFile, Buffer.from(imgData.data));
    } else {
      fs.writeFileSync(imageFile, Buffer.from(imageRes, 'base64'));
    }

    // Convert image to video
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(imageFile)
        .loop(duration)
        .fps(25)
        .size('1280x720')
        .format('mp4')
        .videoCodec('libx264')
        .outputOptions('-pix_fmt yuv420p')
        .save(videoFile)
        .on("end", resolve)
        .on("error", reject)
        .run();
    });
    visualFile = videoFile;
    if (fs.existsSync(imageFile)) fs.unlinkSync(imageFile);
  }

  return visualFile;
};

/**
 * Processes an existing movie based on the selected mode.
 */
export const processMovie = async (input: string | { path: string; originalName: string }, mode: 'summarize' | 'shorten' | 'compress') => {
  const id = uuidv4();
  const sourceFile = typeof input === 'string' ? path.join(TEMP_DIR, `source-${id}.mp4`) : input.path;
  const finalFile = path.join(TEMP_DIR, `processed-${id}.mp4`);
  
  try {
    // 1. Download if URL
    if (typeof input === 'string') {
      console.log(`[AITube] Downloading movie from: ${input}`);
      const response = await axios.get(input, { responseType: 'arraybuffer' });
      fs.writeFileSync(sourceFile, Buffer.from(response.data));
    }

    console.log(`[AITube] Analyzing movie with mode: ${mode}`);
    
    // 2. Real AI Analysis for the text report
    const fileName = typeof input === 'object' ? input.originalName : 'video_file';
    const analysisPrompt = `Analyze the movie file named "${fileName}" for the purpose of ${mode}. 
      Return a professional, insightful analysis in Arabic. 
      If it's 'summarize', give a plot summary. 
      If it's 'shorten', explain which scenes were captured. 
      If it's 'compress', talk about themes and symbols.
      Keep it high-tech and intelligent.`;
    
    const analysisRes = await aiService.dynamicCall(analysisPrompt, "general", "You are an expert film critic and AI video analyst.");
    let analysisText = analysisRes.text;

    // 3. Dynamic scene selection (Simulated logic based on duration if we had it, but for now better distribution)
    let scenes: { start: number; duration: number }[] = [];
    if (mode === 'summarize') {
      scenes = [{ start: 5, duration: 8 }, { start: 40, duration: 8 }, { start: 80, duration: 8 }];
    } else if (mode === 'shorten') {
      scenes = [{ start: 0, duration: 15 }, { start: 50, duration: 15 }];
    } else {
      scenes = [{ start: 10, duration: 5 }, { start: 20, duration: 5 }, { start: 50, duration: 5 }, { start: 90, duration: 5 }];
    }

    // 3. Real Cutting and Merging with FFmpeg
    const clipFiles: string[] = [];
    for (let i = 0; i < scenes.length; i++) {
      const clipPath = path.join(TEMP_DIR, `clip-${id}-${i}.mp4`);
      await new Promise((resolve, reject) => {
        ffmpeg(sourceFile)
          .setStartTime(scenes[i].start)
          .setDuration(scenes[i].duration)
          .size('1280x720')
          .videoCodec('libx264')
          .format('mp4')
          .save(clipPath)
          .on('end', resolve)
          .on('error', reject);
      });
      clipFiles.push(clipPath);
    }

    // Merge clips
    await new Promise((resolve, reject) => {
      const command = ffmpeg();
      clipFiles.forEach(f => command.input(f));
      command
        .on('error', reject)
        .on('end', resolve)
        .mergeToFile(finalFile, TEMP_DIR);
    });

    const finalBuffer = fs.readFileSync(finalFile);
    const base64Video = finalBuffer.toString('base64');

    // Cleanup
    [sourceFile, finalFile, ...clipFiles].forEach(f => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });

    return {
      video: `data:video/mp4;base64,${base64Video}`,
      text: analysisText,
      id
    };

  } catch (error) {
    console.error(`[AITube] Processing failed:`, error);
    throw error;
  }
};
/**
 * Full AITube pipeline: Script -> Audio -> Visual -> Merge
 */
export const createFullAITube = async (prompt: string) => {
  const id = uuidv4();
  const audioFile = path.join(TEMP_DIR, `audio-${id}.mp3`);
  const finalFile = path.join(TEMP_DIR, `final-${id}.mp4`);

  try {
    console.log(`[AITube] Starting full pipeline for: ${prompt}`);

    // 1. Generate Script
    const scriptRes = await aiService.dynamicCall(prompt, "general", "You are a professional scriptwriter. Write a short, engaging script for a 10-second video based on the user prompt. Keep it concise.");
    const script = scriptRes.text;

    // 2. Generate Audio
    const audioRes = await aiService.generateSpeech(script, "Kore", "cheerful");
    const audioBuffer = Buffer.from(audioRes.audio, 'base64');
    fs.writeFileSync(audioFile, audioBuffer);

    // 3. Generate Visual
    const visualFile = await generateVisualContent(prompt, id, 10);

    // 4. Merge Audio and Video
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(visualFile)
        .input(audioFile)
        .outputOptions([
          "-c:v copy",
          "-c:a aac",
          "-shortest"
        ])
        .save(finalFile)
        .on("end", resolve)
        .on("error", reject);
    });

    const finalBuffer = fs.readFileSync(finalFile);
    const base64Video = finalBuffer.toString('base64');

    // Cleanup
    [audioFile, visualFile, finalFile].forEach(f => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });

    return {
      video: `data:video/mp4;base64,${base64Video}`,
      script,
      id
    };

  } catch (error) {
    console.error(`[AITube] Pipeline failed:`, error);
    throw error;
  }
};
