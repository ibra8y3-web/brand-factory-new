import React, { useState } from 'react';
import { RefreshCw, Loader2, Code, ArrowRight, CheckCircle, Download } from 'lucide-react';
import { brandApi } from '../../api/brandApi';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface ProjectTranspilerProps {
  projectFiles: any[];
}

export const ProjectTranspiler: React.FC<ProjectTranspilerProps> = ({ projectFiles }) => {
  const [loading, setLoading] = useState(false);
  const [targetStack, setTargetStack] = useState('React + Vite');
  const [transpiledProject, setTranspiledProject] = useState<any | null>(null);

  const stacks = [
    'React + Vite',
    'Next.js (App Router)',
    'Flutter (Web)',
    'Python (Flask)',
    'Node.js (Express)',
    'Vue.js',
    'PHP (Laravel)',
    'Swift (SwiftUI)',
    'C++ (Qt Framework)'
  ];

  const handleTranspile = async () => {
    if (projectFiles.length === 0) {
      toast.error("No project files found to transpile.");
      return;
    }
    setLoading(true);
    try {
      const res = await brandApi.transpileProject(projectFiles, targetStack);
      setTranspiledProject(res);
      toast.success(`Project transpiled to ${targetStack} successfully!`);
    } catch (error) {
      toast.error("Failed to transpile project.");
    } finally {
      setLoading(null);
    }
  };

  const downloadProject = () => {
    if (!transpiledProject) return;
    const blob = new Blob([JSON.stringify(transpiledProject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transpiled-project-${targetStack.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-4">
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <RefreshCw className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Project Transpiler</h3>
            <p className="text-sm text-gray-400">Convert your project to any tech stack</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Source</div>
            <div className="text-sm font-medium text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-blue-400" />
              Current Project
            </div>
          </div>
          <div className="flex justify-center">
            <ArrowRight className="w-6 h-6 text-gray-600" />
          </div>
          <div className="space-y-2">
            <div className="text-xs text-gray-400 mb-1">Target Stack</div>
            <select
              value={targetStack}
              onChange={(e) => setTargetStack(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              {stacks.map(stack => (
                <option key={stack} value={stack}>{stack}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleTranspile}
          disabled={loading}
          className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
          Start Transpilation
        </button>
      </div>

      {transpiledProject && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-white/5 border border-white/10 rounded-xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-white font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Transpiled Project Structure
            </h4>
            <button
              onClick={downloadProject}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Project JSON
            </button>
          </div>
          <div className="max-h-[300px] overflow-y-auto bg-black/40 rounded-lg p-4">
            <div className="space-y-2">
              {transpiledProject.files?.map((file: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                  <Code className="w-3 h-3" />
                  {file.path}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
