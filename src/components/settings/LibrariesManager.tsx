import React from 'react';

interface LibrariesManagerProps {
  lang: 'ar' | 'en';
}

export const LibrariesManager: React.FC<LibrariesManagerProps> = ({ lang }) => {
  const libraries = [
    { name: "Shadcn/ui", desc: lang === 'ar' ? 'مكونات حديثة قابلة للتخصيص' : 'Modern customizable components', badge: 'Tailwind' },
    { name: "Radix UI", desc: lang === 'ar' ? 'مكونات أساسية بدون تصميم' : 'Unstyled primitive components', badge: 'Core' },
    { name: "Vercel AI SDK", desc: lang === 'ar' ? 'واجهات الذكاء الاصطناعي المتدفقة' : 'Streaming AI interfaces', badge: 'AI' },
    { name: "Lucide React", desc: lang === 'ar' ? 'أيقونات متناسقة وجميلة' : 'Consistent & beautiful icons', badge: 'Icons' },
    { name: "Framer Motion", desc: lang === 'ar' ? 'حركات وتفاعلات سلسة' : 'Smooth animations & interactions', badge: 'Animation' },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        {lang === 'ar' 
          ? 'المكتبات المدعومة والمدمجة في النظام.' 
          : 'Supported and integrated libraries in the system.'}
      </p>

      <div className="space-y-4">
        {libraries.map((lib, i) => (
          <div key={i} className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
            <div className="flex justify-between items-start mb-1">
              <h4 className="font-bold text-sm text-white">{lib.name}</h4>
              <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-full">{lib.badge}</span>
            </div>
            <p className="text-xs text-zinc-500">{lib.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
