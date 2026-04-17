import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, FileCode, ArrowRight, Download, Loader2, Copy, CheckCircle2, Eye, Play, Smartphone, Monitor } from 'lucide-react';
import { brandApi } from '../../api/brandApi';
import { toast } from 'sonner';
import JSZip from 'jszip';

export const ProjectTranspiler = () => {
  const [sourceCode, setSourceCode] = useState('');
  const [targetFramework, setTargetFramework] = useState('Flutter');
  const [isTranspiling, setIsTranspiling] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [copiedStates, setCopiedStates] = useState<Record<number, boolean>>({});

  const handleTranspile = async () => {
    if (!sourceCode) {
      toast.error('يرجى إدخال الكود المصدري أولاً');
      return;
    }

    setIsTranspiling(true);
    setResult(null);
    setPreviewUrl(null);
    setActiveTab('code');
    
    try {
      const prompt = `Transpile the following React code to ${targetFramework}. 
      Provide the output as a JSON object with a 'files' array, where each item has 'path' and 'content'.
      Reconstruct the full project structure.
      
      Source Code:
      ${sourceCode}`;

      const res = await brandApi.generateChat(prompt, 'coding');
      const response = res.text;
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        setResult(JSON.parse(jsonMatch[0]));
        toast.success('تم تحويل المشروع بنجاح');
      } else {
        setResult({ files: [{ path: `main.${targetFramework === 'Flutter' ? 'dart' : 'tsx'}`, content: response }] });
        toast.success('تم التحويل بنجاح (ملف واحد)');
      }
    } catch (error) {
      toast.error('فشل تحويل المشروع');
    } finally {
      setIsTranspiling(false);
    }
  };

  const handlePreview = async () => {
    if (!result?.files) return;
    setIsPreviewing(true);
    setActiveTab('preview');
    try {
      const framework = targetFramework.toLowerCase().includes('next') ? 'nextjs' : 'flutter';
      const res = await brandApi.previewProject(result.files, framework);
      
      if (res.html) {
        // Create a blob URL for the HTML content to be used in the iframe
        const blob = new Blob([res.html], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        setPreviewUrl(url);
        toast.success('تم تشغيل المحاكاة بنجاح');
      } else {
        setPreviewUrl(res.previewUrl || 'https://flutter-web-demo.firebaseapp.com/'); 
        toast.success('تم تشغيل المحاكاة بنجاح (وضع العرض)');
      }
    } catch (error) {
      toast.error('فشل تشغيل المحاكاة');
      setActiveTab('code');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!result?.files) return;
    try {
      const zip = new JSZip();
      result.files.forEach((f: any) => {
        zip.file(f.path, f.content);
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project_${targetFramework.toLowerCase()}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('تم تحميل المشروع كـ ZIP');
    } catch (e) {
      console.error(e);
      toast.error('فشل تحميل المشروع كـ ZIP');
    }
  };

  const handleCopy = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedStates(prev => ({ ...prev, [idx]: true }));
    toast.success('تم النسخ');
    setTimeout(() => setCopiedStates(prev => ({ ...prev, [idx]: false })), 2000);
  };

  const handleDownloadFile = (file: any) => {
    const blob = new Blob([file.content], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.path.split('/').pop() || 'file';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('تم تحميل الملف');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <RefreshCw className="text-blue-400" />
            محول المشاريع (Project Transpiler)
          </h2>
          <p className="text-gray-400">حول مشاريعك من React إلى Flutter أو Next.js بضغطة زر مع معاينة حية</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-black/40 border border-white/10 rounded-xl p-4">
            <label className="block text-sm font-medium text-gray-400 mb-2">الكود المصدري (React)</label>
            <textarea
              value={sourceCode}
              onChange={(e) => setSourceCode(e.target.value)}
              placeholder="الصق كود React هنا..."
              className="w-full h-[400px] bg-transparent border-none focus:ring-0 text-gray-300 font-mono text-sm resize-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <select
              value={targetFramework}
              onChange={(e) => setTargetFramework(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500 transition-colors"
            >
              <option value="Flutter">Flutter</option>
              <option value="Next.js">Next.js</option>
              <option value="SwiftUI">SwiftUI</option>
            </select>

            <button
              onClick={handleTranspile}
              disabled={isTranspiling}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 font-medium flex items-center justify-center gap-2 transition-all"
            >
              {isTranspiling ? <Loader2 className="animate-spin" /> : <RefreshCw size={18} />}
              تحويل المشروع الآن
            </button>
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl p-4 overflow-hidden flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex bg-zinc-900 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('code')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'code' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                <FileCode size={14} />
                الأكواد
              </button>
              <button
                onClick={() => {
                  if (result) handlePreview();
                }}
                disabled={!result}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'preview' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300 disabled:opacity-30'}`}
              >
                <Eye size={14} />
                المعاينة الحية
              </button>
            </div>
            
            {result && activeTab === 'code' && (
              <button onClick={handleDownloadAll} className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                <Download size={14} />
                تحميل الكل (ZIP)
              </button>
            )}
          </div>

          <div className="flex-1 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {activeTab === 'code' ? (
                <motion.div
                  key="code"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="h-full overflow-y-auto space-y-4 pr-2 custom-scrollbar"
                >
                  {!result && !isTranspiling && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2 py-20">
                      <FileCode size={48} className="opacity-20" />
                      <p>سيظهر المشروع المحول هنا</p>
                    </div>
                  )}

                  {isTranspiling && (
                    <div className="h-full flex flex-col items-center justify-center text-blue-400 space-y-2 py-20">
                      <Loader2 size={48} className="animate-spin opacity-50" />
                      <p>جاري إعادة بناء المشروع...</p>
                    </div>
                  )}

                  {result?.files?.map((file: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-white/5 border border-white/5 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-blue-300">{file.path}</span>
                        <div className="flex gap-2">
                          <button onClick={() => handleCopy(file.content, idx)} className="text-gray-500 hover:text-white transition-colors">
                            {copiedStates[idx] ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                          </button>
                          <button onClick={() => handleDownloadFile(file)} className="text-gray-500 hover:text-white transition-colors">
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                      <pre className="text-xs text-gray-400 font-mono overflow-x-auto p-2 bg-black/20 rounded">
                        {file.content}
                      </pre>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="h-full flex flex-col"
                >
                  {isPreviewing ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-blue-400 space-y-4">
                      <div className="relative">
                        <Loader2 size={64} className="animate-spin opacity-20" />
                        <Play className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold">جاري تشغيل المحاكي...</p>
                        <p className="text-xs text-gray-500">يتم الآن بناء بيئة {targetFramework} الافتراضية</p>
                      </div>
                    </div>
                  ) : previewUrl ? (
                    <div className="flex-1 flex flex-col gap-4">
                      <div className="flex items-center justify-center gap-4 p-2 bg-zinc-900/50 rounded-lg border border-white/5">
                        <button className="p-2 text-blue-400 bg-blue-400/10 rounded-lg"><Smartphone size={18} /></button>
                        <button className="p-2 text-zinc-500 hover:text-zinc-300"><Monitor size={18} /></button>
                      </div>
                      <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-2xl relative group">
                        <iframe
                          src={previewUrl}
                          className="w-full h-full border-none"
                          title="Project Preview"
                        />
                        <div className="absolute inset-0 pointer-events-none border-[8px] border-zinc-900 rounded-2xl" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
                      <Eye size={48} className="opacity-20" />
                      <p>اضغط على "المعاينة الحية" لتشغيل المشروع</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
