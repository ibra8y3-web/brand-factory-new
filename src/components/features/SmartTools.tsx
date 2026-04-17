import React, { useState } from 'react';
import { TrendingUp, Code, ShieldCheck, Loader2, CheckCircle2, AlertTriangle, AlertCircle, Wrench, BrainCircuit, Activity } from 'lucide-react';
import { brandApi } from '../../api/brandApi';
import { toast } from 'sonner';

interface SmartToolsProps {
  lang: 'ar' | 'en';
}

export const SmartTools: React.FC<SmartToolsProps> = ({ lang }) => {
  const [activeTool, setActiveTool] = useState<'seo' | 'formatter' | 'security' | 'deploymentDoctor' | 'agentSwarm' | 'selfHealing' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // SEO State
  const [seoContent, setSeoContent] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [seoResult, setSeoResult] = useState<any>(null);

  // Deployment Doctor State
  const [errorImage, setErrorImage] = useState<string | null>(null);
  const [deploymentDoctorResult, setDeploymentDoctorResult] = useState<any>(null);

  // Agent Swarm State
  const [agentSwarmTask, setAgentSwarmTask] = useState('');
  const [agentSwarmResult, setAgentSwarmResult] = useState<any>(null);

  // Self-Healing State
  const [selfHealingLogs, setSelfHealingLogs] = useState('');
  const [selfHealingResult, setSelfHealingResult] = useState<any>(null);

  // Formatter State
  const [formatterCode, setFormatterCode] = useState('// Write or paste your code here\nfunction hello() {\nconsole.log("world")\n}');
  const [formatterResult, setFormatterResult] = useState('');

  // Security State
  const [securityCode, setSecurityCode] = useState('// Paste code to analyze for vulnerabilities\nconst dbPassword = "my_secret_password";\nfunction login(user, pass) {\n  if(pass == dbPassword) return true;\n}');
  const [securityResult, setSecurityResult] = useState<any>(null);

  const handleDeploymentDoctor = async () => {
    if (!errorImage) {
      toast.error(lang === 'ar' ? 'يرجى رفع صورة الخطأ أولاً' : 'Please upload an error image first');
      return;
    }
    setIsLoading(true);
    try {
      const prompt = `Analyze this deployment/server error screenshot. Identify the error message, the likely cause, and provide a step-by-step fix including the exact terminal command to run.
      Return a JSON object with:
      - 'errorName': string
      - 'cause': string
      - 'solution': Array of strings
      - 'terminalCommand': string (the exact command to run in terminal)`;

      const res = await brandApi.visionChat(prompt, errorImage);
      const result = res.text;
      
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        setDeploymentDoctorResult(JSON.parse(jsonMatch[0]));
        toast.success(lang === 'ar' ? 'تم تحليل الخطأ بنجاح' : 'Error analyzed successfully');
      } else {
        toast.error(lang === 'ar' ? 'فشل تحليل الصورة' : 'Failed to analyze image');
      }
    } catch (error) {
      toast.error(lang === 'ar' ? 'فشل التحليل' : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setErrorImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (activeTool === 'agentSwarm') {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 flex flex-col h-full">
        <button onClick={() => setActiveTool(null)} className="text-sm text-zinc-400 hover:text-white mb-4">
          &larr; {lang === 'ar' ? 'العودة للأدوات' : 'Back to Tools'}
        </button>
        <h3 className="text-lg font-bold text-indigo-500 flex items-center gap-2">
          <BrainCircuit className="w-5 h-5" />
          {lang === 'ar' ? 'أوركسترا الوكلاء' : 'Agent Swarm Orchestrator'} 🤖🐝
        </h3>
        <textarea
          value={agentSwarmTask}
          onChange={(e) => setAgentSwarmTask(e.target.value)}
          placeholder={lang === 'ar' ? 'أدخل المهمة الكبيرة هنا...' : 'Enter your large task here...'}
          className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-white focus:border-indigo-500 outline-none"
        />
        <button
          onClick={async () => {
            setIsLoading(true);
            try {
              const res = await brandApi.post('/agent-swarm', { task: agentSwarmTask });
              setAgentSwarmResult(res);
              toast.success(lang === 'ar' ? 'تم توزيع المهام بنجاح' : 'Tasks distributed successfully');
            } catch (error) {
              toast.error(lang === 'ar' ? 'فشل التوزيع' : 'Orchestration failed');
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading || !agentSwarmTask}
          className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors flex justify-center items-center gap-2"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
          {lang === 'ar' ? 'بدء الأوركسترا' : 'Start Orchestration'}
        </button>
        {agentSwarmResult && (
          <div className="mt-4 space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            <div className="p-4 bg-indigo-900/20 border border-indigo-500/20 rounded-xl text-indigo-300 text-sm">
              <h4 className="font-bold mb-2 uppercase text-xs tracking-widest">{lang === 'ar' ? 'خطة العمل' : 'Execution Plan'}</h4>
              <p className="leading-relaxed">{agentSwarmResult.plan}</p>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {agentSwarmResult.agents?.map((agent: any, i: number) => (
                <div key={`agent-${i}-${agent.name}`} className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-400">{agent.name}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded-full">{agent.role}</span>
                  </div>
                  <p className="text-xs text-zinc-400">{agent.task}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTool === 'selfHealing') {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 flex flex-col h-full">
        <button onClick={() => setActiveTool(null)} className="text-sm text-zinc-400 hover:text-white mb-4">
          &larr; {lang === 'ar' ? 'العودة للأدوات' : 'Back to Tools'}
        </button>
        <h3 className="text-lg font-bold text-teal-500 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          {lang === 'ar' ? 'التعافي الذاتي للكود' : 'Self-Healing Codebase'} 🩹
        </h3>
        <textarea
          value={selfHealingLogs}
          onChange={(e) => setSelfHealingLogs(e.target.value)}
          placeholder={lang === 'ar' ? 'أدخل سجلات الخطأ (Logs) هنا...' : 'Paste build logs here...'}
          className="w-full h-48 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs text-white font-mono focus:border-teal-500 outline-none"
        />
        <button
          onClick={async () => {
            setIsLoading(true);
            try {
              const res = await brandApi.post('/self-healing', { logs: selfHealingLogs });
              setSelfHealingResult(res);
              toast.success(lang === 'ar' ? 'تم تحليل الخطأ' : 'Error analyzed');
            } catch (error) {
              toast.error(lang === 'ar' ? 'فشل التحليل' : 'Analysis failed');
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading || !selfHealingLogs}
          className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-500 transition-colors flex justify-center items-center gap-2"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Activity className="w-5 h-5" />}
          {lang === 'ar' ? 'بدء الإصلاح الذاتي' : 'Start Self-Healing'}
        </button>
        {selfHealingResult && (
          <div className="p-4 bg-teal-900/20 border border-teal-500/20 rounded-xl text-teal-300 text-sm">
            {selfHealingResult.message || JSON.stringify(selfHealingResult)}
          </div>
        )}
      </div>
    );
  }

  if (activeTool === 'deploymentDoctor') {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 flex flex-col h-full">
        <button onClick={() => setActiveTool(null)} className="text-sm text-zinc-400 hover:text-white mb-4">
          &larr; {lang === 'ar' ? 'العودة للأدوات' : 'Back to Tools'}
        </button>
        <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {lang === 'ar' ? 'طبيب النشر (Deployment Doctor)' : 'Deployment Doctor'} 🩺
        </h3>
        
        <div className="space-y-4">
          <div 
            className="w-full h-48 border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-2 bg-zinc-900/50 hover:bg-zinc-900 transition-colors cursor-pointer relative overflow-hidden"
            onClick={() => document.getElementById('error-upload')?.click()}
          >
            {errorImage ? (
              <img src={errorImage} alt="Error" className="w-full h-full object-contain" />
            ) : (
              <>
                <AlertCircle className="w-8 h-8 text-zinc-600" />
                <p className="text-xs text-zinc-500">{lang === 'ar' ? 'ارفع صورة الخطأ هنا' : 'Upload error screenshot here'}</p>
              </>
            )}
            <input 
              id="error-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload}
            />
          </div>

          <button
            onClick={handleDeploymentDoctor}
            disabled={isLoading || !errorImage}
            className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertCircle className="w-5 h-5" />}
            {lang === 'ar' ? 'تحليل الخطأ بالذكاء الاصطناعي' : 'Analyze Error with AI'}
          </button>
        </div>

        {deploymentDoctorResult && (
          <div className="mt-6 space-y-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800 overflow-y-auto">
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <h4 className="text-red-400 text-xs font-bold uppercase mb-1">{lang === 'ar' ? 'الخطأ المكتشف' : 'Detected Error'}</h4>
              <p className="text-white font-mono text-sm">{deploymentDoctorResult.errorName}</p>
            </div>

            <div>
              <h4 className="text-zinc-400 text-xs uppercase mb-1">{lang === 'ar' ? 'السبب المحتمل' : 'Likely Cause'}</h4>
              <p className="text-zinc-300 text-sm">{deploymentDoctorResult.cause}</p>
            </div>

            <div>
              <h4 className="text-zinc-400 text-xs uppercase mb-2">{lang === 'ar' ? 'خطوات الحل' : 'Solution Steps'}</h4>
              <ul className="space-y-2">
                {deploymentDoctorResult.solution.map((step: string, i: number) => (
                  <li key={`sol-${i}-${step.substring(0, 10)}`} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="w-5 h-5 bg-zinc-800 rounded flex items-center justify-center text-[10px] flex-shrink-0">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {deploymentDoctorResult.terminalCommand && (
              <div>
                <h4 className="text-zinc-400 text-xs uppercase mb-2">{lang === 'ar' ? 'الأمر المطلوب' : 'Terminal Command'}</h4>
                <pre className="bg-black/50 p-3 rounded-lg text-[10px] text-green-400 font-mono overflow-x-auto">
                  {deploymentDoctorResult.terminalCommand}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const handleSEO = async () => {
    if (!seoContent || !seoKeywords) {
      toast.error(lang === 'ar' ? 'يرجى إدخال المحتوى والكلمات المفتاحية' : 'Please enter content and keywords');
      return;
    }
    setIsLoading(true);
    try {
      const keywordsArray = seoKeywords.split(',').map(k => k.trim());
      const result = await brandApi.optimizeSEO(seoContent, keywordsArray);
      setSeoResult(result);
      toast.success(lang === 'ar' ? 'تم التحليل بنجاح' : 'Analysis successful');
    } catch (error) {
      toast.error(lang === 'ar' ? 'فشل التحليل' : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormatter = async () => {
    if (!formatterCode) return;
    setIsLoading(true);
    try {
      const result = await brandApi.analyzeCode(formatterCode);
      setFormatterResult(result.fixedCode);
      toast.success(lang === 'ar' ? 'تم تنسيق الكود بنجاح' : 'Code formatted successfully');
    } catch (error) {
      toast.error(lang === 'ar' ? 'فشل التنسيق' : 'Formatting failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurity = async () => {
    if (!securityCode) return;
    setIsLoading(true);
    try {
      const result = await brandApi.analyzeSecurity(securityCode);
      setSecurityResult(result);
      toast.success(lang === 'ar' ? 'تم فحص الأمان بنجاح' : 'Security check completed');
    } catch (error) {
      toast.error(lang === 'ar' ? 'فشل الفحص' : 'Check failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (activeTool === 'seo') {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
        <button onClick={() => setActiveTool(null)} className="text-sm text-zinc-400 hover:text-white mb-4">
          &larr; {lang === 'ar' ? 'العودة للأدوات' : 'Back to Tools'}
        </button>
        <h3 className="text-lg font-bold text-orange-500 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          {lang === 'ar' ? 'مُحسّن محركات البحث (SEO)' : 'SEO Optimizer'}
        </h3>
        <textarea
          value={seoContent}
          onChange={(e) => setSeoContent(e.target.value)}
          placeholder={lang === 'ar' ? 'أدخل النص هنا...' : 'Enter content here...'}
          className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-white focus:border-orange-500 outline-none"
        />
        <input
          type="text"
          value={seoKeywords}
          onChange={(e) => setSeoKeywords(e.target.value)}
          placeholder={lang === 'ar' ? 'الكلمات المفتاحية (مفصولة بفاصلة)' : 'Keywords (comma separated)'}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-white focus:border-orange-500 outline-none"
        />
        <button
          onClick={handleSEO}
          disabled={isLoading}
          className="w-full py-3 bg-orange-500 text-black font-bold rounded-xl hover:bg-orange-400 transition-colors flex justify-center items-center gap-2"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <TrendingUp className="w-5 h-5" />}
          {lang === 'ar' ? 'تحليل وتحسين' : 'Analyze & Optimize'}
        </button>

        {seoResult && (
          <div className="mt-6 space-y-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <div>
              <h4 className="text-zinc-400 text-xs uppercase mb-1">{lang === 'ar' ? 'العنوان المحسن' : 'Optimized Title'}</h4>
              <p className="text-white font-medium">{seoResult.optimizedTitle}</p>
            </div>
            <div>
              <h4 className="text-zinc-400 text-xs uppercase mb-1">{lang === 'ar' ? 'الوصف التعريفي' : 'Meta Description'}</h4>
              <p className="text-zinc-300 text-sm">{seoResult.metaDescription}</p>
            </div>
            <div>
              <h4 className="text-zinc-400 text-xs uppercase mb-2">{lang === 'ar' ? 'كلمات مفتاحية مقترحة' : 'Suggested Keywords'}</h4>
              <div className="flex flex-wrap gap-2">
                {seoResult.keywordSuggestions?.map((k: string, i: number) => (
                  <span key={`key-${i}-${k}`} className="px-2 py-1 bg-zinc-800 rounded-md text-xs text-zinc-300">{k}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-zinc-400 text-xs uppercase mb-2">{lang === 'ar' ? 'تحسينات مقترحة' : 'Suggested Improvements'}</h4>
              <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1">
                {seoResult.contentImprovements?.map((imp: string, i: number) => (
                  <li key={`imp-${i}-${imp.substring(0, 10)}`}>{imp}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeTool === 'formatter') {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 flex flex-col h-full">
        <button onClick={() => setActiveTool(null)} className="text-sm text-zinc-400 hover:text-white mb-4">
          &larr; {lang === 'ar' ? 'العودة للأدوات' : 'Back to Tools'}
        </button>
        <h3 className="text-lg font-bold text-blue-500 flex items-center gap-2">
          <Code className="w-5 h-5" />
          {lang === 'ar' ? 'منسق الأكواد الذكي' : 'Smart Code Formatter'}
        </h3>
        <textarea
          value={formatterCode}
          onChange={(e) => setFormatterCode(e.target.value)}
          className="w-full h-64 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs text-white font-mono focus:border-blue-500 outline-none resize-none"
          spellCheck={false}
        />
        <button
          onClick={handleFormatter}
          disabled={isLoading}
          className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-400 transition-colors flex justify-center items-center gap-2"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Code className="w-5 h-5" />}
          {lang === 'ar' ? 'تنسيق وإصلاح الكود' : 'Format & Fix Code'}
        </button>
        
        {formatterResult && (
          <div className="mt-4">
            <h4 className="text-zinc-400 text-xs uppercase mb-2">{lang === 'ar' ? 'النتيجة' : 'Result'}</h4>
            <textarea
              readOnly
              value={formatterResult}
              className="w-full h-64 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs text-white font-mono outline-none resize-none"
              spellCheck={false}
            />
          </div>
        )}
      </div>
    );
  }

  if (activeTool === 'security') {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 flex flex-col h-full">
        <button onClick={() => setActiveTool(null)} className="text-sm text-zinc-400 hover:text-white mb-4">
          &larr; {lang === 'ar' ? 'العودة للأدوات' : 'Back to Tools'}
        </button>
        <h3 className="text-lg font-bold text-green-500 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          {lang === 'ar' ? 'مدقق الأمان' : 'Security Checker'}
        </h3>
        <textarea
          value={securityCode}
          onChange={(e) => setSecurityCode(e.target.value)}
          className="w-full h-64 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs text-white font-mono focus:border-green-500 outline-none resize-none"
          spellCheck={false}
        />
        <button
          onClick={handleSecurity}
          disabled={isLoading}
          className="w-full py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-400 transition-colors flex justify-center items-center gap-2"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
          {lang === 'ar' ? 'فحص الأمان' : 'Run Security Check'}
        </button>

        {securityResult && (
          <div className="mt-6 space-y-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between">
              <h4 className="text-zinc-400 text-xs uppercase">{lang === 'ar' ? 'درجة الأمان' : 'Security Score'}</h4>
              <span className={`text-xl font-black ${securityResult.score > 80 ? 'text-green-500' : securityResult.score > 50 ? 'text-orange-500' : 'text-red-500'}`}>
                {securityResult.score}/100
              </span>
            </div>
            
            {securityResult.vulnerabilities?.length > 0 ? (
              <div>
                <h4 className="text-zinc-400 text-xs uppercase mb-2">{lang === 'ar' ? 'الثغرات المكتشفة' : 'Detected Vulnerabilities'}</h4>
                <div className="space-y-2">
                  {securityResult.vulnerabilities.map((v: any, i: number) => (
                    <div key={`vuln-${i}-${v.title}`} className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                      <div className="flex items-center gap-2 mb-1">
                        {v.severity === 'High' ? <AlertCircle className="w-4 h-4 text-red-500" /> : 
                         v.severity === 'Medium' ? <AlertTriangle className="w-4 h-4 text-orange-500" /> : 
                         <AlertCircle className="w-4 h-4 text-yellow-500" />}
                        <span className="font-bold text-sm text-zinc-200">{v.title}</span>
                      </div>
                      <p className="text-xs text-zinc-400">{v.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-500 p-3 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">{lang === 'ar' ? 'لم يتم اكتشاف ثغرات خطيرة' : 'No critical vulnerabilities detected'}</span>
              </div>
            )}

            {securityResult.recommendations?.length > 0 && (
              <div>
                <h4 className="text-zinc-400 text-xs uppercase mb-2">{lang === 'ar' ? 'توصيات الأمان' : 'Security Recommendations'}</h4>
                <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1">
                  {securityResult.recommendations.map((rec: string, i: number) => (
                    <li key={`rec-${i}-${rec.substring(0, 10)}`}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-6">
        <h3 className="text-purple-500 font-bold mb-2 flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          {lang === 'ar' ? 'أدوات الذكاء الاصطناعي' : 'AI Smart Tools'}
        </h3>
        <p className="text-sm text-zinc-400">
          {lang === 'ar' ? 'مجموعة من الأدوات الذكية المساعدة لتطوير وتحسين مشاريعك.' : 'A collection of smart assistant tools to develop and improve your projects.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button 
          onClick={() => setActiveTool('seo')}
          className="flex items-start gap-4 p-4 bg-zinc-900 border border-zinc-800 hover:border-orange-500/50 rounded-xl transition-all text-left group"
        >
          <div className="p-2 bg-zinc-800 group-hover:bg-orange-500/20 rounded-lg text-zinc-400 group-hover:text-orange-500 transition-colors">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-zinc-200 group-hover:text-white mb-1">
              {lang === 'ar' ? 'مُحسّن محركات البحث (SEO)' : 'SEO Optimizer'}
            </h4>
            <p className="text-xs text-zinc-500">
              {lang === 'ar' ? 'تحليل وتحسين نصوصك لتصدر نتائج البحث.' : 'Analyze and optimize your texts to rank higher in search results.'}
            </p>
          </div>
        </button>

        <button 
          onClick={() => setActiveTool('formatter')}
          className="flex items-start gap-4 p-4 bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 rounded-xl transition-all text-left group"
        >
          <div className="p-2 bg-zinc-800 group-hover:bg-blue-500/20 rounded-lg text-zinc-400 group-hover:text-blue-500 transition-colors">
            <Code className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-zinc-200 group-hover:text-white mb-1">
              {lang === 'ar' ? 'منسق الأكواد الذكي' : 'Smart Code Formatter'}
            </h4>
            <p className="text-xs text-zinc-500">
              {lang === 'ar' ? 'تنسيق وتنظيف الأكواد البرمجية تلقائياً.' : 'Automatically format and clean up source code.'}
            </p>
          </div>
        </button>

        <button 
          onClick={() => setActiveTool('security')}
          className="flex items-start gap-4 p-4 bg-zinc-900 border border-zinc-800 hover:border-green-500/50 rounded-xl transition-all text-left group"
        >
          <div className="p-2 bg-zinc-800 group-hover:bg-green-500/20 rounded-lg text-zinc-400 group-hover:text-green-500 transition-colors">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-zinc-200 group-hover:text-white mb-1">
              {lang === 'ar' ? 'مدقق الأمان' : 'Security Checker'}
            </h4>
            <p className="text-xs text-zinc-500">
              {lang === 'ar' ? 'فحص الأكواد لاكتشاف الثغرات الأمنية.' : 'Scan code to discover security vulnerabilities.'}
            </p>
          </div>
        </button>

        <button 
          onClick={() => setActiveTool('agentSwarm')}
          className="flex items-start gap-4 p-4 bg-zinc-900 border border-zinc-800 hover:border-indigo-500/50 rounded-xl transition-all text-left group"
        >
          <div className="p-2 bg-zinc-800 group-hover:bg-indigo-500/20 rounded-lg text-zinc-400 group-hover:text-indigo-500 transition-colors">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-zinc-200 group-hover:text-white mb-1">
              {lang === 'ar' ? 'أوركسترا الوكلاء (Agent Swarm)' : 'Agent Swarm Orchestrator'} 🤖🐝
            </h4>
            <p className="text-xs text-zinc-500">
              {lang === 'ar' ? 'إدارة خلية نحل من الذكاء الاصطناعي لتنفيذ المهام.' : 'Manage a swarm of AI agents to execute complex tasks.'}
            </p>
          </div>
        </button>

        <button 
          onClick={() => setActiveTool('selfHealing')}
          className="flex items-start gap-4 p-4 bg-zinc-900 border border-zinc-800 hover:border-teal-500/50 rounded-xl transition-all text-left group"
        >
          <div className="p-2 bg-zinc-800 group-hover:bg-teal-500/20 rounded-lg text-zinc-400 group-hover:text-teal-500 transition-colors">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-zinc-200 group-hover:text-white mb-1">
              {lang === 'ar' ? 'التعافي الذاتي للكود (Self-Healing)' : 'Self-Healing Codebase'} 🩹
            </h4>
            <p className="text-xs text-zinc-500">
              {lang === 'ar' ? 'إصلاح أخطاء البناء تلقائياً.' : 'Automatically fix build errors.'}
            </p>
          </div>
        </button>

        <button 
          onClick={() => setActiveTool('deploymentDoctor')}
          className="flex items-start gap-4 p-4 bg-zinc-900 border border-zinc-800 hover:border-red-500/50 rounded-xl transition-all text-left group"
        >
          <div className="p-2 bg-zinc-800 group-hover:bg-red-500/20 rounded-lg text-zinc-400 group-hover:text-red-500 transition-colors">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-zinc-200 group-hover:text-white mb-1">
              {lang === 'ar' ? 'طبيب النشر (Deployment Doctor)' : 'Deployment Doctor'} 🩺
            </h4>
            <p className="text-xs text-zinc-500">
              {lang === 'ar' ? 'تحليل أخطاء النشر وإيجاد الحلول فوراً.' : 'Analyze deployment errors and find solutions instantly.'}
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
