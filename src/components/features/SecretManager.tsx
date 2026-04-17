import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Key, AlertTriangle, CheckCircle2, Download, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { brandApi } from '../../api/brandApi';
import { toast } from 'sonner';

export const SecretManager = () => {
  const [envContent, setEnvContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showSecrets, setShowSecrets] = useState(false);

  const handleAnalyze = async () => {
    if (!envContent) {
      toast.error('يرجى إدخال محتوى ملف .env أولاً');
      return;
    }

    setIsAnalyzing(true);
    try {
      const prompt = `Analyze the following .env file content for potential issues:
      1. Missing required keys for common frameworks.
      2. Leaked or exposed keys (check formats).
      3. Security best practices.
      
      Return a JSON object with:
      - 'status': 'secure' | 'warning' | 'danger'
      - 'issues': Array of { type: 'missing' | 'leaked' | 'info', message: string }
      - 'recommendations': Array of strings
      
      Content:
      ${envContent}`;

      const res = await brandApi.generateChat(prompt, 'coding');
      const response = res.text;
      
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        setAnalysis(JSON.parse(jsonMatch[0]));
        toast.success('تم تحليل الأمان بنجاح');
      } else {
        toast.error('فشل تحليل الأمان');
      }
    } catch (error) {
      toast.error('فشل تحليل الأمان');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-red-400" />
            مدير البيئة والمفاتيح (Env & Secret Manager)
          </h2>
          <p className="text-gray-400">إدارة ملفات الـ .env بشكل آمن وتفادي تسريب المفاتيح</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-black/40 border border-white/10 rounded-xl p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-400">محتوى ملف .env</label>
              <button 
                onClick={() => setShowSecrets(!showSecrets)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                {showSecrets ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <textarea
              value={envContent}
              onChange={(e) => setEnvContent(e.target.value)}
              placeholder="STRIPE_KEY=sk_test_..."
              className={`w-full h-[300px] bg-transparent border-none focus:ring-0 text-gray-300 font-mono text-sm resize-none ${!showSecrets && 'blur-sm select-none'}`}
            />
            {!showSecrets && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Lock className="text-white/10" size={64} />
              </div>
            )}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg py-3 font-medium flex items-center justify-center gap-2 transition-all"
          >
            {isAnalyzing ? <Loader2 className="animate-spin" /> : <Shield size={18} />}
            فحص أمان المفاتيح
          </button>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl p-4 overflow-hidden flex flex-col">
          <label className="text-sm font-medium text-gray-400 mb-4">تقرير الأمان</label>

          <div className="flex-1 overflow-y-auto space-y-6">
            {!analysis && !isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
                <Key size={48} className="opacity-20" />
                <p>سيظهر تقرير الأمان هنا</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center text-red-400 space-y-2">
                <Loader2 size={48} className="animate-spin opacity-50" />
                <p>جاري فحص الثغرات والمفاتيح...</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-6">
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                  analysis.status === 'secure' ? 'bg-green-500/10 border border-green-500/20 text-green-400' :
                  analysis.status === 'warning' ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' :
                  'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}>
                  {analysis.status === 'secure' ? <CheckCircle2 /> : <AlertTriangle />}
                  <span className="font-bold uppercase tracking-wider">
                    حالة الأمان: {analysis.status === 'secure' ? 'آمن' : analysis.status === 'warning' ? 'تحذير' : 'خطر'}
                  </span>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase">المشاكل المكتشفة:</h4>
                  {analysis.issues.map((issue: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                        issue.type === 'missing' ? 'bg-yellow-500' :
                        issue.type === 'leaked' ? 'bg-red-500' : 'bg-blue-500'
                      }`} />
                      <span className="text-gray-300">{issue.message}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase">توصيات الذكاء الاصطناعي:</h4>
                  {analysis.recommendations.map((rec: string, idx: number) => (
                    <div key={idx} className="bg-white/5 p-3 rounded-lg text-sm text-gray-400 border border-white/5">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
