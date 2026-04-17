import React, { useState } from 'react';

export default function AutonomousTest() {
  const [status, setStatus] = useState('جاهز للاختبار');

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-900 text-white font-sans">
      <div className="p-5 border border-zinc-700 rounded-lg text-center">
        <h2 className="text-xl font-bold mb-4">تجربة الـ Stack الذكي</h2>
        <p className="mb-4">الحالة الحالية: <span className="text-green-500 font-semibold">{status}</span></p>
        <button 
          onClick={() => setStatus('تم التحديث بنجاح! ✅')}
          className="px-5 py-2.5 bg-violet-600 text-white border-none rounded cursor-pointer hover:bg-violet-700 transition-colors"
        >
          تحديث الحالة
        </button>
      </div>
    </div>
  );
}
