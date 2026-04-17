import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface SecurityCenterProps {
  lang: 'ar' | 'en';
}

export const SecurityCenter: React.FC<SecurityCenterProps> = ({ lang }) => {
  const items = [
    { name: lang === 'ar' ? 'تشفير البيانات' : 'Data Encryption', status: 'AES-256 Enabled' },
    { name: lang === 'ar' ? 'جدار الحماية الذكي' : 'Smart Firewall', status: 'Active' },
    { name: lang === 'ar' ? 'فحص الثغرات' : 'Vulnerability Scan', status: 'Scheduled' },
    { name: lang === 'ar' ? 'سجل الوصول' : 'Access Logs', status: 'Monitoring' },
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
        <h3 className="text-green-500 font-bold mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          {lang === 'ar' ? 'مركز الأمان' : 'Security Center'}
        </h3>
        <p className="text-sm text-zinc-400">
          {lang === 'ar' 
            ? 'إدارة إعدادات الأمان، التشفير، وحماية البيانات.' 
            : 'Manage security settings, encryption, and data protection.'}
        </p>
      </div>

      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-between">
            <div>
              <h4 className="font-bold text-sm text-white">{item.name}</h4>
              <p className="text-[10px] text-zinc-500 uppercase font-mono">{item.status}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
};
