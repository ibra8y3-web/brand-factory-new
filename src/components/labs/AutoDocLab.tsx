import React, { useState } from 'react';
import { FileText, Book, Loader2, Download, CheckCircle } from 'lucide-react';
import { brandApi } from '../../api/brandApi';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface AutoDocLabProps {
  projectFiles: any[];
}

export const AutoDocLab: React.FC<AutoDocLabProps> = ({ projectFiles }) => {
  const [loading, setLoading] = useState<'readme' | 'guide' | null>(null);
  const [readme, setReadme] = useState<string | null>(null);
  const [guide, setGuide] = useState<string | null>(null);

  const handleGenerateReadme = async () => {
    if (projectFiles.length === 0) {
      toast.error("No project files found to document.");
      return;
    }
    setLoading('readme');
    try {
      const res = await brandApi.generateReadme(projectFiles);
      setReadme(res.readme);
      toast.success("README generated successfully!");
    } catch (error) {
      toast.error("Failed to generate README.");
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateGuide = async () => {
    if (projectFiles.length === 0) {
      toast.error("No project files found to document.");
      return;
    }
    setLoading('guide');
    try {
      const res = await brandApi.generateUserGuide(projectFiles);
      setGuide(res.guide);
      toast.success("User Guide generated successfully!");
    } catch (error) {
      toast.error("Failed to generate User Guide.");
    } finally {
      setLoading(null);
    }
  };

  const downloadDoc = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">README Generator</h3>
              <p className="text-sm text-gray-400">Professional GitHub documentation</p>
            </div>
          </div>
          <button
            onClick={handleGenerateReadme}
            disabled={loading === 'readme'}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading === 'readme' ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Generate README
          </button>
          {readme && (
            <button
              onClick={() => downloadDoc(readme, 'README.md')}
              className="w-full py-2 border border-white/10 hover:bg-white/5 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download README.md
            </button>
          )}
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Book className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">User Guide Lab</h3>
              <p className="text-sm text-gray-400">Comprehensive end-user manual</p>
            </div>
          </div>
          <button
            onClick={handleGenerateGuide}
            disabled={loading === 'guide'}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading === 'guide' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Book className="w-4 h-4" />}
            Generate User Guide
          </button>
          {guide && (
            <button
              onClick={() => downloadDoc(guide, 'UserGuide.md')}
              className="w-full py-2 border border-white/10 hover:bg-white/5 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download UserGuide.md
            </button>
          )}
        </motion.div>
      </div>

      {(readme || guide) && (
        <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
          <h4 className="text-white font-medium mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            Preview
          </h4>
          <div className="max-h-[400px] overflow-y-auto prose prose-invert prose-sm max-w-none">
            <pre className="p-4 bg-black/40 rounded-lg text-xs whitespace-pre-wrap">
              {readme || guide}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
