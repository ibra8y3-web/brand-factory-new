import React, { useState } from 'react';
import { Upload, FileCode, Folder as FolderIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const ProjectUnpacker: React.FC = () => {
  const [files, setFiles] = useState<{ path: string; content: string }[]>([]);
  const [isUnpacking, setIsUnpacking] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUnpacking(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/project/unpack", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to unpack");
      const data = await res.json();
      setFiles(data.files);
      toast.success("Project unpacked successfully");
    } catch (error) {
      toast.error("Failed to unpack project");
    } finally {
      setIsUnpacking(false);
    }
  };

  return (
    <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
      <h3 className="text-lg font-bold text-white mb-4">Project Unpacker</h3>
      <div className="border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center">
        <input type="file" onChange={handleFileUpload} className="hidden" id="file-upload" />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
          {isUnpacking ? <Loader2 className="w-8 h-8 animate-spin text-orange-500" /> : <Upload className="w-8 h-8 text-zinc-500" />}
          <span className="text-sm text-zinc-400">Upload ZIP project</span>
        </label>
      </div>
      
      {files.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-bold text-zinc-300 mb-2">Files:</h4>
          <div className="max-h-96 overflow-y-auto bg-black p-4 rounded-lg">
            {files.map((file, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-zinc-400 py-1">
                {file.path.endsWith('/') ? <FolderIcon className="w-3 h-3" /> : <FileCode className="w-3 h-3" />}
                {file.path}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
