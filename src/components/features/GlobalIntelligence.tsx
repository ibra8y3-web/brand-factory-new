import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Shield, Zap, Activity, Search, Loader2 } from 'lucide-react';
import { brandApi } from '../../api/brandApi';
import { toast } from 'sonner';

export const GlobalIntelligence: React.FC<{ lang: string }> = ({ lang }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const res = await brandApi.executeUniversal({
        prompt: query,
        taskType: "search"
      });
      setResult(res.text);
      toast.success(lang === 'ar' ? `تم البحث بواسطة: ${res.modelUsed}` : `Search complete by: ${res.modelUsed}`);
    } catch (error) {
      toast.error(lang === 'ar' ? 'فشل البحث العالمي' : 'Global search failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { icon: Globe, label: lang === 'ar' ? 'الشبكة العالمية' : 'Global Network', value: '99.9%', color: 'text-blue-500' },
          { icon: Shield, label: lang === 'ar' ? 'الأمان' : 'Security', value: 'Military Grade', color: 'text-green-500' },
          { icon: Zap, label: lang === 'ar' ? 'الكمون' : 'Latency', value: '12ms', color: 'text-orange-500' },
          { icon: Activity, label: lang === 'ar' ? 'الحمل' : 'System Load', value: '24%', color: 'text-purple-500' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 bg-zinc-900 border border-zinc-800 rounded-3xl"
          >
            <stat.icon className={`w-6 h-6 ${stat.color} mb-4`} />
            <div className="text-2xl font-black">{stat.value}</div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[32px]">
        <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
          <Search className="w-6 h-6 text-blue-500" />
          {lang === 'ar' ? 'محرك الذكاء العالمي' : 'Global Intelligence Engine'}
        </h2>
        
        <div className="flex gap-4 mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={lang === 'ar' ? 'ابحث عن أي شيء في العالم (سوق، تقنية، أخبار)...' : 'Search for anything globally (market, tech, news)...'}
            className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleSearch}
            disabled={isLoading || !query.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 transition-colors"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {lang === 'ar' ? 'بحث' : 'Search'}
          </button>
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-black/50 rounded-2xl border border-zinc-800/50 prose prose-invert max-w-none"
          >
            <div className="whitespace-pre-wrap text-zinc-300 leading-relaxed">
              {result}
            </div>
          </motion.div>
        )}

        {!result && !isLoading && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">
              {lang === 'ar' ? 'مراقبة العقد اللحظية' : 'Live Node Monitoring'}
            </h3>
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-4 bg-black/50 rounded-2xl border border-zinc-800/50">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-mono text-zinc-400">NODE_0{i}_ACTIVE</span>
                </div>
                <span className="text-xs text-zinc-600">Verified by Nexus Core</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
