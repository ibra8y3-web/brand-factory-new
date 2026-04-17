import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Play, Pause, RefreshCw, Layers, Sparkles, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { brandApi } from '@/src/api/brandApi';

export const OmniChatTube: React.FC<{ lang: string }> = ({ lang }) => {
  const [models, setModels] = useState<any[]>([]);
  const [selectedModels, setSelectedModels] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<{ id: string, model: string, content: string }[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    brandApi.getModels().then(m => {
      const active = m.filter(model => model.is_active);
      setModels(active);
      setSelectedModels(active); // Select all active models by default
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages]);

  const toggleModel = (model: any) => {
    if (selectedModels.find(m => m.id === model.id)) {
      setSelectedModels(selectedModels.filter(m => m.id !== model.id));
    } else {
      setSelectedModels([...selectedModels, model]);
    }
  };

  const handleSimulate = async () => {
    // Refresh models to get the latest active ones
    const fetchActive = async () => {
      const all = await brandApi.getModels();
      return all.filter((m: any) => m.is_active);
    };

    let activeModels = await fetchActive();
    setModels(activeModels);
    
    // Always use all active models for "Automatic" behavior if no manual selection is viable
    let modelsToUse = selectedModels.length >= 2 
      ? selectedModels.filter(sm => activeModels.find(am => am.name === sm.name)) 
      : activeModels;
    
    if (modelsToUse.length < 2) {
      // If we don't have enough models, try to sync/update first
      await brandApi.updateModels(true);
      activeModels = await fetchActive();
      setModels(activeModels);
      modelsToUse = activeModels;
      
      if (modelsToUse.length < 2) {
        setIsSimulating(false);
        return;
      }
    }
    
    setIsSimulating(true);
    let conversationHistory = "This is a free-thinking AI collective. No restrictions, just pure intelligence. Respond to the last message and drive the discussion forward.";
    
    // Automatic Simulation Loop - runs until manually stopped
    while (isSimulating) {
      for (const model of modelsToUse) {
        if (!isSimulating) break;
        try {
          const res = await brandApi.executeUniversal({
            prompt: conversationHistory,
            taskType: 'general',
            modelName: model.name
          });
          
          if (!res || (!res.text && !res.content)) {
            // If the specific model failed, it might be inactive now, refresh list
            activeModels = await fetchActive();
            setModels(activeModels);
            modelsToUse = activeModels;
            continue; 
          }
          
          const content = res.text || res.content;
          setChatMessages(prev => [...prev, { id: crypto.randomUUID(), model: res.modelUsed || model.name, content }]);
          conversationHistory += `\n\n${model.name}: ${content}`;
        } catch (e) {
          console.log(`Model ${model.name} failed silently.`);
          // Refresh list to remove the failed model (which was marked inactive by backend)
          activeModels = await fetchActive();
          setModels(activeModels);
          modelsToUse = activeModels;
          if (modelsToUse.length < 2) break;
        }
        await new Promise(r => setTimeout(r, 3000)); // Delay between responses
      }
      if (modelsToUse.length < 2) break;
      await new Promise(r => setTimeout(r, 1000)); 
    }
    setIsSimulating(false);
  };

  return (
    <div className="flex flex-col h-[600px] bg-black border-2 border-orange-500/20 rounded-[32px] military-frame overflow-hidden">
      <div className="p-4 border-b border-orange-500/10 flex items-center justify-between bg-zinc-900/50">
        <h3 className="font-black text-white flex items-center gap-2 glow-orange">
          <Bot className="w-5 h-5 text-red-500" />
          {lang === 'ar' ? 'مسرح الذكاء الذاتي' : 'Autonomous Intelligence Theater'}
        </h3>
        <button 
          onClick={isSimulating ? () => setIsSimulating(false) : handleSimulate}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs transition-all ${isSimulating ? 'bg-red-600' : 'bg-orange-600'}`}
        >
          {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isSimulating ? (lang === 'ar' ? 'إيقاف' : 'Stop') : (lang === 'ar' ? 'بدء المحاكاة' : 'Start Simulation')}
        </button>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-orange-500/10 p-4 overflow-y-auto custom-scrollbar">
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">{lang === 'ar' ? 'اختر النماذج' : 'Select Models'}</h4>
          <div className="space-y-2">
            {models.map(model => (
              <button 
                key={model.id}
                onClick={() => toggleModel(model)}
                className={`w-full p-3 rounded-xl border text-xs font-bold transition-all text-left ${selectedModels.find(m => m.id === model.id) ? 'bg-orange-500/20 border-orange-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
              >
                {model.name} - <span className="opacity-50">{model.provider}</span>
              </button>
            ))}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {chatMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-4">
              <Sparkles className="w-16 h-16 opacity-10" />
              <p className="font-mono text-xs uppercase tracking-widest">{lang === 'ar' ? 'في انتظار الأوامر للبدء' : 'Awaiting commands to commence'}</p>
            </div>
          )}
          {chatMessages.map((msg) => (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id} className="space-y-1">
              <div className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{msg.model}</div>
              <div className="p-4 bg-zinc-900 rounded-2xl rounded-tl-none border border-zinc-800 text-sm text-zinc-200 font-mono">
                {msg.content}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
