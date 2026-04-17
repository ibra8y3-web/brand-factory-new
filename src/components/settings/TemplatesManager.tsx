import React from 'react';
import { Layers, CheckCircle2 } from 'lucide-react';

interface TemplatesManagerProps {
  lang: 'ar' | 'en';
}

export const TemplatesManager: React.FC<TemplatesManagerProps> = ({ lang }) => {
  const categories = [
    { title: lang === 'ar' ? 'قوالب لوحات التحكم' : 'Admin & Dashboard', items: ['Sidebar Navigation', 'Stats Cards (KPIs)', 'Data Tables (CRUD)', 'Analytics Charts'] },
    { title: lang === 'ar' ? 'قوالب الصفحات الرئيسية' : 'Landing Page Patterns', items: ['Hero Section', 'Feature Grid', 'Pricing Tables', 'Testimonials Slider'] },
    { title: lang === 'ar' ? 'التجارة الإلكترونية' : 'E-commerce Patterns', items: ['Product Grid', 'Filter Sidebar', 'Shopping Cart Drawer', 'Checkout Stepper'] },
    { title: lang === 'ar' ? 'قوالب الذكاء الاصطناعي' : 'AI & Communication', items: ['Chat Interface', 'Prompt Input Area', 'Model Playground', 'Typewriter Effect'] },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        {lang === 'ar' 
          ? 'مجموعة القوالب الجاهزة التي يستخدمها الذكاء الاصطناعي لبناء المنصات.' 
          : 'Pre-built templates used by AI to construct platforms.'}
      </p>
      
      {categories.map((category, i) => (
        <div key={i} className="mb-4">
          <h4 className="font-bold text-zinc-300 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-500" />
            {category.title}
          </h4>
          <div className="grid grid-cols-1 gap-2">
            {category.items.map((item, j) => (
              <div key={j} className="text-xs p-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
