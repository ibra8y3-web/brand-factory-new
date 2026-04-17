import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Play, Loader2, Plus, Trash2, Music, Sparkles, Download, Film, Layers, Wand2 } from 'lucide-react';
import { brandApi } from '../../api/brandApi';
import { toast } from 'sonner';

interface Clip {
  id: string;
  prompt: string;
  duration: number;
  status: 'idle' | 'generating' | 'completed' | 'error';
  url?: string;
}

export const VideoMontage: React.FC<{ lang: string }> = ({ lang }) => {
  const [clips, setClips] = useState<Clip[]>([
    { id: '1', prompt: 'A cinematic shot of a futuristic city at night', duration: 5, status: 'idle' }
  ]);
  const [isAssembling, setIsAssembling] = useState(false);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [backgroundMusic, setBackgroundMusic] = useState('Cinematic');

  const addClip = () => {
    const newId = (clips.length + 1).toString();
    setClips([...clips, { id: newId, prompt: '', duration: 5, status: 'idle' }]);
  };

  const removeClip = (id: string) => {
    setClips(clips.filter(c => c.id !== id));
  };

  const updateClip = (id: string, updates: Partial<Clip>) => {
    setClips(clips.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const generateClip = async (id: string) => {
    const clip = clips.find(c => c.id === id);
    if (!clip || !clip.prompt.trim()) return;

    updateClip(id, { status: 'generating' });
    try {
      const res = await brandApi.generateVideo(clip.prompt);
      if (res.uri || res.text) {
        updateClip(id, { status: 'completed', url: res.uri || res.text });
        toast.success(lang === 'ar' ? `تم توليد المقطع ${id}` : `Clip ${id} generated`);
      } else {
        throw new Error("No video returned");
      }
    } catch (error) {
      updateClip(id, { status: 'error' });
      toast.error(lang === 'ar' ? `فشل توليد المقطع ${id}` : `Failed to generate clip ${id}`);
    }
  };

  const handleAssemble = async () => {
    const completedClips = clips.filter(c => c.status === 'completed' && c.url);
    if (completedClips.length === 0) {
      toast.error(lang === 'ar' ? 'يرجى توليد مقطع واحد على الأقل أولاً' : 'Please generate at least one clip first');
      return;
    }

    setIsAssembling(true);
    setFinalVideoUrl(null);
    try {
      const res: any = await brandApi.generateMontage(
        completedClips.map(c => ({ prompt: c.prompt, duration: c.duration })),
        backgroundMusic
      );

      if (res.uri || res.text || res.video) {
        setFinalVideoUrl(res.uri || res.text || res.video);
        toast.success(lang === 'ar' ? 'تم تجميع المونتاج بنجاح' : 'Montage assembled successfully');
      } else {
        throw new Error("No video returned");
      }
    } catch (error) {
      toast.error(lang === 'ar' ? 'فشل تجميع المونتاج' : 'Failed to assemble montage');
    } finally {
      setIsAssembling(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="p-6 bg-pink-500/10 border border-pink-500/20 rounded-3xl">
        <h3 className="text-pink-500 font-black flex items-center gap-2 mb-2">
          <Scissors className="w-5 h-5" />
          {lang === 'ar' ? 'استوديو المونتاج الذكي' : 'Smart Montage Studio'}
        </h3>
        <p className="text-sm text-zinc-400">
          {lang === 'ar' 
            ? 'قم بإنشاء مقاطع متعددة ودمجها في فيديو واحد احترافي باستخدام الذكاء الاصطناعي.' 
            : 'Create multiple clips and merge them into one professional video using AI.'}
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold uppercase tracking-widest text-zinc-500">
            {lang === 'ar' ? 'الجدول الزمني للمقاطع' : 'Clips Timeline'}
          </h4>
          <button 
            onClick={addClip}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all"
          >
            <Plus className="w-4 h-4" />
            {lang === 'ar' ? 'إضافة مقطع' : 'Add Clip'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {clips.map((clip, index) => (
              <motion.div
                key={clip.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col md:flex-row gap-4 items-center"
              >
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center font-black text-zinc-500 shrink-0">
                  {index + 1}
                </div>
                
                <div className="flex-1 w-full">
                  <input 
                    type="text"
                    value={clip.prompt}
                    onChange={(e) => updateClip(clip.id, { prompt: e.target.value })}
                    placeholder={lang === 'ar' ? 'وصف المقطع...' : 'Describe the clip...'}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-sm text-white focus:border-pink-500 outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2 bg-black px-3 py-2 rounded-xl border border-zinc-800">
                    <Film className="w-3 h-3 text-zinc-500" />
                    <select 
                      value={clip.duration}
                      onChange={(e) => updateClip(clip.id, { duration: parseInt(e.target.value) })}
                      className="bg-transparent text-xs text-zinc-300 outline-none"
                    >
                      <option value={3}>3s</option>
                      <option value={5}>5s</option>
                      <option value={10}>10s</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => generateClip(clip.id)}
                    disabled={clip.status === 'generating' || !clip.prompt.trim()}
                    className={`p-2 rounded-xl transition-all ${clip.status === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-pink-600 text-white hover:bg-pink-500 disabled:opacity-50'}`}
                  >
                    {clip.status === 'generating' ? <Loader2 className="w-4 h-4 animate-spin" /> : clip.status === 'completed' ? <Play className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                  </button>

                  <button 
                    onClick={() => removeClip(clip.id)}
                    className="p-2 bg-zinc-800 text-zinc-500 hover:text-red-500 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4">
          <h4 className="font-bold flex items-center gap-2">
            <Music className="w-4 h-4 text-indigo-500" />
            {lang === 'ar' ? 'الموسيقى التصويرية' : 'Background Music'}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {['Cinematic', 'Upbeat', 'Lo-fi', 'Epic', 'Arabic', 'Techno'].map((style) => (
              <button
                key={style}
                onClick={() => setBackgroundMusic(style)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${backgroundMusic === style ? 'bg-indigo-600 text-white' : 'bg-black text-zinc-500 border border-zinc-800 hover:border-zinc-700'}`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl flex flex-col justify-center items-center gap-4">
          <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center">
            <Layers className="w-8 h-8 text-pink-500" />
          </div>
          <div className="text-center">
            <h4 className="font-bold">{lang === 'ar' ? 'تجميع المونتاج النهائي' : 'Assemble Final Montage'}</h4>
            <p className="text-xs text-zinc-500 mt-1">{lang === 'ar' ? 'سيتم دمج جميع المقاطع مع الموسيقى' : 'All clips will be merged with music'}</p>
          </div>
          <button 
            onClick={handleAssemble}
            disabled={isAssembling || clips.filter(c => c.status === 'completed').length === 0}
            className="w-full py-4 bg-pink-600 hover:bg-pink-500 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isAssembling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
            {lang === 'ar' ? 'بدء المونتاج الذكي' : 'Start Smart Montage'}
          </button>
        </div>
      </div>

      {finalVideoUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 bg-black border border-zinc-800 rounded-[32px] space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-pink-500 rounded-2xl flex items-center justify-center">
                <Film className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-black">{lang === 'ar' ? 'الفيديو النهائي' : 'Final Video'}</h3>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">AI Montage Completed</p>
              </div>
            </div>
            <a 
              href={finalVideoUrl} 
              download="ai-montage.mp4"
              className="px-6 py-3 bg-white text-black rounded-xl font-black text-sm flex items-center gap-2 hover:bg-zinc-200 transition-all"
            >
              <Download className="w-4 h-4" />
              {lang === 'ar' ? 'تحميل الفيديو' : 'Download Video'}
            </a>
          </div>

          <div className="aspect-video rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
            <video 
              src={finalVideoUrl} 
              controls 
              autoPlay 
              className="w-full h-full object-contain"
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};
