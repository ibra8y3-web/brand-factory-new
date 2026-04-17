import React from 'react';
import { UploadCloud, Loader2, FileText, CheckCircle2 } from 'lucide-react';

interface UploadCenterProps {
  lang: 'ar' | 'en';
  fileInputRef: React.RefObject<HTMLInputElement>;
  isUploading: boolean;
  uploadProgress: number | null;
  onUpload: (files: FileList | null) => void;
}

export const UploadCenter: React.FC<UploadCenterProps> = ({ 
  lang, 
  fileInputRef, 
  isUploading, 
  uploadProgress, 
  onUpload 
}) => {
  return (
    <div className="space-y-6 flex flex-col h-full">
      <p className="text-sm text-zinc-400">
        {lang === 'ar' 
          ? 'رفع مشروعك الحالي ليقوم الذكاء الاصطناعي بتحليله والبناء عليه.' 
          : 'Upload your existing project for AI to analyze and build upon.'}
      </p>
      <div className="flex-1 flex flex-col gap-4">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          onChange={(e) => onUpload(e.target.files)}
        />
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 border-2 border-dashed ${isUploading ? 'border-orange-500 bg-orange-500/5' : 'border-zinc-800 hover:border-orange-500/50'} rounded-xl flex flex-col items-center justify-center p-8 text-center transition-colors bg-zinc-900/50 cursor-pointer`}
        >
          {isUploading ? (
            <div className="space-y-4 w-full max-w-xs">
              <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-zinc-400">
                  <span>UPLOADING...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }} 
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <UploadCloud className="w-8 h-8 text-zinc-400" />
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">{lang === 'ar' ? 'اختر ملفات المشروع' : 'Select Project Files'}</h4>
                <p className="text-xs text-zinc-500">{lang === 'ar' ? 'اسحب وأفلت المجلد هنا أو انقر للتصفح' : 'Drag & drop folder here or click to browse'}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-4">
                {['.js', '.ts', '.tsx', '.json', '.css', '.html'].map(ext => (
                  <span key={ext} className="px-2 py-1 bg-zinc-800/50 rounded text-[10px] text-zinc-500 font-mono">{ext}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <h4 className="text-xs font-mono uppercase text-zinc-500 mb-3 flex items-center gap-2">
            <FileText className="w-3 h-3" />
            {lang === 'ar' ? 'متطلبات الرفع' : 'Upload Requirements'}
          </h4>
          <ul className="space-y-2">
            {[
              lang === 'ar' ? 'دعم ملفات TypeScript و React' : 'TypeScript & React support',
              lang === 'ar' ? 'تحليل تلقائي للهيكل البرمجي' : 'Automatic structure analysis',
              lang === 'ar' ? 'الحجم الأقصى للمشروع: 50MB' : 'Max project size: 50MB',
            ].map((req, i) => (
              <li key={i} className="flex items-center gap-2 text-[10px] text-zinc-400">
                <CheckCircle2 className="w-3 h-3 text-orange-500" />
                {req}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
