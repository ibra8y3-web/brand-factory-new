import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { brandApi } from '@/src/api/brandApi';

export const SmartChatHub: React.FC = () => {
  const [messages, setMessages] = useState<{ id: string, role: 'user' | 'assistant'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<{ id: string, name: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    brandApi.getModels().then(models => {
      setAvailableModels(models);
      if (models.length > 0) setSelectedModel(models[0].id);
    }).catch(err => {
      console.error("Failed to fetch models", err);
      toast.error("Failed to load models");
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { id: crypto.randomUUID(), role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const response = await brandApi.chat(input, "general", selectedModel);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: response.text }]);
    } catch (error) {
      toast.error("حدث خطأ في التواصل مع الذكاء الاصطناعي");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold text-white">مركز الفهم الشامل</h3>
        </div>
        <select 
          value={selectedModel} 
          onChange={(e) => setSelectedModel(e.target.value)}
          className="bg-zinc-800 text-white text-xs rounded-lg p-1.5 border border-zinc-700 focus:border-orange-500 outline-none"
        >
          {availableModels.map(model => (
            <option key={model.id} value={model.id}>{model.name}</option>
          ))}
        </select>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
            <Bot className="w-12 h-12 opacity-20" />
            <p>أنا هنا لفهم أي شيء.. اسألني عن أي موضوع!</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20"><Bot className="w-5 h-5 text-orange-500" /></div>}
            <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-200'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && <div className="flex gap-3"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>}
      </div>

      <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="اسألني عن أي شيء..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-sm text-white focus:border-orange-500 outline-none"
          />
          <button onClick={handleSend} disabled={isLoading} className="p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
