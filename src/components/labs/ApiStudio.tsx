import React, { useState } from 'react';
import { Database, Loader2, Code, ArrowRight, CheckCircle, Download, FileJson, BookOpen } from 'lucide-react';
import { brandApi } from '../../api/brandApi';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export const ApiStudio: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<any | null>(null);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error("Please describe your API needs.");
      return;
    }
    setLoading(true);
    try {
      const res = await brandApi.generateApiStudio(description);
      setResult(res);
      toast.success("API Studio assets generated successfully!");
    } catch (error) {
      toast.error("Failed to generate API assets.");
    } finally {
      setLoading(false);
    }
  };

  const downloadAsset = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-4">
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Database className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI-API Studio</h3>
            <p className="text-sm text-gray-400">Generate mock endpoints and integration code</p>
          </div>
        </div>

        <div className="space-y-4">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your API endpoints (e.g., 'A user management API with Stripe integration for subscriptions')"
            className="w-full h-32 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
            Generate API Assets
          </button>
        </div>
      </div>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-white font-medium flex items-center gap-2">
                <FileJson className="w-4 h-4 text-blue-400" />
                Integration Code
              </h4>
              <button
                onClick={() => downloadAsset(result.integrationCode, 'api-integration.ts', 'text/typescript')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto bg-black/40 rounded-lg p-4">
              <pre className="text-xs text-blue-300 whitespace-pre-wrap">{result.integrationCode}</pre>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-white font-medium flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-purple-400" />
                Documentation
              </h4>
              <button
                onClick={() => downloadAsset(result.documentation, 'api-docs.md', 'text/markdown')}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto bg-black/40 rounded-lg p-4">
              <pre className="text-xs text-purple-300 whitespace-pre-wrap">{result.documentation}</pre>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
