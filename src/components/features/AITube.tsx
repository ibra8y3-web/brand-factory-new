import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Youtube, Loader2, Scissors, FileText, Shrink, Play, Upload, Link as LinkIcon, Download, Video } from 'lucide-react';
import { brandApi } from '../../api/brandApi';
import { toast } from 'sonner';

export const AITube: React.FC<{ lang: string }> = ({ lang }) => {
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [inputType, setInputType] = useState<'url' | 'upload'>('url');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [mode, setMode] = useState<'summarize' | 'shorten' | 'compress' | 'generate'>('summarize');
  const [availableModels, setAvailableModels] = useState<{ id: string, name: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');

  React.useEffect(() => {
    brandApi.getModels().then(models => {
      setAvailableModels(models);
      if (models.length > 0) setSelectedModel(models[0].name);
    }).catch(console.error);
  }, []);

  const handleProcess = async () => {
    if (inputType === 'url' && !input.trim()) return;
    if (inputType === 'upload' && !file) return;
    
    setIsLoading(true);
    setResult(null);
    try {
      let res;
      if (mode === 'generate') {
        res = await brandApi.generateAITube(input);
      } else {
        res = await brandApi.processAITube(inputType === 'url' ? input : file!, mode, selectedModel);
      }
      
      setResult(res);
      toast.success(lang === 'ar' ? 'تمت العملية بنجاح' : 'Operation completed successfully');
    } catch (error: any) {
      toast.error(lang === 'ar' ? 'فشل تنفيذ العملية' : 'Failed to execute operation');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: FileText, label: lang === 'ar' ? 'التلخيص' : 'Summarize', desc: lang === 'ar' ? 'احصل على ملخص شامل للحبكة والشخصيات' : 'Get a full plot and character summary', type: 'summarize' },
          { icon: Scissors, label: lang === 'ar' ? 'التقصير' : 'Shorten', desc: lang === 'ar' ? 'تحويل الفيلم إلى قصة قصيرة مركزة' : 'Turn the movie into a focused short story', type: 'shorten' },
          { icon: Shrink, label: lang === 'ar' ? 'الضغط' : 'Compress', desc: lang === 'ar' ? 'تحليل عميق ومكثف للرسائل والرموز' : 'Deep, condensed analysis of themes', type: 'compress' },
          { icon: Video, label: lang === 'ar' ? 'توليد' : 'Generate', desc: lang === 'ar' ? 'توليد فيلم احترافي بالكامل من الصفر عبر الذكاء' : 'Generate a full movie from scratch using AI', type: 'generate' },
        ].map((item, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode(item.type as any)}
            className={`p-6 rounded-3xl border text-left transition-all ${
              mode === item.type 
                ? 'bg-red-500/10 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <item.icon className={`w-8 h-8 mb-4 ${mode === item.type ? 'text-red-500' : 'text-zinc-500'}`} />
            <div className="text-xl font-black mb-1">{item.label}</div>
            <div className="text-xs text-zinc-500 leading-relaxed">{item.desc}</div>
          </motion.button>
        ))}
      </div>

      <div className="p-8 bg-black border-2 border-red-500/20 rounded-[32px] military-frame relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 text-[8px] font-black font-mono text-red-500 uppercase tracking-widest bg-red-500/10">AITube Production Hub</div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black flex items-center gap-2 glow-orange">
              <Youtube className="w-8 h-8 text-red-600" />
              {lang === 'ar' ? 'مختبر AI Tube للأفلام' : 'AI Tube Movie Lab'}
            </h2>
            <p className="text-[10px] text-zinc-500 mt-1 font-mono uppercase tracking-widest">
               {lang === 'ar' ? 'نظام الإنتاج الآلي للسينما' : 'Automated Cinema Production System'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              {[
                { id: 'summarize', icon: FileText, label: lang === 'ar' ? 'تخليص' : 'Summary' },
                { id: 'shorten', icon: Scissors, label: lang === 'ar' ? 'تقصير' : 'Shorten' },
                { id: 'compress', icon: Shrink, label: lang === 'ar' ? 'ضغط' : 'Compress' },
                { id: 'generate', icon: Video, label: lang === 'ar' ? 'توليد' : 'Generate' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${mode === m.id ? 'bg-red-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <m.icon className="w-3 h-3" />
                  {m.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 text-white text-[9px] p-1.5 rounded-lg outline-none cursor-pointer"
              >
                <option value="">{lang === 'ar' ? 'نموذج تلقائي' : 'Auto Model'}</option>
                {availableModels.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
              <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                <button
                  onClick={() => setInputType('url')}
                  className={`px-3 py-1.5 rounded-md text-[9px] font-bold transition-all ${inputType === 'url' ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                  {lang === 'ar' ? 'رابط' : 'URL'}
                </button>
                <button
                  onClick={() => setInputType('upload')}
                  className={`px-3 py-1.5 rounded-md text-[9px] font-bold transition-all ${inputType === 'upload' ? 'bg-zinc-800 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                  {lang === 'ar' ? 'رفع ملف' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          {mode === 'generate' ? (
             <textarea
               value={input}
               onChange={(e) => setInput(e.target.value)}
               placeholder={lang === 'ar' ? 'أدخل فكرة الفيلم لإنتاجها (توليد نص، صوت، وفيديو)...' : 'Enter movie idea to produce (generates script, voice, and video)...'}
               className="w-full bg-black border border-zinc-800 rounded-2xl p-5 text-white focus:outline-none focus:border-red-500 min-h-[150px] resize-none"
             />
          ) : inputType === 'url' ? (
            <div className="relative">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={lang === 'ar' ? 'أدخل رابط الفيلم (YouTube, Drive, etc.)...' : 'Enter movie URL (YouTube, Drive, etc.)...'}
                className="w-full bg-black border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-red-500"
              />
            </div>
          ) : (
            <label className="border-2 border-dashed border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 hover:border-red-500/50 transition-colors cursor-pointer bg-black/50">
              <input type="file" className="hidden" onChange={onFileChange} accept="video/*" />
              <Upload className={`w-10 h-10 ${file ? 'text-red-500' : 'text-zinc-500'}`} />
              <div className="text-center">
                <p className="font-bold">
                  {file ? file.name : (lang === 'ar' ? 'اسحب وأفلت ملف الفيلم هنا' : 'Drag & drop movie file here')}
                </p>
                <p className="text-xs text-zinc-500 mt-1">{lang === 'ar' ? 'يدعم MP4, MKV, AVI حتى 2GB' : 'Supports MP4, MKV, AVI up to 2GB'}</p>
              </div>
            </label>
          )}

          <button
            onClick={handleProcess}
            disabled={isLoading || (mode !== 'generate' && inputType === 'url' && !input.trim()) || (mode !== 'generate' && inputType === 'upload' && !file) || (mode === 'generate' && !input.trim())}
            className="w-full py-5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-red-600/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                {lang === 'ar' ? 'جاري المعالجة والإنتاج...' : 'Processing & Producing...'}
              </>
            ) : (
              <>
                {mode === 'summarize' ? <FileText className="w-6 h-6" /> : mode === 'shorten' ? <Scissors className="w-6 h-6" /> : mode === 'compress' ? <Shrink className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                {lang === 'ar' ? (mode === 'generate' ? 'إنتاج الفيلم الكامل' : 'بدء المعالجة الذكية') : (mode === 'generate' ? 'Produce Full Movie' : 'Start AI Processing')}
              </>
            )}
          </button>
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 p-8 bg-black rounded-[24px] border border-zinc-800"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-current" />
              </div>
              <div>
                <h3 className="font-black text-xl">{lang === 'ar' ? 'نتائج المعالجة' : 'Processing Results'}</h3>
                <p className="text-xs text-zinc-500 uppercase tracking-widest">{mode}</p>
              </div>
            </div>
            
            <div className="prose prose-invert max-w-none">
              {(result.video || result.uri) && (
                <div className="mb-6 rounded-2xl overflow-hidden border border-zinc-800 bg-black aspect-video flex items-center justify-center">
                  <video 
                    src={result.video || result.uri} 
                    controls 
                    autoPlay 
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div className="text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {result.script || result.text}
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-zinc-800 flex flex-wrap gap-4">
              {(result.video || result.uri) && (
                <a 
                  href={result.video || result.uri} 
                  download={`aitube-${result.id}.mp4`}
                  className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-colors text-sm flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {lang === 'ar' ? 'تحميل الفيديو' : 'Download Video'}
                </a>
              )}
              <button className="px-6 py-3 border border-zinc-800 hover:bg-zinc-900 text-white rounded-xl font-bold transition-colors text-sm">
                {lang === 'ar' ? 'مشاركة' : 'Share'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
