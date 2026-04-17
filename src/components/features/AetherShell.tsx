import React, { useState, useEffect } from 'react';
import { Terminal as TerminalIcon, Smartphone, RefreshCw, Cpu, Globe, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface AetherShellProps {
  lang: 'ar' | 'en';
}

export const AetherShell: React.FC<AetherShellProps> = ({ lang }) => {
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<any[]>([]);
  const [isTerminalBusy, setIsTerminalBusy] = useState(false);

  useEffect(() => {
    // Initial logs
    setTerminalLogs([
      { id: 1, time: '12:00:01', type: 'info', msg: 'Aether Shell v4.2.0-stable initialized.' },
      { id: 2, time: '12:00:02', type: 'info', msg: 'Connecting to virtual environment...' },
      { id: 3, time: '12:00:03', type: 'success', msg: 'Connected to galaxy-s24-node-01.' },
    ]);
  }, []);

  const handleTerminalCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    const time = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [...prev, { id: Date.now(), time, type: 'cmd', msg: cmd }]);
    setTerminalInput('');
    setIsTerminalBusy(true);

    // Simulate command execution
    setTimeout(() => {
      let response = '';
      let type = 'info';
      
      if (cmd.includes('python')) {
        response = 'Python 3.11.2 (main, Feb 12 2024, 14:45:00) [GCC 11.2.0] on linux';
      } else if (cmd.includes('ls')) {
        response = 'src/  public/  package.json  node_modules/  vite.config.ts';
      } else if (cmd.includes('pkg install')) {
        response = `Successfully installed ${cmd.split('install ')[1]}`;
        type = 'success';
      } else {
        response = `Command not found: ${cmd.split(' ')[0]}`;
        type = 'error';
      }

      setTerminalLogs(prev => [...prev, { id: Date.now() + 1, time, type, msg: response }]);
      setIsTerminalBusy(false);
    }, 800);
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between">
        <div>
          <h3 className="text-red-500 font-bold flex items-center gap-2">
            <TerminalIcon className="w-4 h-4" />
            {lang === 'ar' ? 'بيئة الترميز المتقدمة' : 'Advanced Coding Environment'}
          </h3>
          <p className="text-[10px] text-zinc-400 mt-1">
            {lang === 'ar' ? 'محاكاة بيئة Termux و Python مباشرة على جهازك' : 'Simulated Termux & Python environment directly on your device'}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 rounded-full border border-zinc-800">
          <Smartphone className="w-3 h-3 text-green-500" />
          <span className="text-[10px] text-green-500 font-mono">CONNECTED</span>
        </div>
      </div>

      {/* Terminal Window */}
      <div className="flex-1 bg-black border border-zinc-800 rounded-xl overflow-hidden flex flex-col font-mono text-[11px]">
        <div className="p-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
          </div>
          <span className="text-zinc-500 text-[9px]">aether-shell@galaxy-s24</span>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {terminalLogs.map((log) => (
            <div key={log.id} className="flex gap-2">
              <span className="text-zinc-600 shrink-0">[{log.time}]</span>
              <span className={cn(
                "break-all",
                log.type === 'error' ? 'text-red-400' : 
                log.type === 'success' ? 'text-green-400' : 
                log.type === 'cmd' ? 'text-orange-400' : 'text-zinc-300'
              )}>
                {log.type === 'cmd' && <span className="text-zinc-500 mr-1">$</span>}
                {log.msg}
              </span>
            </div>
          ))}
          {isTerminalBusy && (
            <div className="flex items-center gap-2 text-zinc-500 italic">
              <RefreshCw className="w-3 h-3 animate-spin" />
              {lang === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
            </div>
          )}
        </div>
        <div className="p-3 bg-zinc-900/50 border-t border-zinc-800 flex items-center gap-2">
          <span className="text-orange-500">$</span>
          <input 
            type="text"
            value={terminalInput}
            onChange={(e) => setTerminalInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTerminalCommand(terminalInput);
              }
            }}
            placeholder={lang === 'ar' ? 'اكتب أي أمر هنا (Python, Node, Shell)...' : 'Type any command (Python, Node, Shell)...'}
            className="flex-1 bg-transparent border-none focus:outline-none text-zinc-300 placeholder:text-zinc-700"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => handleTerminalCommand('pkg install python -y')}
          className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-orange-500/50 transition-all flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-all">
            <Cpu className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-left">
            <span className="block text-xs font-bold text-white">{lang === 'ar' ? 'تثبيت Python' : 'Install Python'}</span>
            <span className="block text-[9px] text-zinc-500">v3.11.2</span>
          </div>
        </button>
        <button 
          onClick={() => handleTerminalCommand('curl -I https://google.com')}
          className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-blue-500/50 transition-all flex items-center gap-3 group"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-all">
            <Globe className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-left">
            <span className="block text-xs font-bold text-white">{lang === 'ar' ? 'اختبار الاتصال' : 'Test Connection'}</span>
            <span className="block text-[9px] text-zinc-500">HTTP/1.1 200 OK</span>
          </div>
        </button>
      </div>

      <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-4 h-4 text-zinc-500" />
        <p className="text-[10px] text-zinc-500 italic">
          {lang === 'ar' 
            ? 'ملاحظة: يتم تنفيذ الأوامر مباشرة على البيئة الافتراضية المرتبطة بجهازك.' 
            : 'Note: Commands are executed directly on the virtual environment linked to your device.'}
        </p>
      </div>
    </div>
  );
};
