import React from 'react';
import { motion } from 'framer-motion';
import { Database, Search, Filter, Plus, MoreVertical } from 'lucide-react';

export const DatabaseExplorer: React.FC<{ lang: string }> = ({ lang }) => {
  return (
    <div className="space-y-8">
      <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-[32px]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black flex items-center gap-3">
            <Database className="text-orange-500" /> {lang === 'ar' ? 'مستكشف البيانات' : 'Database Explorer'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder={lang === 'ar' ? 'بحث...' : 'Search...'}
                className="pl-10 pr-4 py-2 bg-black border border-zinc-800 rounded-full text-sm focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>
            <button className="p-2 bg-black border border-zinc-800 rounded-full hover:border-orange-500/50 transition-all">
              <Filter className="w-4 h-4 text-zinc-500" />
            </button>
            <button className="px-4 py-2 bg-orange-500 text-black font-bold rounded-full hover:bg-orange-400 transition-all flex items-center gap-2">
              <Plus className="w-4 h-4" />
              {lang === 'ar' ? 'إضافة سجل' : 'Add Record'}
            </button>
          </div>
        </div>

        <div className="bg-black border border-zinc-800 rounded-3xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/50 border-b border-zinc-800">
                {['ID', 'Name', 'Status', 'Last Sync', ''].map((header, i) => (
                  <th key={i} className="p-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { id: '001', name: 'Nexus Core', status: 'Active', sync: '2m ago' },
                { id: '002', name: 'Aether Engine', status: 'Standby', sync: '15m ago' },
                { id: '003', name: 'Nova Analytics', status: 'Active', sync: '1m ago' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors">
                  <td className="p-4 font-mono text-xs text-zinc-500">#{row.id}</td>
                  <td className="p-4 font-bold">{row.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${row.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-zinc-500">{row.sync}</td>
                  <td className="p-4 text-right">
                    <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-zinc-600" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
