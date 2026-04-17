import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { TEMP_DIR, generateVisualContent } from "./videoService.js";
import * as aiService from "./aiService.js";

// Setup ffmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

interface MontageClip {
  prompt: string;
  duration: number;
}

/**
 * Assembles a montage from multiple prompts and adds background music.
 */
export const createMontage = async (clips: MontageClip[], musicStyle: string = "Cinematic") => {
  const id = uuidv4();
  const clipFiles: string[] = [];
  const finalFile = path.join(TEMP_DIR, `montage-${id}.mp4`);
  const musicFile = path.join(TEMP_DIR, `music-${id}.mp3`);

  try {
    console.log(`[Montage] Starting assembly for ${clips.length} clips with style: ${musicStyle}`);

    // 1. Generate all clips in parallel
    const generatedClips = await Promise.all(
      clips.map((clip, index) => generateVisualContent(clip.prompt, `${id}-${index}`, clip.duration))
    );
    clipFiles.push(...generatedClips);

    // 2. Generate Background Music
    const musicRes = await aiService.dynamicCall(`Generate a ${musicStyle} background music track for a video montage.`, "music");
    if (musicRes.audio) {
      const musicBuffer = Buffer.from(musicRes.audio, 'base64');
      fs.writeFileSync(musicFile, musicBuffer);
    }

    // 3. Merge Clips
    const mergedNoMusic = path.join(TEMP_DIR, `merged-no-music-${id}.mp4`);
    
    await new Promise((resolve, reject) => {
      const command = ffmpeg();
      clipFiles.forEach(file => command.input(file));
      
      command
        .on('error', reject)
        .on('end', resolve)
        .mergeToFile(mergedNoMusic, TEMP_DIR);
    });

    // 4. Add Music to Merged Video
    if (fs.existsSync(musicFile)) {
      await new Promise((resolve, reject) => {
        ffmpeg()
          .input(mergedNoMusic)
          .input(musicFile)
          .outputOptions([
            "-c:v copy",
            "-c:a aac",
            "-map 0:v:0",
            "-map 1:a:0",
            "-shortest"
          ])
          .save(finalFile)
          .on("end", resolve)
          .on("error", reject);
      });
      if (fs.existsSync(mergedNoMusic)) fs.unlinkSync(mergedNoMusic);
    } else {
      fs.renameSync(mergedNoMusic, finalFile);
    }

    const finalBuffer = fs.readFileSync(finalFile);
    const base64Video = finalBuffer.toString('base64');

    // Cleanup
    [...clipFiles, musicFile, finalFile].forEach(f => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });

    return {
      video: `data:video/mp4;base64,${base64Video}`,
      id
    };

  } catch (error) {
    console.error(`[Montage] Assembly failed:`, error);
    // Cleanup on error
    [...clipFiles, musicFile, finalFile].forEach(f => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
    throw error;
  }
};
