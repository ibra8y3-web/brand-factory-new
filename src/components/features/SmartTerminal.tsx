import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Send, Copy, Check, Loader2, Command } from 'lucide-react';
import { brandApi } from '../../api/brandApi';
import { toast } from 'sonner';

export const SmartTerminal = () => {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ id: string, role: string, content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleCommand = async () => {
    if (!input) return;

    const userMsg = { id: crypto.randomUUID(), role: 'user', content: input };
    setHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const prompt = `Convert the following natural language request into a sequence of Linux or Git commands.
      Provide only the commands in a code block.
      
      Request:
      ${input}`;

      const res = await brandApi.generateChat(prompt, 'coding');
      const response = res.text;
      
      const botMsg = { id: crypto.randomUUID(), role: 'bot', content: response };
      setHistory(prev => [...prev, botMsg]);
    } catch (error) {
      toast.error('فشل تحويل الأمر');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('تم نسخ الأمر');
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Terminal className="text-green-400" />
            مترجم الأوامر (Smart CLI & Terminal)
          </h2>
          <p className="text-gray-400">حول لغتك البشرية إلى أوامر برمجية قوية</p>
        </div>
      </div>

      <div className="flex-1 bg-black/60 border border-white/10 rounded-xl overflow-hidden flex flex-col">
        <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
          <span className="text-xs font-mono text-gray-500 ml-2">bash — omni-terminal</span>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm">
          {history.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 space-y-2 opacity-50">
              <Command size={48} />
              <p>اكتب طلباً مثل: "ارفع المشروع على GitHub واعمل فرع جديد باسم dev"</p>
            </div>
          )}

          {history.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === 'user' 
                ? 'bg-blue-600/20 border border-blue-500/30 text-blue-200' 
                : 'bg-white/5 border border-white/10 text-green-400'
              }`}>
                {msg.role === 'user' ? (
                  <div className="flex items-center gap-2">
                    <span className="opacity-50">$</span>
                    {msg.content}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs text-gray-500">الأوامر المقترحة:</span>
                      <button 
                        onClick={() => copyToClipboard(msg.content.replace(/```[\s\S]*?```/g, '$&').replace(/```/g, ''))}
                        className="hover:text-white transition-colors"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap">{msg.content}</pre>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-green-400 animate-pulse">
              <span className="opacity-50">$</span>
              <span>جاري التفكير...</span>
              <Loader2 size={14} className="animate-spin" />
            </div>
          )}
        </div>

        <div className="p-4 bg-white/5 border-t border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-green-400 font-mono">$</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCommand()}
              placeholder="اكتب طلبك هنا..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-green-400 font-mono placeholder:text-gray-700"
            />
            <button
              onClick={handleCommand}
              disabled={isLoading || !input}
              className="text-green-400 hover:text-green-300 disabled:opacity-30 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
