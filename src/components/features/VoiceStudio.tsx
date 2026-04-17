import React, { useState } from 'react';
import { Mic, Volume2, Play, Loader2, Music, Download, Sparkles } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { toast } from 'sonner';
import { brandApi } from '../../api/brandApi';
import { motion } from 'motion/react';

interface VoiceStudioProps {
  lang: 'ar' | 'en';
}

export const VoiceStudio: React.FC<VoiceStudioProps> = ({ lang }) => {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<'Kore' | 'Fenrir' | 'Puck' | 'Charon' | 'Zephyr'>('Kore');

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const addWavHeader = (pcmData: Uint8Array, sampleRate: number) => {
    const header = new ArrayBuffer(44);
    const view = new DataView(header);

    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, pcmData.length, true);

    const wavData = new Uint8Array(44 + pcmData.length);
    wavData.set(new Uint8Array(header), 0);
    wavData.set(pcmData, 44);
    return wavData;
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setIsGenerating(true);
    setAudioUrl(null);
    try {
      // Use Groq to refine the text for a professional voiceover
      const refinementPrompt = `
        Refine the following text to be more professional, engaging, and suitable for a high-quality voiceover. 
        Keep it concise and clear. 
        If the text is in Arabic, keep it in Arabic.
        Text: "${text}"
        Return ONLY the refined text.
      `;
      const refinedRes = await brandApi.chat(refinementPrompt);
      const refinedText = refinedRes.text;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say cheerfully: ${refinedText}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        
        // Gemini TTS returns raw PCM 16-bit 24kHz mono. We need to add a WAV header.
        const wavData = addWavHeader(bytes, 24000);
        const blob = new Blob([wavData], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        toast.success(lang === 'ar' ? 'تم تحسين النص بواسطة Groq وتوليد الصوت!' : 'Text refined by Groq and audio generated!');
      }
    } catch (error) {
      console.error("Voice generation error:", error);
      toast.error(lang === 'ar' ? 'فشل توليد الصوت.' : 'Failed to generate audio.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
        <h3 className="text-orange-500 font-bold mb-2 flex items-center gap-2">
          <Mic className="w-4 h-4" />
          {lang === 'ar' ? 'استوديو الصوت الذكي' : 'Smart Voice Studio'}
        </h3>
        <p className="text-sm text-zinc-400">
          {lang === 'ar' 
            ? 'حول نصوصك التسويقية إلى مقاطع صوتية احترافية بأصوات طبيعية (بواسطة Groq & Gemini).' 
            : 'Transform your marketing texts into professional audio clips with natural voices (Powered by Groq & Gemini).'}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {['Kore', 'Fenrir', 'Puck', 'Charon', 'Zephyr'].map((voice) => (
            <button
              key={voice}
              onClick={() => setSelectedVoice(voice as any)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${selectedVoice === voice ? 'bg-orange-500 text-black' : 'bg-zinc-900 text-zinc-500 hover:text-white'}`}
            >
              {voice}
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={lang === 'ar' ? 'اكتب النص الذي تريد تحويله إلى صوت هنا...' : 'Type the text you want to convert to voice here...'}
          className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-white focus:border-orange-500 outline-none transition-all resize-none"
        />

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !text.trim()}
          className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
          {lang === 'ar' ? 'توليد وتحسين الصوت' : 'Generate & Refine Audio'}
        </button>
      </div>

      {audioUrl && (
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                <Music className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">{lang === 'ar' ? 'المقطع الصوتي المولد' : 'Generated Audio Clip'}</h4>
                <p className="text-[10px] text-zinc-500 uppercase font-mono">{selectedVoice} Voice Engine</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePlay}
                className="p-2 bg-orange-500 text-black rounded-lg hover:bg-orange-400 transition-colors flex items-center gap-2 text-xs font-bold"
              >
                {isPlaying ? <Volume2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {lang === 'ar' ? (isPlaying ? 'إيقاف' : 'استماع') : (isPlaying ? 'Stop' : 'Listen')}
              </button>
              <a 
                href={audioUrl} 
                download="ai-voice.wav"
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>
          
          <audio 
            ref={audioRef}
            src={audioUrl} 
            onEnded={() => setIsPlaying(false)}
            className="hidden" 
          />
          
          {/* Visualizer Mockup */}
          <div className="h-8 flex items-end gap-1 px-2">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                animate={isPlaying ? { height: [4, 24, 8, 20, 4] } : { height: 4 }}
                transition={{ repeat: Infinity, duration: 0.5 + Math.random(), ease: "easeInOut" }}
                className="flex-1 bg-orange-500/40 rounded-t-sm"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
