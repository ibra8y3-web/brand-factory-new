import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface CapabilitiesManagerProps {
  lang: 'ar' | 'en';
}

export const CapabilitiesManager: React.FC<CapabilitiesManagerProps> = ({ lang }) => {
  const categories = [
    { 
      title: lang === 'ar' ? 'الوسائط والتواصل' : 'Media & Communication', 
      items: ['Camera', 'Microphone', 'Photos & Media', 'Contacts', 'Call Logs', 'Phone'] 
    },
    { 
      title: lang === 'ar' ? 'الموقع والحركة' : 'Location & Motion', 
      items: ['Location (GPS)', 'Physical Activity', 'Body Sensors', 'Bluetooth'] 
    },
    { 
      title: lang === 'ar' ? 'التنبيهات والظهور' : 'Notifications & Display', 
      items: ['Notifications', 'Display over other apps', 'Write System Settings', 'Notification Access'] 
    },
    { 
      title: lang === 'ar' ? 'النظام والخصوصية' : 'System & Privacy', 
      items: ['Storage / Files', 'Usage Data', 'Calendar', 'SMS', 'Biometrics'] 
    },
    { 
      title: lang === 'ar' ? 'الحركة والتحريك' : 'Motion & Animation', 
      items: ['Animation', 'Transitions', 'Interactive Animation', 'Physics-based Motion', '2D/3D Animation', 'Parallax Effect'] 
    },
    { 
      title: lang === 'ar' ? 'الجرافيكس والرسومات' : 'Graphics & Visuals', 
      items: ['Vector Graphics', 'UI/UX Elements', '3D Rendering', 'Canvas', 'Modeling', 'Lighting & Shadows'] 
    },
    { 
      title: lang === 'ar' ? 'التأثيرات البصرية' : 'Visual Effects (VFX)', 
      items: ['Filters', 'Particle Effects', 'Blur Effects', 'Overlay/Blending', 'Distortion', 'Bloom/Glow', 'Chroma Key'] 
    },
    { 
      title: lang === 'ar' ? 'التعامل مع الوسائط' : 'Media Handling', 
      items: ['Image Processing', 'Video Editing', 'Audio Processing', 'Content Generation'] 
    },
    { 
      title: lang === 'ar' ? 'أدوات متقدمة' : 'Advanced Tools', 
      items: ['Background Camera', 'Install Unknown Apps', 'Battery Optimization', 'Accessibility'] 
    }
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        {lang === 'ar' 
          ? 'الصلاحيات والقدرات المتاحة للذكاء الاصطناعي لاستخدامها في المشاريع.' 
          : 'Capabilities and permissions available for AI to use in projects.'}
      </p>

      {categories.map((category, i) => (
        <div key={i} className="mb-4">
          <h4 className="font-bold text-zinc-300 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-orange-500" />
            {category.title}
          </h4>
          <div className="flex flex-wrap gap-2">
            {category.items.map((item, j) => (
              <span key={j} className="text-[10px] px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400">
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
