import React from 'react';
import { User, Shield, Star, Activity } from 'lucide-react';

interface WelcomeTableProps {
  lang: 'ar' | 'en';
  userName?: string;
}

export const WelcomeTable: React.FC<WelcomeTableProps> = ({ lang, userName = 'User' }) => {
  const stats = [
    { label: lang === 'ar' ? 'وحدات الذكاء' : 'AI Units', value: '500+', icon: <Activity className="w-4 h-4 text-orange-500" /> },
    { label: lang === 'ar' ? 'جاهزية القتال' : 'Combat Ready', value: '98%', icon: <Shield className="w-4 h-4 text-green-500" /> },
    { label: lang === 'ar' ? 'التصنيف' : 'Rank', value: 'Elite', icon: <Star className="w-4 h-4 text-yellow-500" /> },
  ];

  return (
    <div className="bg-black border border-orange-500/20 rounded-[32px] p-8 military-frame relative overflow-hidden backdrop-blur-xl">
      <div className="absolute top-0 right-0 p-3 flex gap-1">
         {[1,2,3].map(i => <div key={i} className="w-1 h-4 bg-orange-500/30 rounded-full" />)}
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center rotate-3 hover:rotate-0 transition-transform shadow-[0_0_30px_rgba(249,115,22,0.1)]">
            <User className="w-10 h-10 text-orange-500" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white glow-orange tracking-tighter">
              {lang === 'ar' ? `تحت قيادتك، ${userName}` : `In Command, ${userName}`}
            </h2>
            <p className="text-zinc-500 text-sm font-mono uppercase tracking-widest mt-1">
               {lang === 'ar' ? 'مركز مراقبة العمليات الذكية' : 'Intelligent Operations Control'}
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-zinc-900/50 border border-orange-500/10 rounded-2xl p-4 flex items-center gap-4 hover:border-orange-500/40 transition-all group">
              <div className="p-3 bg-black rounded-xl group-hover:bg-orange-500 transition-colors">
                <div className="group-hover:text-black transition-colors">
                   {stat.icon}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest leading-none mb-1">{stat.label}</p>
                <p className="text-xl font-black text-white leading-none tracking-tighter">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
