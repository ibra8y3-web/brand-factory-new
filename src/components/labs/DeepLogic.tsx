import React, { useState } from 'react';
import { Brain, Loader2, MessageSquare, ListChecks, Code, HelpCircle, ChevronRight } from 'lucide-react';
import { brandApi } from '../../api/brandApi';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export const DeepLogic: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<any | null>(null);

  const handleAnalyze = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt or idea.");
      return;
    }
    setLoading(true);
    try {
      const res = await brandApi.analyzeDeepLogic(prompt);
      setResult(res);
      toast.success("Deep logic analysis complete!");
    } catch (error) {
      toast.error("Failed to analyze logic.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <Brain className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Deep Logic Understanding</h3>
            <p className="text-sm text-gray-400">AI-driven architectural reasoning and Chain of Thought</p>
          </div>
        </div>

        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your complex logic or project idea..."
            className="w-full h-32 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
            Analyze Logic
          </button>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4"
            >
              <h4 className="text-white font-medium flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-yellow-400" />
                Clarifying Questions
              </h4>
              <ul className="space-y-3">
                {result.clarifyingQuestions?.map((q: string, idx: number) => (
                  <li key={idx} className="flex gap-3 text-sm text-gray-300">
                    <ChevronRight className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                    {q}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4"
            >
              <h4 className="text-white font-medium flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-green-400" />
                Chain of Thought
              </h4>
              <div className="space-y-4">
                {Object.entries(result.chainOfThought || {}).map(([step, desc]: [string, any], idx) => (
                  <div key={idx} className="relative pl-6 border-l border-white/10">
                    <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-indigo-500" />
                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">{step}</div>
                    <div className="text-sm text-gray-300">{desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="md:col-span-2 p-6 bg-white/5 border border-white/10 rounded-xl space-y-4"
            >
              <h4 className="text-white font-medium flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-400" />
                Logic Explanation & Initial Code
              </h4>
              <div className="p-4 bg-black/40 rounded-lg text-sm text-gray-300 mb-4">
                {result.logicExplanation}
              </div>
              <div className="max-h-[300px] overflow-y-auto bg-black/40 rounded-lg p-4">
                <pre className="text-xs text-blue-300 whitespace-pre-wrap">{result.initialCode}</pre>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
