import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Zap, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { brandApi } from '../../api/brandApi';

interface DiagnosticsCenterProps {
  lang: 'ar' | 'en';
}

export const DiagnosticsCenter: React.FC<DiagnosticsCenterProps> = ({ lang }) => {
  const [bestModels, setBestModels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBestModels = async () => {
      try {
        const data = await brandApi.getBestModels();
        setBestModels(data);
      } catch (error) {
        console.error("Failed to fetch best models for diagnostics");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBestModels();
  }, []);

  const getModelForType = (type: string) => {
    const found = bestModels.find(bm => bm.type === type);
    return found?.model?.name || (lang === 'ar' ? 'جاري التحميل...' : 'Loading...');
  };

  const engines = [
    { 
      name: lang === 'ar' ? 'محرك ذكاء رئيسي' : 'Primary AI Engine', 
      model: getModelForType('general'), 
      desc: lang === 'ar' ? 'المحرك الرئيسي للدردشة والاستراتيجية' : 'Primary engine for chat & strategy', 
      status: 'ACTIVE', 
      color: 'text-green-500' 
    },
    { 
      name: lang === 'ar' ? 'محرك تحليل عميق' : 'Deep Analysis Engine', 
      model: getModelForType('coding'), 
      desc: lang === 'ar' ? 'تحليل المشاعر والبيانات اللغوية' : 'Sentiment & linguistic analysis', 
      status: 'ACTIVE', 
      color: 'text-green-500' 
    },
    { 
      name: lang === 'ar' ? 'محرك رؤية متقدم' : 'Advanced Vision Engine', 
      model: getModelForType('vision'), 
      desc: lang === 'ar' ? 'توليد الصور والشعارات' : 'Image & logo generation', 
      status: 'ACTIVE', 
      color: 'text-green-500' 
    },
    { 
      name: lang === 'ar' ? 'محرك بحث فوري' : 'Instant Search Engine', 
      model: getModelForType('market'), 
      desc: lang === 'ar' ? 'البحث المباشر وتحويل النص لصوت' : 'Live search & TTS', 
      status: 'SECONDARY', 
      color: 'text-blue-500' 
    },
  ];

  const stats = [
    { label: lang === 'ar' ? 'وقت الاستجابة' : 'Latency', value: '124ms', sub: '-12%', subColor: 'text-green-500', icon: <TrendingUp className="w-3 h-3" /> },
    { label: lang === 'ar' ? 'دقة النماذج' : 'Model Accuracy', value: '99.8%', sub: lang === 'ar' ? 'مستقر' : 'Stable', subColor: 'text-zinc-500' },
    { label: lang === 'ar' ? 'استهلاك التوكنز' : 'Token Usage', value: '1.2M', sub: `/ ${lang === 'ar' ? 'يوم' : 'day'}`, subColor: 'text-zinc-500' },
    { label: lang === 'ar' ? 'المهام المنجزة' : 'Tasks Completed', value: '45,892', sub: lang === 'ar' ? 'نشط' : 'Active', subColor: 'text-orange-500', icon: <Zap className="w-3 h-3" /> },
  ];

  const distribution = [
    { name: lang === 'ar' ? 'نواة المنطق' : 'Logic Core', load: 45, color: 'bg-green-500' },
    { name: lang === 'ar' ? 'نواة الإبداع' : 'Creative Core', load: 30, color: 'bg-blue-500' },
    { name: lang === 'ar' ? 'نواة البيانات' : 'Data Core', load: 25, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <h3 className="text-blue-500 font-bold mb-2 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          {lang === 'ar' ? 'حالة النظام والذكاء' : 'System & AI Health'}
        </h3>
        <p className="text-sm text-zinc-400">
          {lang === 'ar' 
            ? 'مراقبة أداء النماذج واستهلاك الموارد في الوقت الفعلي.' 
            : 'Monitor model performance and resource consumption in real-time.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {engines.map((engine, i) => (
          <div key={i} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-zinc-500 uppercase font-mono">{engine.name}</span>
              <span className={cn("px-2 py-0.5 bg-zinc-800 text-[10px] rounded-full font-bold", engine.color)}>{engine.status}</span>
            </div>
            <div className="text-lg font-bold text-white">{engine.model}</div>
            <p className="text-[10px] text-zinc-500 mt-1">{engine.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <span className="text-[10px] text-zinc-500 uppercase font-mono">{stat.label}</span>
            <div className="text-xl font-bold text-white mt-1">{stat.value}</div>
            <div className={cn("text-[10px] mt-1 flex items-center gap-1", stat.subColor)}>
              {stat.icon} {stat.sub}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <h4 className="text-xs font-mono uppercase text-zinc-500 mb-4">{lang === 'ar' ? 'توزيع الحمل' : 'Load Distribution'}</h4>
        <div className="space-y-3">
          {distribution.map((m, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-[10px] text-zinc-400">
                <span>{m.name}</span>
                <span>{m.load}%</span>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", m.color)} style={{ width: `${m.load}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
