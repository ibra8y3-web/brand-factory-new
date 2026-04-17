import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Code, GitBranch, Share2, Download, Loader2, FileCode, Copy, CheckCircle2, Upload, FileArchive, Pause, Play, Trash2 } from 'lucide-react';
import { brandApi } from '../../api/brandApi';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { MermaidDiagram } from '../ui/MermaidDiagram';
import { get, set, del } from 'idb-keyval';

export const LogicReverseLab = () => {
  const [code, setCode] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('نفس اللغة (تحسين وإعادة هيكلة)');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadedFiles, setUploadedFiles] = useState<{path: string, content: string, isBinary?: boolean}[]>([]);
  const [conversionProgress, setConversionProgress] = useState({ current: 0, total: 0, currentFile: '' });
  
  // Model selection state
  const [models, setModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // New state for pausing and resuming
  const [completedFiles, setCompletedFiles] = useState<Record<string, {path: string, content: string, isBinary?: boolean}>>({});
  const [isPaused, setIsPaused] = useState(false);
  const shouldStopRef = useRef(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  // Load state from IndexedDB on mount
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoadingModels(true);
      try {
        const data = await brandApi.getModels();
        // Filter for coding or general models
        const codingModels = data.filter((m: any) => 
          m.is_active && (
            m.agent_type === 'coder' || 
            m.agent_type === 'general' || 
            m.category === 'LLM' ||
            m.provider === 'Groq' ||
            m.provider === 'OpenRouter' ||
            m.provider === 'Gemini'
          )
        ).sort((a: any, b: any) => {
          // Sort by likes, but put Groq and Gemini first as they are usually more stable
          const aPriority = (a.provider === 'Groq' || a.provider === 'Gemini') ? 10000 : 0;
          const bPriority = (b.provider === 'Groq' || b.provider === 'Gemini') ? 10000 : 0;
          return (b.likes + bPriority) - (a.likes + aPriority);
        });
        
        setModels(codingModels);
        if (codingModels.length > 0) {
          setSelectedModel(codingModels[0].name);
        }
      } catch (e) {
        console.error("Failed to fetch models", e);
      } finally {
        setIsLoadingModels(false);
      }
    };

    const loadState = async () => {
      try {
        const savedUploadedFiles = await get('logicLab_uploadedFiles');
        const savedCompletedFiles = await get('logicLab_completedFiles');
        const savedAnalysis = await get('logicLab_analysis');
        const savedTargetLanguage = await get('logicLab_targetLanguage');
        const savedCode = await get('logicLab_code');

        if (savedUploadedFiles) setUploadedFiles(savedUploadedFiles);
        if (savedCompletedFiles) {
          setCompletedFiles(savedCompletedFiles);
          if (Object.keys(savedCompletedFiles).length > 0 && savedUploadedFiles && Object.keys(savedCompletedFiles).length < savedUploadedFiles.length) {
            setIsPaused(true); // Automatically pause if there's an incomplete job
          }
        }
        if (savedAnalysis) setAnalysis(savedAnalysis);
        if (savedTargetLanguage) setTargetLanguage(savedTargetLanguage);
        if (savedCode) setCode(savedCode);
      } catch (e) {
        console.error("Failed to load state from IndexedDB", e);
      } finally {
        setIsLoaded(true);
      }
    };
    fetchModels();
    loadState();
  }, []);

  // Save state to IndexedDB whenever it changes
  useEffect(() => {
    if (isLoaded) set('logicLab_uploadedFiles', uploadedFiles);
  }, [uploadedFiles, isLoaded]);

  useEffect(() => {
    if (isLoaded) set('logicLab_completedFiles', completedFiles);
  }, [completedFiles, isLoaded]);

  useEffect(() => {
    if (isLoaded) set('logicLab_analysis', analysis);
  }, [analysis, isLoaded]);

  useEffect(() => {
    if (isLoaded) set('logicLab_targetLanguage', targetLanguage);
  }, [targetLanguage, isLoaded]);

  useEffect(() => {
    if (isLoaded) set('logicLab_code', code);
  }, [code, isLoaded]);

  const handleClearMemory = async () => {
    if (!isConfirmingClear) {
      setIsConfirmingClear(true);
      toast.warning('اضغط مرة أخرى لتأكيد مسح الذاكرة');
      setTimeout(() => setIsConfirmingClear(false), 3000);
      return;
    }

    await del('logicLab_uploadedFiles');
    await del('logicLab_completedFiles');
    await del('logicLab_analysis');
    await del('logicLab_targetLanguage');
    await del('logicLab_code');
    
    setUploadedFiles([]);
    setCompletedFiles({});
    setAnalysis(null);
    setCode('');
    setIsPaused(false);
    setConversionProgress({ current: 0, total: 0, currentFile: '' });
    setIsConfirmingClear(false);
    toast.success('تم مسح الذاكرة بنجاح');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset all states for a new upload
    setIsAnalyzing(true);
    setCompletedFiles({});
    setIsPaused(false);
    setAnalysis(null);
    setConversionProgress({ current: 0, total: 0, currentFile: '' });
    shouldStopRef.current = false;

    toast.info('جاري قراءة الملفات...');
    try {
      const files: {path: string, content: string, isBinary?: boolean}[] = [];
      
      if (file.name.endsWith('.zip')) {
        const zip = await JSZip.loadAsync(file);
        const promises: Promise<void>[] = [];
        
        zip.forEach((relativePath, zipEntry) => {
          if (!zipEntry.dir && !relativePath.includes('node_modules') && !relativePath.includes('.git') && !relativePath.includes('__MACOSX') && !relativePath.endsWith('.DS_Store')) {
            const ext = relativePath.split('.').pop()?.toLowerCase();
            const binaryExts = ['png', 'jpg', 'jpeg', 'gif', 'ico', 'mp4', 'mp3', 'wav', 'zip', 'pdf', 'exe', 'dll', 'woff', 'woff2', 'ttf', 'eot'];
            if (binaryExts.includes(ext || '')) {
              promises.push(
                zipEntry.async('base64').then(content => {
                  files.push({ path: relativePath, content, isBinary: true });
                })
              );
            } else {
              promises.push(
                zipEntry.async('string').then(content => {
                  files.push({ path: relativePath, content, isBinary: false });
                })
              );
            }
          }
        });
        
        await Promise.all(promises);
      } else {
        const text = await file.text();
        files.push({ path: file.name, content: text, isBinary: false });
      }
      
      setUploadedFiles(files);
      const combinedCode = files.filter(f => !f.isBinary).map(f => `// --- File: ${f.path} ---\n${f.content}`).join('\n\n');
      
      // If code is massive, truncate it for the textarea to prevent browser freeze, but keep full files in state
      if (combinedCode.length > 50000) {
        setCode(combinedCode.substring(0, 50000) + '\n\n... [الكود طويل جداً، تم إخفاء الباقي للعرض فقط، لكن المشروع بالكامل محفوظ في الذاكرة]');
      } else {
        setCode(combinedCode);
      }
      
      toast.success(`تم قراءة ${files.length} ملف بنجاح`);
    } catch (error) {
      console.error(error);
      toast.error('فشل قراءة الملف');
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePause = () => {
    shouldStopRef.current = true;
    setIsPaused(true);
    toast.info('تم إرسال أمر الإيقاف، سيتوقف بعد اكتمال الملف الحالي.');
  };

  const handleAnalyze = async () => {
    if (!code && uploadedFiles.length === 0) {
      toast.error('يرجى إدخال الكود أو رفع ملفات المشروع أولاً');
      return;
    }

    setIsAnalyzing(true);
    setIsPaused(false);
    shouldStopRef.current = false;

    try {
      // Use uploaded files if available, otherwise treat textarea as a single file
      const filesToProcess = uploadedFiles.length > 0 ? uploadedFiles : [{ path: 'main.txt', content: code }];
      const isLargeProject = filesToProcess.length > 3 || filesToProcess.reduce((acc, f) => acc + f.content.length, 0) > 20000;

      // Step 1: Analyze Architecture (Only if not already done)
      if (!analysis?.mermaid) {
        toast.info('جاري تحليل بنية المشروع والمنطق...');
        
        let projectSummary = filesToProcess.map(f => `- ${f.path}`).join('\n');
        
        // Sort files by depth so root files (like package.json, index.js) are sampled first for better context
        const sortedForSample = [...filesToProcess].sort((a, b) => {
          const aDepth = a.path.split('/').length;
          const bDepth = b.path.split('/').length;
          return aDepth - bDepth;
        });

        let codeSample = '';
        let currentLength = 0;
        for (const f of sortedForSample) {
          const isLockFile = f.path.endsWith('package-lock.json') || f.path.endsWith('yarn.lock') || f.path.endsWith('pnpm-lock.yaml');
          if (!f.isBinary && !isLockFile && currentLength < 30000) { 
            codeSample += `\n// --- File: ${f.path} ---\n${f.content.substring(0, 3000)}`;
            currentLength += 3000;
          }
        }

        const archPrompt = `You are an expert Reverse Engineer and Software Architect.
        Analyze this codebase structure and core logic.
        Target Language/Framework for the new project: ${targetLanguage}
        
        Project Files:
        ${projectSummary}
        
        Code Sample:
        ${codeSample}

        REQUIREMENTS:
        1. Understand the core logic, architecture, and purpose of the original code.
        2. Create a Mermaid.js flowchart explaining the logic.
        3. Provide a detailed explanation of the data flow and potential bottlenecks.
        
        CRITICAL MERMAID RULES:
        - Use ONLY valid Mermaid syntax (graph TD).
        - Do NOT use special characters like >, <, &, or quotes inside node labels unless properly escaped.
        - Do NOT use spaces in node IDs (e.g., use \`A\` not \`Node A\`).
        - Keep it simple and high-level to avoid parsing errors.
        
        Return ONLY a valid JSON object with this exact structure:
        {
          "mermaid": "graph TD\\n  A[Start] --> B[Process]\\n...",
          "explanation": "Detailed explanation here..."
        }
        Do not include markdown formatting outside the JSON.`;

        try {
          const archRes = await brandApi.executeUniversal({
            prompt: archPrompt,
            taskType: 'coding',
            systemPrompt: 'You are an expert Reverse Engineer. Return ONLY JSON.',
            // Use selected model if available
            ...(selectedModel ? { modelName: selectedModel } : {})
          } as any);
          
          let archResponseText = archRes.text.trim();
          if (archResponseText.startsWith('```json')) archResponseText = archResponseText.replace(/^```json/, '').replace(/```$/, '').trim();
          else if (archResponseText.startsWith('```')) archResponseText = archResponseText.replace(/^```/, '').replace(/```$/, '').trim();
          
          const parsedArch = JSON.parse(archResponseText);
          
          // Save architecture analysis immediately so we don't lose it if paused
          setAnalysis({
            mermaid: parsedArch.mermaid || 'graph TD\n  A[Start] --> B[Project Logic]',
            explanation: parsedArch.explanation || 'تم تحليل المشروع بنجاح.'
          });
        } catch (e) {
          console.error("Architecture analysis failed:", e);
          toast.warning('تعذر إنشاء المخطط التفاعلي بسبب حجم المشروع، جاري استكمال التحويل...');
          setAnalysis({
            mermaid: 'graph TD\n  A[المشروع ضخم جداً] --> B[تعذر رسم المخطط التفاعلي]\n  B --> C[لكن عملية التحويل مستمرة بنجاح]',
            explanation: 'المشروع ضخم جداً أو معقد لدرجة أن الذكاء الاصطناعي لم يتمكن من رسم المخطط التفاعلي له في خطوة واحدة. لا تقلق، عملية تحويل الملفات ستستمر بشكل طبيعي.'
          });
        }
      }

      // Step 2: Convert Files
      if (isLargeProject && Object.keys(completedFiles).length === 0) {
        toast.info('المشروع كبير، جاري تحويل الملفات تدريجياً لتجنب الأخطاء...');
      } else if (Object.keys(completedFiles).length > 0) {
        toast.info('جاري استكمال التحويل من حيث توقف...');
      }
      
      let currentCompleted = { ...completedFiles };

      for (let i = 0; i < filesToProcess.length; i++) {
        if (shouldStopRef.current) {
          break;
        }

        const file = filesToProcess[i];
        
        // Skip if already converted
        if (currentCompleted[file.path]) {
          continue; 
        }

        setConversionProgress({ current: i + 1, total: filesToProcess.length, currentFile: file.path });
        
        // Skip AI processing for binary files, lock files, and large data files but keep them in the project
        const isLockFile = file.path.endsWith('package-lock.json') || file.path.endsWith('yarn.lock') || file.path.endsWith('pnpm-lock.yaml');
        if (file.isBinary || isLockFile) {
          currentCompleted[file.path] = { path: file.path, content: file.content, isBinary: file.isBinary };
          setCompletedFiles(prev => ({...prev, [file.path]: { path: file.path, content: file.content, isBinary: file.isBinary }}));
          continue;
        }

        const isReadme = file.path.toLowerCase().includes('readme');
        
        let success = false;
        let useChunking = file.content.length > 15000 && !isReadme; // Proactively chunk if very large
        let retries = 0;

        // Infinite retry loop: keeps trying until success or user manually pauses
        while (!success && !shouldStopRef.current) {
          try {
            retries++;
            let newContent = '';
            
            if (useChunking) {
              if (retries === 2) toast.info(`الملف ${file.path} ضخم، جاري تقسيمه وتحويله بدقة لضمان عدم فقدان أي كود...`);
              
              const lines = file.content.split('\n');
              const chunks = [];
              let currentChunk = '';
              for (const line of lines) {
                if (currentChunk.length + line.length > 12000) {
                  chunks.push(currentChunk);
                  currentChunk = line + '\n';
                } else {
                  currentChunk += line + '\n';
                }
              }
              if (currentChunk) chunks.push(currentChunk);

              for (let c = 0; c < chunks.length; c++) {
                if (shouldStopRef.current) break;
                const chunkPrompt = `You are an expert developer and software architect. We are translating a large file into: ${targetLanguage}.
                This is PART ${c + 1} OF ${chunks.length} of the file: ${file.path}.
                
                CRITICAL REQUIREMENTS:
                1. Translate/Rewrite ONLY this specific part.
                2. Maintain the exact same core functionality.
                3. FIX ANY BUGS.
                4. Do NOT close brackets or blocks that are opened in this part unless they close in this part. Just translate the code exactly as it corresponds to the original part.
                
                Original Content (Part ${c + 1} of ${chunks.length}):
                ${chunks[c]}
                
                CRITICAL INSTRUCTION: Return ONLY the raw code for this part. NO conversational text. NO markdown code blocks.`;
                
                const res = await brandApi.executeUniversal({
                  prompt: chunkPrompt,
                  taskType: 'coding',
                  ...(selectedModel ? { modelName: selectedModel } : {})
                } as any);
                
                let chunkText = res.text.trim();
                const match = chunkText.match(/```[a-zA-Z]*\n([\s\S]*?)```/);
                if (match && match[1]) chunkText = match[1].trim();
                else chunkText = chunkText.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
                
                newContent += chunkText + '\n';
              }
            } else {
              const convertPrompt = isReadme 
                ? `You are an expert technical writer and developer. We are converting a project to: ${targetLanguage}.
              Write a highly professional, comprehensive README.md for the NEW project.
              
              REQUIRED STRUCTURE:
              # 🚀 [Project Name]
              > A brief, professional description of the project.
              
              ## 🛠️ Tech Stack
              - ${targetLanguage}
              
              ## ✨ Features
              - Feature 1
              - Feature 2
              
              ## ⚙️ Installation & Setup
              1. Step 1
              2. Step 2
              
              Original README for context (if any):
              ${file.content}
              
              CRITICAL INSTRUCTION: Return ONLY the raw markdown content. Start directly with the "# 🚀" title. NO conversational text. NO random numbers.`
                : `You are an expert developer and software architect. Translate/Rewrite the following file into: ${targetLanguage}.
              
              CRITICAL REQUIREMENTS:
              1. Maintain the exact same core functionality and purpose.
              2. FIX ANY BUGS, logical errors, or bad practices present in the original code.
              3. Implement ROBUST ERROR HANDLING (e.g., try-catch blocks, input validation, proper error messages).
              4. Refactor the code to follow the best practices and standard design patterns of the target language.
              5. Ensure the code is production-ready, stable, and secure.
              
              File Path: ${file.path}
              
              Original Content:
              ${file.content}
              
              CRITICAL INSTRUCTION: Return ONLY the raw code. NO conversational text. NO explanations. NO markdown code blocks (do not use \`\`\`). Your entire response must be valid code that can be saved directly to a file. If the file doesn't need translation, return it as is.`;
              
              const convertRes = await brandApi.executeUniversal({
                prompt: convertPrompt,
                taskType: 'coding',
                ...(selectedModel ? { modelName: selectedModel } : {})
              } as any);
              
              newContent = convertRes.text.trim();
              
              if (!isReadme) {
                const codeBlockRegex = /```[a-zA-Z]*\n([\s\S]*?)```/;
                const match = newContent.match(codeBlockRegex);
                if (match && match[1]) {
                  newContent = match[1].trim();
                } else {
                  newContent = newContent.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
                }
              } else {
                // For README, just strip the markdown wrapper if the AI accidentally included it
                newContent = newContent.replace(/^```markdown\n?/i, '').replace(/^```\n?/, '').replace(/```$/, '').trim();
                
                // Fallback if AI still hallucinated a random number or empty response
                if (!newContent || newContent.length < 20 || !isNaN(Number(newContent))) {
                  newContent = `# 🚀 Project Documentation\n\n## 🛠️ Tech Stack\n- ${targetLanguage}\n\n## 📝 Description\nتم تحويل هذا المشروع بنجاح إلى ${targetLanguage}.`;
                }
              }
            }
            
            if (shouldStopRef.current) break;

            let newPath = file.path;
            if (targetLanguage.toLowerCase().includes('python') && newPath.match(/\.(js|ts|java|c|cpp|cs)$/)) newPath = newPath.replace(/\.[^/.]+$/, ".py");
            if (targetLanguage.toLowerCase().includes('react') && newPath.match(/\.(html)$/)) newPath = newPath.replace(/\.[^/.]+$/, ".tsx");
            
            currentCompleted[file.path] = { path: newPath, content: newContent };
            setCompletedFiles(prev => ({...prev, [file.path]: { path: newPath, content: newContent }}));
            success = true;
          } catch (e: any) {
            console.error(`Failed to convert ${file.path}`, e);
            const errMsg = e?.message?.toLowerCase() || String(e).toLowerCase();
            
            // Only chunk if it's an AI exhaustion/size error, not a network drop
            const isOverloaded = errMsg.includes('exhausted') || errMsg.includes('429') || errMsg.includes('503') || errMsg.includes('overloaded') || errMsg.includes('size');
            
            if (!useChunking && !isReadme && isOverloaded) {
              useChunking = true;
              toast.warning(`الملف ${file.path} تسبب في ضغط على الذكاء الاصطناعي، سيتم تقسيمه والمحاولة مرة أخرى لضمان تحويله بالكامل...`);
              continue; // Retry immediately with chunking enabled
            }

            // Infinite retry for network errors or temporary glitches
            toast.warning(`مشكلة في الاتصال أو السيرفر، جاري إعادة المحاولة تلقائياً للملف ${file.path}...`);
            await new Promise(r => setTimeout(r, 5000)); // Wait 5 seconds before retrying
          }
        }
      }

      if (!shouldStopRef.current) {
        setAnalysis((prev: any) => ({
          ...prev,
          project: { files: Object.values(currentCompleted) }
        }));
        toast.success('تمت الهندسة العكسية وتحويل المشروع بنجاح');
        setIsAnalyzing(false);
        setConversionProgress({ current: 0, total: 0, currentFile: '' });
      } else {
        setIsAnalyzing(false);
      }
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى');
      setIsAnalyzing(false);
      setIsPaused(true);
    }
  };

  const handleDownloadAnalysis = () => {
    if (!analysis) return;
    const content = `--- Mermaid Flowchart ---\n${analysis.mermaid || 'N/A'}\n\n--- Explanation ---\n${analysis.explanation}`;
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'logic_analysis.txt';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('تم تحميل التحليل');
  };

  const handleDownloadProjectZip = async () => {
    if (!analysis?.project?.files) return;
    try {
      const zip = new JSZip();
      analysis.project.files.forEach((f: any) => {
        if (f.isBinary) {
          zip.file(f.path, f.content, { base64: true });
        } else {
          zip.file(f.path, f.content);
        }
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reversed_project.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('تم تحميل المشروع المحول كـ ZIP');
    } catch (e) {
      console.error(e);
      toast.error('فشل تحميل المشروع');
    }
  };

  const handleCopy = () => {
    if (!analysis) return;
    const content = `--- Mermaid Flowchart ---\n${analysis.mermaid || 'N/A'}\n\n--- Explanation ---\n${analysis.explanation}`;
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    toast.success('تم النسخ');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Search className="text-purple-400" />
            مختبر الهندسة العكسية (Logic Reverse Lab)
          </h2>
          <p className="text-gray-400">افهم الأكواد المعقدة، ارفع مشاريع كاملة، وحولها إلى هندسة عكسية بلغات أخرى</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-400">الكود البرمجي أو ملفات المشروع</label>
              <div className="flex items-center gap-2">
                {(uploadedFiles.length > 0 || code) && (
                  <button 
                    onClick={handleClearMemory}
                    className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors ${isConfirmingClear ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}`}
                  >
                    <Trash2 size={14} />
                    {isConfirmingClear ? 'تأكيد المسح؟' : 'مسح الذاكرة'}
                  </button>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".zip,.js,.ts,.py,.java,.c,.cpp,.cs,.php,.html,.css,.json"
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Upload size={14} />
                  رفع مشروع (ZIP)
                </button>
              </div>
            </div>
            
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="الصق الكود هنا أو قم برفع ملف ZIP للمشروع..."
              className="w-full h-[300px] bg-transparent border border-white/5 rounded-lg p-3 focus:border-purple-500 outline-none text-gray-300 font-mono text-sm resize-none"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">نموذج القاعدة (Base Model)</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white outline-none focus:border-purple-500 transition-colors"
                  disabled={isLoadingModels}
                >
                  {isLoadingModels ? (
                    <option>جاري تحميل النماذج...</option>
                  ) : (
                    models.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.provider})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">لغة البرمجة المستهدفة (للتحويل)</label>
                <input
                  type="text"
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  placeholder="مثال: Python, React+Node.js, أو نفس اللغة..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || (!code && uploadedFiles.length === 0)}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg py-3 font-medium flex items-center justify-center gap-2 transition-all relative overflow-hidden"
            >
              {isAnalyzing && conversionProgress.total > 0 && (
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-purple-500/50 transition-all duration-300"
                  style={{ width: `${(Object.keys(completedFiles).length / conversionProgress.total) * 100}%` }}
                />
              )}
              <div className="relative flex items-center gap-2">
                {isAnalyzing ? <Loader2 className="animate-spin" /> : (isPaused ? <Play size={18} /> : <GitBranch size={18} />)}
                {isAnalyzing && conversionProgress.total > 0 
                  ? `جاري تحويل الملف (${Object.keys(completedFiles).length + 1}/${conversionProgress.total})` 
                  : (Object.keys(completedFiles).length > 0 && !analysis?.project ? 'استكمال التحويل' : 'هندسة عكسية وتحويل المشروع')}
              </div>
            </button>

            {isAnalyzing && (
              <button
                onClick={handlePause}
                className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-4 rounded-lg flex items-center justify-center transition-colors"
                title="إيقاف مؤقت"
              >
                <Pause size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-xl p-4 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-gray-400">نتائج الهندسة العكسية</label>
            {analysis && (
              <div className="flex items-center gap-2">
                {analysis.project?.files && (
                  <button onClick={handleDownloadProjectZip} className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors font-medium">
                    <FileArchive size={14} />
                    تحميل المشروع (ZIP)
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
            {!analysis && !isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
                <FileCode size={48} className="opacity-20" />
                <p>ستظهر نتائج التحليل والمشروع المحول هنا</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center text-purple-400 space-y-4">
                <Loader2 size={48} className="animate-spin opacity-50" />
                <div className="text-center">
                  <p className="font-bold mb-1">جاري فك شفرة المشروع وإعادة بنائه...</p>
                  {conversionProgress.total > 0 && (
                    <p className="text-xs text-purple-300/70">
                      معالجة: {conversionProgress.currentFile}
                    </p>
                  )}
                </div>
              </div>
            )}

            {analysis && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-purple-300">شرح منطق الكود:</h4>
                  <div className="flex gap-2">
                    <button onClick={handleCopy} className="text-gray-400 hover:text-white text-xs flex items-center gap-1">
                      {isCopied ? <CheckCircle2 size={12} className="text-green-500" /> : <Copy size={12} />} نسخ
                    </button>
                    <button onClick={handleDownloadAnalysis} className="text-gray-400 hover:text-white text-xs flex items-center gap-1">
                      <Download size={12} /> تحميل النص
                    </button>
                  </div>
                </div>
                
                <div className="prose prose-invert max-w-none bg-white/5 p-4 rounded-lg border border-white/5">
                  <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {analysis.explanation}
                  </div>
                </div>

                {analysis.mermaid && (
                  <div className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <h4 className="text-xs font-bold text-purple-300 mb-2 uppercase tracking-wider">المخطط التفاعلي (Mermaid)</h4>
                    <MermaidDiagram chart={analysis.mermaid} />
                    <details className="mt-4">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">عرض كود المخطط</summary>
                      <pre className="text-xs text-gray-400 font-mono overflow-x-auto p-2 bg-black/20 rounded mt-2">
                        {analysis.mermaid}
                      </pre>
                    </details>
                  </div>
                )}

                {analysis.project?.files && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-purple-300 mb-2">ملفات المشروع المحول:</h4>
                    {analysis.project.files.map((file: any, idx: number) => (
                      <div key={idx} className="bg-black/40 border border-white/5 rounded-lg p-3">
                        <div className="text-xs font-mono text-purple-300 mb-2">{file.path}</div>
                        <pre className="text-xs text-gray-400 font-mono overflow-x-auto p-2 bg-black/20 rounded max-h-40">
                          {file.content}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
