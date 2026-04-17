import React from 'react';
import { Bot, RefreshCw, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BotManagerProps {
  lang: 'ar' | 'en';
  activeBots: any[];
  botLogs: any[];
}

export const BotManager: React.FC<BotManagerProps> = ({ lang, activeBots, botLogs }) => {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
        <h3 className="text-orange-500 font-bold mb-2 flex items-center gap-2">
          <Bot className="w-4 h-4" />
          {lang === 'ar' ? 'بوتات المساهمة التلقائية' : 'Auto-Contribution Bots'}
        </h3>
        <p className="text-sm text-zinc-400 mb-4">
          {lang === 'ar' 
            ? 'بوتات ذكية ومجانية تعمل تلقائياً للمساهمة في تطوير المنصة وتحسين النماذج.' 
            : 'Smart, free bots that work automatically to contribute to platform development and model improvement.'}
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="text-xs font-mono uppercase text-zinc-500 flex items-center justify-between">
          {lang === 'ar' ? 'حالة البوتات' : 'Bot Status'}
          <span className="text-orange-500">{activeBots.length} {lang === 'ar' ? 'نشط دائماً' : 'Always Active'}</span>
        </h4>
        {[
          { name: "Code Optimizer Bot", desc: lang === 'ar' ? 'تحسين جودة الكود تلقائياً' : 'Automatically optimize code quality' },
          { name: "Security Auditor Bot", desc: lang === 'ar' ? 'فحص الثغرات الأمنية باستمرار' : 'Continuously check for security vulnerabilities' },
          { name: "Model Trainer Bot", desc: lang === 'ar' ? 'تحسين دقة النماذج بناءً على البيانات' : 'Improve model accuracy based on data' },
          { name: "UI/UX Enhancer Bot", desc: lang === 'ar' ? 'اقتراح تحسينات لواجهة المستخدم' : 'Suggest UI/UX improvements' },
          { name: "SEO Master Bot", desc: lang === 'ar' ? 'تحسين ظهور المنصة في محركات البحث' : 'Optimize platform visibility in search engines' },
          { name: "Performance Booster", desc: lang === 'ar' ? 'تسريع أداء المنصة وتقليل استهلاك الموارد' : 'Speed up platform performance and reduce resource usage' },
          { name: "Localization Bot", desc: lang === 'ar' ? 'دعم اللغات المتعددة والترجمة التلقائية' : 'Support multi-languages and auto-translation' },
          { name: "Documentation Bot", desc: lang === 'ar' ? 'توليد وتحديث الوثائق التقنية للمشروع' : 'Generate and update technical documentation' },
          { name: "Market Trend Bot", desc: lang === 'ar' ? 'تحليل اتجاهات السوق العالمية' : 'Analyze global market trends' },
          { name: "Bug Fixer Bot", desc: lang === 'ar' ? 'إصلاح الأخطاء البرمجية الشائعة' : 'Fix common programming bugs' },
          { name: "Zora AI Bot", desc: lang === 'ar' ? 'المساعد الذكي المتطور (Zora)' : 'Advanced AI Assistant (Zora)' },
        ].map((bot, i) => (
          <div key={i} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between group hover:border-zinc-700 transition-all">
            <div className="flex-1">
              <h4 className="font-bold text-sm text-white">{bot.name}</h4>
              <p className="text-xs text-zinc-500">{bot.desc}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] text-orange-500 font-mono uppercase">Active</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bot Activity Log */}
      <div className="mt-8 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
        <h4 className="text-xs font-mono uppercase text-zinc-500 mb-4 flex items-center gap-2">
          <RefreshCw className="w-3 h-3 animate-spin text-orange-500" />
          {lang === 'ar' ? 'سجل نشاط البوتات' : 'Bot Activity Log'}
        </h4>
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {botLogs.length > 0 ? (
              botLogs.map((log) => (
                <motion.div 
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="text-[10px] font-mono flex items-center gap-2 text-zinc-400"
                >
                  <span className="text-zinc-600">[{log.time}]</span>
                  <span className="text-orange-500/80">{log.bot}:</span>
                  <span>{log.msg}</span>
                </motion.div>
              ))
            ) : (
              <p className="text-[10px] text-zinc-600 italic">
                {lang === 'ar' ? 'بانتظار نشاط البوتات...' : 'Waiting for bot activity...'}
              </p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
