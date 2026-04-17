import React from 'react';
import { LayoutDashboard, Camera, Zap, Settings } from 'lucide-react';

export const PlatformLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen bg-zinc-950 text-white">
      <aside className="w-64 border-r border-zinc-800 p-4 flex flex-col">
        <h1 className="text-xl font-bold mb-8">Lumina Platform</h1>
        <nav className="space-y-2">
          <a href="/" className="flex items-center gap-2 p-2 hover:bg-zinc-800 rounded">
            <LayoutDashboard size={20} /> Dashboard
          </a>
          <a href="/camera" className="flex items-center gap-2 p-2 hover:bg-zinc-800 rounded">
            <Camera size={20} /> Camera Tool
          </a>
          <a href="/factory" className="flex items-center gap-2 p-2 hover:bg-zinc-800 rounded">
            <Zap size={20} /> Brand Factory
          </a>
        </nav>
        <div className="mt-auto">
          <a href="/settings" className="flex items-center gap-2 p-2 hover:bg-zinc-800 rounded">
            <Settings size={20} /> Settings
          </a>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
};
