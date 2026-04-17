import React from 'react';
import { Wrench, Loader2 } from 'lucide-react';

interface CodeEditorProps {
  lang: 'ar' | 'en';
  editorCode: string;
  setEditorCode: (code: string) => void;
  isAnalyzingCode: boolean;
  editorResult: string | null;
  onAnalyze: () => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ 
  lang, 
  editorCode, 
  setEditorCode, 
  isAnalyzingCode, 
  editorResult, 
  onAnalyze 
}) => {
  return (
    <div className="space-y-6 flex flex-col h-full">
      <p className="text-sm text-zinc-400">
        {lang === 'ar' 
          ? 'محرر الأكواد المدمج لتصحيح الأخطاء وتحليلها باستخدام الذكاء الاصطناعي (مدعوم بمحرك Groq Llama 3.3).' 
          : 'Integrated code editor for debugging and analysis using AI (Powered by Groq Llama 3.3).'}
      </p>
      <div className="flex-1 flex flex-col gap-4">
        <textarea 
          className="flex-1 w-full min-h-[300px] bg-zinc-900 border border-zinc-800 rounded-lg p-4 font-mono text-sm text-zinc-300 focus:outline-none focus:border-orange-500 resize-none"
          placeholder={lang === 'ar' ? 'اكتب أو الصق الكود هنا...' : 'Type or paste code here...'}
          value={editorCode}
          onChange={(e) => setEditorCode(e.target.value)}
        />
        <button 
          onClick={onAnalyze}
          disabled={isAnalyzingCode || !editorCode.trim()}
          className="w-full py-3 bg-orange-500 text-black font-bold rounded-lg hover:bg-orange-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isAnalyzingCode ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wrench className="w-5 h-5" />}
          {lang === 'ar' ? 'تحليل وتصحيح الكود' : 'Analyze & Fix Code'}
        </button>
        {editorResult && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-y-auto max-h-64">
            <h4 className="font-bold text-orange-500 mb-2">{lang === 'ar' ? 'النتيجة:' : 'Result:'}</h4>
            <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">{editorResult}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
