import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Loader2, ShieldAlert, Wrench, CheckCircle2, Trash2, Zap } from 'lucide-react';
import { brandApi } from '../../api/brandApi';
import { toast } from 'sonner';
import { errorStore } from '../../utils/errorStore';

export const SystemHealer: React.FC<{ lang: string }> = ({ lang }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isHealing, setIsHealing] = useState(false);
  const [activeHealId, setActiveHealId] = useState<string | null>(null);
  const [autoHealEnabled, setAutoHealEnabled] = useState(true);

  useEffect(() => {
    setLogs(errorStore.getLogs());
    
    const unsubscribe = errorStore.subscribe(() => {
      const currentLogs = errorStore.getLogs();
      setLogs([...currentLogs]);
      
      // Auto-heal logic
      if (autoHealEnabled) {
        const newPendingError = currentLogs.find(l => l.status === 'pending');
        if (newPendingError && !isHealing) {
          handleHeal(newPendingError.id, newPendingError.message);
        }
      }
    });
    
    return unsubscribe;
  }, [autoHealEnabled, isHealing]);

  const handleHeal = async (errorId: string, message: string) => {
    setIsHealing(true);
    setActiveHealId(errorId);
    errorStore.updateError(errorId, { status: 'healing' });
    
    try {
      const res = await brandApi.runSystemDiagnostics(message);
      errorStore.updateError(errorId, { 
        status: 'healed', 
        solution: res.analysis + (res.fixedCode ? '\n\nCode Fix:\n' + res.fixedCode : '')
      });
      toast.success(lang === 'ar' ? 'تم تشخيص وإصلاح الخطأ بنجاح!' : 'Error healed successfully!');
    } catch (error) {
      errorStore.updateError(errorId, { status: 'failed' });
      toast.error(lang === 'ar' ? 'فشل عملية الإصلاح' : 'Healing process failed');
    } finally {
      setIsHealing(false);
      setActiveHealId(null);
    }
  };

  const handleHealAll = async () => {
    const pendingErrors = logs.filter(l => l.status === 'pending' || l.status === 'failed');
    if (pendingErrors.length === 0) return;
    
    for (const err of pendingErrors) {
      await handleHeal(err.id, err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: Activity, label: lang === 'ar' ? 'حالة النظام' : 'System Status', value: logs.length === 0 ? 'Healthy' : 'Issues Detected', color: logs.length === 0 ? 'text-green-500' : 'text-orange-500' },
          { icon: ShieldAlert, label: lang === 'ar' ? 'الأخطاء المكتشفة' : 'Detected Errors', value: logs.length.toString(), color: 'text-red-500' },
          { icon: Zap, label: lang === 'ar' ? 'الإصلاح التلقائي' : 'Auto-Heal', value: autoHealEnabled ? 'ON' : 'OFF', color: autoHealEnabled ? 'text-yellow-500' : 'text-zinc-500' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl cursor-pointer"
            onClick={() => i === 2 && setAutoHealEnabled(!autoHealEnabled)}
          >
            <stat.icon className={`w-6 h-6 ${stat.color} mb-4`} />
            <div className="text-2xl font-black">{stat.value}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[32px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black flex items-center gap-2">
            <Wrench className="w-6 h-6 text-orange-500" />
            {lang === 'ar' ? 'مختبر كشف وإصلاح الأعطال التلقائي' : 'Auto-Healer Diagnostics'}
          </h2>
          
          <div className="flex gap-2">
            <button
              onClick={() => setAutoHealEnabled(!autoHealEnabled)}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors ${autoHealEnabled ? 'bg-yellow-500/20 text-yellow-500' : 'bg-zinc-800 text-zinc-400'}`}
            >
              <Zap className="w-4 h-4" />
              {autoHealEnabled ? (lang === 'ar' ? 'إيقاف التلقائي' : 'Disable Auto') : (lang === 'ar' ? 'تفعيل التلقائي' : 'Enable Auto')}
            </button>
            <button
              onClick={() => errorStore.clearLogs()}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              {lang === 'ar' ? 'مسح السجل' : 'Clear Logs'}
            </button>
            <button
              onClick={handleHealAll}
              disabled={isHealing || logs.filter(l => l.status === 'pending' || l.status === 'failed').length === 0}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
            >
              {isHealing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
              {lang === 'ar' ? 'إصلاح الكل' : 'Heal All'}
            </button>
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 flex flex-col items-center">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
              <p>{lang === 'ar' ? 'النظام يعمل بكفاءة. لا توجد أخطاء.' : 'System is running smoothly. No errors detected.'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map(log => (
                <motion.div 
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border ${log.status === 'healed' ? 'bg-green-900/10 border-green-900/30' : log.status === 'failed' ? 'bg-red-900/10 border-red-900/30' : 'bg-black border-zinc-800'}`}
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${log.status === 'healed' ? 'bg-green-500/20 text-green-400' : log.status === 'failed' ? 'bg-red-500/20 text-red-400' : log.status === 'healing' ? 'bg-orange-500/20 text-orange-400' : 'bg-zinc-800 text-zinc-400'}`}>
                          {log.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-zinc-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        {log.source && <span className="text-xs text-zinc-500 font-mono bg-zinc-900 px-2 py-0.5 rounded">{log.source}</span>}
                      </div>
                      <p className="text-sm text-red-400 font-mono break-all">{log.message}</p>
                    </div>
                    
                    {log.status !== 'healed' && (
                      <button
                        onClick={() => handleHeal(log.id, log.message)}
                        disabled={isHealing}
                        className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors whitespace-nowrap"
                      >
                        {activeHealId === log.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wrench className="w-3 h-3" />}
                        {lang === 'ar' ? 'إصلاح' : 'Heal'}
                      </button>
                    )}
                  </div>
                  
                  {log.solution && (
                    <div className="mt-4 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                      <h4 className="text-xs font-bold text-green-400 mb-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {lang === 'ar' ? 'نتيجة الإصلاح' : 'Healing Result'}
                      </h4>
                      <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap overflow-x-auto">
                        {log.solution}
                      </pre>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
