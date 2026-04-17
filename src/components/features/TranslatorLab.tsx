import React, { useState } from 'react';
import { Languages, Loader2, Copy, Check, ArrowRightLeft, Sparkles, Volume2 } from 'lucide-react';
import { brandApi } from '../../api/brandApi';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export const TranslatorLab = ({ lang }: { lang: 'ar' | 'en' }) => {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [targetLang, setTargetLang] = useState<'ar' | 'en'>(lang === 'ar' ? 'en' : 'ar');

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    setResult('');
    try {
      const res = await brandApi.executeUniversal({
        prompt: `Translate the following text to ${targetLang === 'ar' ? 'Arabic' : 'English'}. Ensure the translation is natural, professional, and contextually accurate.\n\nText: ${text}`,
        taskType: "general",
        systemPrompt: "You are an expert professional translator specializing in English and Arabic. Provide high-quality, natural translations."
      });
      setResult(res.text);
      toast.success(lang === 'ar' ? 'تمت الترجمة بنجاح' : 'Translation successful');
    } catch (e) {
      toast.error(lang === 'ar' ? 'فشل الترجمة' : 'Translation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success(lang === 'ar' ? 'تم النسخ' : 'Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const swapLanguages = () => {
    setTargetLang(targetLang === 'ar' ? 'en' : 'ar');
    if (result) {
      setText(result);
      setResult('');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[32px]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Languages className="w-6 h-6 text-blue-500" />
            </div>
            {lang === 'ar' ? 'المترجم الذكي الاحترافي' : 'Professional Smart Translator'}
          </h2>
          
          <div className="flex items-center gap-3 bg-black p-1 rounded-2xl border border-zinc-800">
            <div className="px-4 py-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
              {targetLang === 'ar' ? 'English' : 'العربية'}
            </div>
            <button 
              onClick={swapLanguages}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-all"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
            <div className="px-4 py-2 text-xs font-bold text-blue-500 uppercase tracking-widest">
              {targetLang === 'ar' ? 'العربية' : 'English'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="relative">
              <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={lang === 'ar' ? 'أدخل النص للترجمة...' : 'Enter text to translate...'}
                className="w-full h-64 bg-black border border-zinc-800 rounded-2xl p-6 text-white focus:outline-none focus:border-blue-500 transition-all resize-none text-lg leading-relaxed"
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button className="p-2 text-zinc-500 hover:text-white transition-colors">
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <button 
              onClick={handleTranslate} 
              disabled={isLoading || !text.trim()}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-600/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  {lang === 'ar' ? 'جاري الترجمة...' : 'Translating...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  {lang === 'ar' ? 'بدء الترجمة الذكية' : 'Start Smart Translation'}
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <div className={`w-full h-64 bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-white overflow-y-auto text-lg leading-relaxed ${!result && 'flex items-center justify-center text-zinc-600 italic'}`}>
              <AnimatePresence mode="wait">
                {result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="whitespace-pre-wrap"
                  >
                    {result}
                  </motion.div>
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {lang === 'ar' ? 'ستظهر الترجمة هنا...' : 'Translation will appear here...'}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {result && (
              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={copyToClipboard}
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
