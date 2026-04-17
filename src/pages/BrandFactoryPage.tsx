import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Rocket, 
  Cpu, 
  Palette, 
  Code, 
  MessageSquare, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  Globe,
  Zap,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Layout,
  Eye,
  Send,
  Bot,
  User,
  Sparkles,
  ChevronRight,
  Download,
  AlertCircle,
  Menu,
  X,
  Settings,
  Database,
  Layers,
  Component,
  Wrench,
  UploadCloud,
  Share2
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { Drawer } from "vaul";
import { useWindowSize } from "react-use";
import { brandApi } from "../api/brandApi";
import { cn } from "@/src/lib/utils";
import { SmartTools } from "../components/features/SmartTools";
import { UniversalModels } from "../components/features/UniversalModels";
import { ContentLab } from "../components/features/ContentLab";
import { RecentProjects } from "../components/features/RecentProjects";
import { WelcomeTable } from "../components/features/WelcomeTable";
import { DatabaseExplorer } from "../components/features/DatabaseExplorer";
import { PlatformLayout } from "../components/platform/PlatformLayout";

interface BrandStrategy {
  name: string;
  slogan: string;
  marketingSteps: string[];
  targetAudience: string;
  brandVoice?: string;
  poetry?: string;
  clarifyingQuestions?: string[];
  alternativeStrategies?: { name: string; description: string }[];
}

const translations = {
  en: {
    title: "IDEA TO",
    entity: "ENTITY",
    subtitle: "The self-evolving factory that transforms a single sentence into a fully operational business entity.",
    placeholder: "Describe your brand idea (e.g., Smart clothing that changes color with weather)",
    launch: "LAUNCH FACTORY",
    manufacturing: "MANUFACTURING...",
    roadmap: "Marketing Roadmap",
    essence: "Brand Essence",
    voice: "Brand Voice",
    manifesto: "Manifesto",
    sentiment: "Market Sentiment Analysis",
    support: "Agent Support",
    online: "Online & Trained",
    chatPlaceholder: "Try talking to the assistant...",
    preview: "Live Preview",
    download: "Download (ZIP)",
    agents: "Assigned AI Agents",
    target: "Target",
    live: "Live on Supabase",
    security: "Security & Compliance",
    footer: "Built with Groq & CometAPI",
    chatError: "Sorry, I'm having trouble connecting right now. Please try again later.",
    chatIntro: "Hello! I am the AI assistant for",
    chatIntro2: ". I've been trained on your brand identity. How can I help your customers today?"
  },
  ar: {
    title: "من الفكرة إلى",
    entity: "الكيان",
    subtitle: "المصنع ذاتي التطور الذي يحول جملة واحدة إلى كيان تجاري كامل التشغيل.",
    placeholder: "صف فكرة علامتك التجارية (مثلاً: ملابس ذكية يتغير لونها مع الطقس)",
    launch: "إطلاق المصنع",
    manufacturing: "جاري التصنيع...",
    roadmap: "خارطة الطريق التسويقية",
    essence: "جوهر العلامة",
    voice: "صوت العلامة",
    manifesto: "البيان (Manifesto)",
    sentiment: "تحليل مشاعر السوق",
    support: "دعم الوكيل",
    online: "متصل ومدرب",
    chatPlaceholder: "جرب التحدث مع المساعد...",
    preview: "معاينة مباشرة",
    download: "تحميل (ZIP)",
    agents: "وكلاء الذكاء المعينين",
    target: "الهدف",
    live: "مباشر على Supabase",
    security: "الأمن والامتثال",
    footer: "تم البناء بواسطة Groq و CometAPI",
    chatError: "عذراً، أواجه مشكلة في الاتصال حالياً. يرى المحاولة لاحقاً.",
    chatIntro: "مرحباً! أنا مساعد الذكاء الاصطناعي لعلامة",
    chatIntro2: ". لقد تم تدريبي على هوية علامتك التجارية. كيف يمكنني مساعدة عملائك اليوم؟"
  }
};

type AgentStatus = "idle" | "working" | "completed" | "error";

export const BrandFactoryPage = () => {
  const [idea, setIdea] = useState("");
  const [niche, setNiche] = useState("");
  const [brandVoice, setBrandVoice] = useState("");
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [isBuilding, setIsBuilding] = useState(false);
  const [projectType, setProjectType] = useState<'single' | 'multi'>('single');
  
  const [strategy, setStrategy] = useState<BrandStrategy | null>(null);
  const [appStructure, setAppStructure] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [sentiment, setSentiment] = useState<any | null>(null);
  const [deployed, setDeployed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [projectFiles, setProjectFiles] = useState<any[] | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [assignedAgents, setAssignedAgents] = useState<{logic?: any, vision?: any} | null>(null);

  const [chatMessages, setChatMessages] = useState<{role: 'user'|'agent', content: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'agents' | 'templates' | 'libraries' | 'code' | 'capabilities' | 'upload' | 'content' | 'models' | 'tools' | 'database'>('agents');

  const [editorCode, setEditorCode] = useState("");
  const [isAnalyzingCode, setIsAnalyzingCode] = useState(false);
  const [editorResult, setEditorResult] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    // Alert user about new features
    const timer = setTimeout(() => {
      toast.info(lang === 'ar' ? "تمت إضافة ميزات جديدة: مختبر المحتوى، النماذج العالمية، وتعاون الوكلاء!" : "New features added: Content Lab, Universal Models, and Agent Collaboration!", {
        duration: 5000,
        icon: <Sparkles className="w-4 h-4 text-orange-500" />
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (strategy) {
      setChatMessages([
        {
          role: "agent",
          content: `${t.chatIntro} ${strategy.name}${t.chatIntro2}`,
        },
      ]);
    }
  }, [strategy, lang]);

  const [agents, setAgents] = useState({
    alpha: "idle" as AgentStatus,
    visual: "idle" as AgentStatus,
    ui: "idle" as AgentStatus,
    dev: "idle" as AgentStatus,
    support: "idle" as AgentStatus,
  });

  const steps = [
    { id: "alpha", name: "Agent Alpha", icon: Cpu, desc: "Strategy & Identity" },
    { id: "visual", name: "Agent Visual", icon: Palette, desc: "Visual Identity" },
    { id: "ui", name: "Agent UI", icon: Layout, desc: "Interface Design" },
    { id: "dev", name: "Agent Dev", icon: Code, desc: "Deployment & DB" },
    { id: "support", name: "Agent Support", icon: MessageSquare, desc: "AI Support Bot" },
  ];

  const { width } = useWindowSize();
  const isMobile = width < 768;

  const handleBuild = async () => {
    if (!idea) return;
    setIsBuilding(true);
    setDeployed(false);
    setStrategy(null);
    setLogoUrl(null);
    setSentiment(null);
    setErrorMessage(null);
    
    try {
      setAgents(prev => ({ ...prev, alpha: "working" }));
      const initData = await brandApi.initializeBrand(idea, idea);
      setAssignedAgents(initData.agents);
      toast.info(lang === 'ar' ? "بدء عملية التصنيع..." : "Starting manufacturing process...");

      let sentimentData = null;
      try {
        sentimentData = await brandApi.analyzeSentiment(idea);
        setSentiment(sentimentData);
      } catch (e) {
        console.warn("Sentiment analysis skipped due to error", e);
      }

      const strategyData = await brandApi.generateStrategy(idea, niche, brandVoice);
      setStrategy(strategyData);
      setAgents(prev => ({ ...prev, alpha: "completed", visual: "working" }));
      toast.success(lang === 'ar' ? "تم توليد الاستراتيجية" : "Strategy generated");

      const logoData = await brandApi.generateLogo(strategyData.name, idea);
      setLogoUrl(logoData.logoUrl);
      setAgents(prev => ({ ...prev, visual: "completed", ui: "working" }));
      toast.success(lang === 'ar' ? "تم تصميم الشعار" : "Logo designed");

      const uiData = await brandApi.generateProject(
        `Create a complete website for ${strategyData.name} based on this idea: ${idea}. Return a JSON object with title, description, sections, and theme.`,
        "json"
      );
      if (uiData.appStructure) {
        setAppStructure(uiData.appStructure);
      }

      let finalHtml = "";
      let files = null;
      
      if (projectType === 'multi') {
        const multiProject = await brandApi.generateMultiFileProject(
          `Create a complete multi-file project for ${strategyData.name} based on this idea: ${idea}.`
        );
        files = multiProject.project.files;
        setProjectFiles(files);
        
        finalHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${strategyData.name}</title>
            <style>
              body { font-family: system-ui, sans-serif; background: #111; color: white; padding: 2rem; }
              .container { max-width: 800px; margin: 0 auto; }
              .file { background: #222; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; border: 1px solid #333; }
              .path { font-weight: bold; color: #f97316; margin-bottom: 0.5rem; }
              pre { background: #000; padding: 1rem; border-radius: 4px; overflow-x: auto; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>${strategyData.name} - Multi-File Project</h1>
              <p>Tech Stack: ${multiProject.project.tech_stack}</p>
              <p>Download the ZIP file to run the project locally.</p>
              ${files.map((f: any) => `
                <div class="file">
                  <div class="path">${f.path}</div>
                  <pre><code>${f.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
                </div>
              `).join('')}
            </div>
          </body>
          </html>
        `;
        setGeneratedHtml(finalHtml);
      } else {
        const htmlData = await brandApi.generateProject(
          `Create a complete, single-file HTML website for ${strategyData.name} based on this idea: ${idea}. Include all CSS and JS.`,
          "html"
        );
        finalHtml = htmlData.html;
        setGeneratedHtml(finalHtml);
      }

      setAgents(prev => ({ ...prev, ui: "completed", dev: "working" }));

      const deployRes = await brandApi.deploy(
        strategyData.name, 
        { ...strategyData, logoUrl: logoData.logoUrl, sentiment: sentimentData }, 
        finalHtml,
        strategyData.marketingSteps,
        98,
        files
      );
      
      if (deployRes?.data?.id) {
        setDeploymentId(deployRes.data.id);
      }

      setAgents(prev => ({ ...prev, dev: "completed", support: "completed" }));
      setDeployed(true);
      toast.success(lang === 'ar' ? "تم النشر بنجاح" : "Deployed successfully");

    } catch (error: any) {
      console.error("Build failed:", error);
      setErrorMessage(error.message || "An unexpected error occurred. Please try again.");
      setAgents({ alpha: "error", visual: "error", ui: "error", dev: "error", support: "error" });
      toast.error(lang === 'ar' ? "فشل في التصنيع" : "Manufacturing failed");
    } finally {
      setIsBuilding(false);
    }
  };

  const handleChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isChatting || !strategy) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsChatting(true);

    try {
      const prompt = `You are the AI support agent for a brand named "${strategy.name}". 
      Brand Slogan: "${strategy.slogan}". 
      Target Audience: "${strategy.targetAudience}".
      User says: "${userMsg}"
      Respond helpfully, concisely, and stay in character. If the user speaks Arabic, respond in Arabic.`;

      const data = await brandApi.chat(prompt);
      setChatMessages(prev => [...prev, { role: "agent", content: data.text }]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages(prev => [...prev, { role: "agent", content: t.chatError }]);
    } finally {
      setIsChatting(false);
    }
  };

  const handlePreviewUI = () => {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const handleDownload = async () => {
    if (!strategy || !deploymentId) return;
    try {
      const response = await fetch(`/api/download-project/${deploymentId}`);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${strategy.name.replace(/\s+/g, '_').toLowerCase()}_project.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: strategy.name,
          text: `Check out my new brand strategy for ${strategy.name}!`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(lang === 'ar' ? 'تم نسخ الرابط' : 'Link copied to clipboard');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      toast.success(lang === 'ar' ? `تم اختيار ${files.length} ملفات` : `Selected ${files.length} files`);
      // Here we would normally upload the files to the server
      // For now, we'll just simulate a successful upload
      setTimeout(() => {
        toast.info(lang === 'ar' ? "جاري تحليل الملفات بواسطة الذكاء الاصطناعي..." : "AI is analyzing the files...");
      }, 1000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      toast.success(lang === 'ar' ? `تم إسقاط ${files.length} ملفات` : `Dropped ${files.length} files`);
      setTimeout(() => {
        toast.info(lang === 'ar' ? "جاري تحليل الملفات..." : "Analyzing files...");
      }, 1000);
    }
  };

  const handleCollaborate = async () => {
    if (!strategy) return;
    toast.info(lang === 'ar' ? "بدء تعاون الوكلاء (Alpha, Visual, UI, Dev)..." : "Starting collaboration between agents (Alpha, Visual, UI, Dev)...");
    
    setAgents({
      alpha: "working",
      visual: "working",
      ui: "working",
      dev: "working",
      support: "working"
    });

    try {
      const prompt = `Simulate a collaboration between 4 AI agents (Alpha: Strategist, Visual: Designer, UI: Frontend, Dev: Backend) for the project "${strategy.name}". 
      They should discuss the current state and suggest improvements or fix potential errors. 
      Provide a summary of their collaboration and final recommendations.`;
      
      const res = await brandApi.chat(prompt);
      
      setChatMessages(prev => [...prev, { 
        role: "agent", 
        content: `🤖 **Multi-Agent Collaboration Report:**\n\n${res.text}` 
      }]);
      
      setAgents({
        alpha: "completed",
        visual: "completed",
        ui: "completed",
        dev: "completed",
        support: "completed"
      });
      
      toast.success(lang === 'ar' ? 'اكتمل تعاون الوكلاء' : 'Agent collaboration completed');
    } catch (error) {
      setAgents({
        alpha: "error",
        visual: "error",
        ui: "error",
        dev: "error",
        support: "error"
      });
    }
  };

  return (
    <PlatformLayout>
      <div className={`min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-orange-500 selection:text-black ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Toaster position="top-center" richColors />
        {/* Background Grid */}
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        
        <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
          {/* Header */}
          <header className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Zap className="text-black w-6 h-6 fill-current" />
                </div>
                <span className="text-xs font-mono tracking-widest uppercase opacity-50">Autonomous Brand Factory v2.5</span>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <button 
                  onClick={() => {
                    setActiveSettingsTab('content');
                    setIsSettingsOpen(true);
                  }}
                  className="flex px-3 md:px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-500 text-[10px] md:text-xs font-bold hover:bg-orange-500/20 transition-all items-center gap-2 relative"
                >
                  <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">{lang === 'ar' ? 'مختبر المحتوى' : 'Content Lab'}</span>
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-orange-500 text-black text-[7px] md:text-[8px] font-black rounded-full animate-bounce">NEW</span>
                </button>
                <button 
                  onClick={() => {
                    setActiveSettingsTab('models');
                    setIsSettingsOpen(true);
                  }}
                  className="flex px-3 md:px-4 py-2 rounded-full bg-zinc-800 border border-white/10 text-[10px] md:text-xs font-bold hover:bg-zinc-700 transition-all items-center gap-2 relative"
                >
                  <Database className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">{lang === 'ar' ? 'النماذج العالمية' : 'Universal Models'}</span>
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-blue-500 text-white text-[7px] md:text-[8px] font-black rounded-full animate-pulse">NEW</span>
                </button>
                <button 
                  onClick={() => {
                    setActiveSettingsTab('tools');
                    setIsSettingsOpen(true);
                  }}
                  className="flex px-3 md:px-4 py-2 rounded-full bg-zinc-800 border border-white/10 text-[10px] md:text-xs font-bold hover:bg-zinc-700 transition-all items-center gap-2 relative"
                >
                  <Wrench className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline">{lang === 'ar' ? 'أدوات ذكية' : 'Smart Tools'}</span>
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-green-500 text-white text-[7px] md:text-[8px] font-black rounded-full animate-pulse">NEW</span>
                </button>
                <button 
                  onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                  className="px-3 md:px-4 py-2 rounded-full border border-white/10 text-[10px] md:text-xs font-bold hover:bg-white/5 transition-all flex items-center gap-2"
                >
                  <Globe className="w-3 h-3 md:w-4 md:h-4" />
                  {lang === 'en' ? 'العربية' : 'English'}
                </button>
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 rounded-full border border-white/10 hover:bg-white/5 transition-all"
                >
                  <Settings className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-6 leading-none">
              {t.title} <span className="text-orange-500 italic">{t.entity}</span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl leading-relaxed">
              {t.subtitle}
            </p>
            
            {/* Welcome Table Section - Moved inside header for better visibility */}
            <div className="mt-10">
              <WelcomeTable lang={lang} />
            </div>
          </header>

          {/* Input Section */}
          <section className="mb-16 md:mb-20">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setProjectType('single')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${projectType === 'single' ? 'bg-orange-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
              >
                {lang === 'ar' ? 'ملف واحد (معاينة)' : 'Single File (Preview)'}
              </button>
              <button
                onClick={() => setProjectType('multi')}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${projectType === 'multi' ? 'bg-orange-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
              >
                {lang === 'ar' ? 'مشروع كامل (متعدد الملفات)' : 'Full Project (Multi-file)'}
              </button>
            </div>
            <div className="flex flex-col md:relative group gap-4 md:gap-0">
              <input
                type="text"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder={t.placeholder}
                className="w-full bg-zinc-900/50 border-b-2 border-zinc-800 p-6 md:p-8 text-xl md:text-2xl lg:text-3xl focus:outline-none focus:border-orange-500 transition-colors placeholder:opacity-30 rounded-2xl md:rounded-none"
                disabled={isBuilding}
              />
              <div className="flex flex-col md:flex-row gap-4 p-4">
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder={lang === 'ar' ? 'السوق المتخصص (اختياري)' : 'Niche Market (Optional)'}
                  className="w-full bg-zinc-900/50 border border-zinc-800 p-3 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  disabled={isBuilding}
                />
                <input
                  type="text"
                  value={brandVoice}
                  onChange={(e) => setBrandVoice(e.target.value)}
                  placeholder={lang === 'ar' ? 'صوت العلامة التجارية (اختياري)' : 'Brand Voice (Optional)'}
                  className="w-full bg-zinc-900/50 border border-zinc-800 p-3 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  disabled={isBuilding}
                />
              </div>
              <button
                onClick={handleBuild}
                disabled={isBuilding || !idea}
                className={`w-full md:w-auto md:absolute ${lang === 'ar' ? 'left-4' : 'right-4'} top-1/2 md:-translate-y-1/2 bg-orange-500 text-black px-8 py-4 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-orange-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isBuilding ? <Loader2 className="animate-spin" /> : <Rocket className="w-5 h-5" />}
                {isBuilding ? t.manufacturing : t.launch}
              </button>
            </div>
            {errorMessage && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* New Features Quick Actions */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => {
                  setActiveSettingsTab('content');
                  setIsSettingsOpen(true);
                }}
                className="flex flex-col items-start p-6 bg-zinc-900/50 border border-orange-500/30 hover:bg-orange-500/10 rounded-2xl transition-all group text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg">{lang === 'ar' ? 'مختبر المحتوى' : 'Content Lab'}</h3>
                  <span className="px-2 py-0.5 bg-orange-500 text-black text-[10px] font-black rounded-full animate-pulse">NEW</span>
                </div>
                <p className="text-sm text-zinc-400">
                  {lang === 'ar' ? 'قم بتوليد محتوى تسويقي، مقالات، ومنشورات مخصصة لعلامتك التجارية.' : 'Generate marketing content, articles, and posts tailored to your brand.'}
                </p>
              </button>

              <button 
                onClick={() => {
                  setActiveSettingsTab('models');
                  setIsSettingsOpen(true);
                }}
                className="flex flex-col items-start p-6 bg-zinc-900/50 border border-blue-500/30 hover:bg-blue-500/10 rounded-2xl transition-all group text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500">
                    <Database className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg">{lang === 'ar' ? 'النماذج العالمية' : 'Universal Models'}</h3>
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-black rounded-full">NEW</span>
                </div>
                <p className="text-sm text-zinc-400">
                  {lang === 'ar' ? 'اربط أي نموذج ذكاء اصطناعي في العالم عبر API واستخدمه في مشاريعك.' : 'Link any AI model globally via API and use it in your projects.'}
                </p>
              </button>

              <button 
                onClick={() => {
                  setActiveSettingsTab('tools');
                  setIsSettingsOpen(true);
                }}
                className="flex flex-col items-start p-6 bg-zinc-900/50 border border-green-500/30 hover:bg-green-500/10 rounded-2xl transition-all group text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-500/20 rounded-lg text-green-500">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg">{lang === 'ar' ? 'أدوات ذكية' : 'Smart Tools'}</h3>
                  <span className="px-2 py-0.5 bg-green-500 text-white text-[10px] font-black rounded-full">NEW</span>
                </div>
                <p className="text-sm text-zinc-400">
                  {lang === 'ar' ? 'استخدم أدوات تحسين الـ SEO، تنسيق الأكواد، وفحص الأمان المتقدمة.' : 'Use advanced SEO optimization, code formatting, and security checking tools.'}
                </p>
              </button>

              <button 
                onClick={() => {
                  setActiveSettingsTab('database');
                  setIsSettingsOpen(true);
                }}
                className="flex flex-col items-start p-6 bg-zinc-900/50 border border-orange-500/30 hover:bg-orange-500/10 rounded-2xl transition-all group text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg text-orange-500">
                    <Database className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg">{lang === 'ar' ? 'مستكشف البيانات' : 'Database Explorer'}</h3>
                  <span className="px-2 py-0.5 bg-orange-500 text-black text-[10px] font-black rounded-full animate-pulse">NEW</span>
                </div>
                <p className="text-sm text-zinc-400">
                  {lang === 'ar' ? 'استكشف جداول قاعدة البيانات وهيكل البيانات في Supabase.' : 'Explore database tables and data structure in Supabase.'}
                </p>
              </button>

              <button 
                onClick={() => {
                  if (strategy) {
                    handleCollaborate();
                  } else {
                    toast.info(lang === 'ar' ? 'قم بإنشاء مشروع أولاً لبدء التعاون' : 'Create a project first to start collaboration');
                  }
                }}
                className="flex flex-col items-start p-6 bg-zinc-900/50 border border-purple-500/30 hover:bg-purple-500/10 rounded-2xl transition-all group text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform" />
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg text-purple-500">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg">{lang === 'ar' ? 'تعاون الوكلاء' : 'Agent Collaboration'}</h3>
                  <span className="px-2 py-0.5 bg-purple-500 text-white text-[10px] font-black rounded-full">NEW</span>
                </div>
                <p className="text-sm text-zinc-400">
                  {lang === 'ar' ? 'دع وكلاء الذكاء الاصطناعي يتناقشون ويراجعون ويحسنون مشروعك معاً.' : 'Let AI agents discuss, review, and improve your project together.'}
                </p>
              </button>
            </div>
          </section>
  
          {/* Agents Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-16 md:mb-20">
            {steps.map((step) => {
              const status = agents[step.id as keyof typeof agents];
              return (
                <div 
                  key={step.id}
                  className={cn(
                    "p-4 md:p-6 border border-zinc-800 rounded-2xl transition-all duration-500",
                    status === "working" && "border-orange-500 bg-orange-500/5 shadow-[0_0_30px_rgba(249,115,22,0.1)]",
                    status === "completed" && "border-green-500/30 bg-green-500/5",
                    status === "error" && "border-red-500/30 bg-red-500/5"
                  )}
                >
                  <div className="flex justify-between items-start mb-3 md:mb-4">
                    <div className={cn(
                      "p-2 md:p-3 rounded-xl",
                      status === "working" ? "bg-orange-500 text-black" : "bg-zinc-900 text-zinc-400"
                    )}>
                      <step.icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    {status === "completed" && <CheckCircle2 className="text-green-500 w-4 h-4 md:w-5 md:h-5" />}
                    {status === "working" && <Loader2 className="text-orange-500 w-4 h-4 md:w-5 md:h-5 animate-spin" />}
                  </div>
                  <h3 className="font-bold text-sm md:text-lg mb-1">{step.name}</h3>
                  <p className="text-xs md:text-sm text-zinc-500">{step.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Recent Projects Table */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8 mb-16 md:mb-20">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                  <Database className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {lang === 'ar' ? 'المشاريع الأخيرة' : 'Recent Projects'}
                  </h3>
                  <p className="text-sm text-zinc-500">
                    {lang === 'ar' ? 'تتبع وإدارة أحدث إبداعاتك.' : 'Track and manage your latest creations.'}
                  </p>
                </div>
              </div>
              <button className="text-xs font-mono text-orange-500 hover:text-orange-400 transition-colors uppercase tracking-widest">
                {lang === 'ar' ? 'عرض الكل' : 'View All'}
              </button>
            </div>
            <RecentProjects lang={lang} />
          </div>

          {/* Results Section */}
          <AnimatePresence>
            {strategy && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Brand Identity Card */}
                <div className="space-y-8">
                  <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <TrendingUp className="w-64 h-64" />
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
                      {logoUrl ? (
                        <img 
                          src={logoUrl} 
                          alt="Brand Logo" 
                          className="w-48 h-48 rounded-2xl object-cover border border-zinc-700 shadow-2xl"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-48 h-48 bg-zinc-800 rounded-2xl animate-pulse flex items-center justify-center">
                          <Palette className="w-12 h-12 text-zinc-600" />
                        </div>
                      )}
                      
                      <div className="flex-1 text-center md:text-left">
                        <h2 className="text-5xl font-black tracking-tight mb-2 uppercase">{strategy.name}</h2>
                        <p className="text-2xl text-orange-500 font-serif italic mb-6">{strategy.slogan}</p>
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-4">
                          <span className="px-4 py-1 bg-zinc-800 rounded-full text-xs font-mono uppercase tracking-widest">Target: {strategy.targetAudience}</span>
                          {deployed && <span className="px-4 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-mono uppercase tracking-widest flex items-center gap-1"><Globe className="w-3 h-3" /> Live on Supabase</span>}
                        </div>
  
                        {/* Detected Features */}
                        {appStructure?.features && (
                          <div className="mt-6 flex flex-wrap gap-2 justify-center md:justify-start">
                            {appStructure.features.map((feature: string) => (
                              <span key={feature} className="px-3 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-500 rounded-lg text-[10px] font-mono uppercase">
                                {feature}
                              </span>
                            ))}
                          </div>
                        )}
  
                        <div className="flex flex-wrap gap-3 mt-8 justify-center md:justify-start">
                          {generatedHtml && (
                            <button 
                              onClick={handlePreviewUI}
                              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-sm font-bold flex items-center gap-2 transition-colors"
                            >
                              <Eye className="w-4 h-4" /> {t.preview}
                            </button>
                          )}
                          <button 
                            onClick={handleCollaborate}
                            className="px-6 py-2 bg-orange-500 hover:bg-orange-400 text-black rounded-full text-sm font-bold flex items-center gap-2 transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" /> {lang === 'ar' ? 'تعاون الوكلاء' : 'Agent Collaboration'}
                          </button>
                          <button 
                            onClick={handleDownload}
                            className="px-6 py-2 border border-zinc-700 hover:bg-zinc-800 text-white rounded-full text-sm font-bold flex items-center gap-2 transition-colors"
                          >
                            <Download className="w-4 h-4" /> {t.download}
                          </button>
                          <button 
                            onClick={handleShare}
                            className="px-6 py-2 border border-zinc-700 hover:bg-zinc-800 text-white rounded-full text-sm font-bold flex items-center gap-2 transition-colors"
                          >
                            <Share2 className="w-4 h-4" /> {lang === 'ar' ? 'مشاركة' : 'Share'}
                          </button>
                        </div>
                        
                        {assignedAgents && (
                          <div className="mt-6 p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700">
                            <h5 className="text-[10px] font-mono uppercase tracking-widest text-orange-500 mb-2">{t.agents}</h5>
                            <div className="flex gap-4 text-xs">
                              <div className="flex items-center gap-2">
                                <Cpu className="w-3 h-3 text-purple-400" />
                                <span className="text-zinc-400">Logic:</span>
                                <span className="font-bold">{assignedAgents.logic?.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Palette className="w-3 h-3 text-pink-400" />
                                <span className="text-zinc-400">Vision:</span>
                                <span className="font-bold">{assignedAgents.vision?.name}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Marketing Steps */}
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8">
                      <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> {t.roadmap}
                      </h4>
                      <div className="space-y-6">
                        {(strategy.marketingSteps || []).map((step: string, i: number) => (
                          <div key={i} className="flex gap-4">
                            <span className="text-orange-500 font-mono font-bold">0{i + 1}</span>
                            <p className="text-zinc-300 leading-relaxed text-sm">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
  
                    {/* Brand Essence & Voice */}
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8">
                      <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> {t.essence}
                      </h4>
                      <div className="space-y-6">
                        <div>
                          <span className="text-[10px] text-zinc-500 uppercase font-mono mb-2 block">{t.voice}</span>
                          <p className="text-orange-500 font-bold italic">{strategy.brandVoice || "Visionary & Bold"}</p>
                        </div>
                        <div className="pt-4 border-t border-zinc-800">
                          <span className="text-[10px] text-zinc-500 uppercase font-mono mb-2 block">{t.manifesto}</span>
                          <p className="text-zinc-300 italic leading-relaxed whitespace-pre-line">
                            "{strategy.poetry || "Innovation in every step, \nVision in every breath."}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
  
                  {/* Alternative Strategies & Questions */}
                  {(strategy.alternativeStrategies?.length > 0 || strategy.clarifyingQuestions?.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                      {strategy.alternativeStrategies && strategy.alternativeStrategies.length > 0 && (
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8">
                          <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                            <Layers className="w-4 h-4" /> {lang === 'ar' ? 'استراتيجيات بديلة' : 'Alternative Strategies'}
                          </h4>
                          <div className="space-y-4">
                            {strategy.alternativeStrategies.map((alt: any, i: number) => (
                              <div key={i} className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                                <h5 className="font-bold text-orange-500 mb-1">{alt.name}</h5>
                                <p className="text-xs text-zinc-400 leading-relaxed">{alt.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
  
                      {strategy.clarifyingQuestions && strategy.clarifyingQuestions.length > 0 && (
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8">
                          <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" /> {lang === 'ar' ? 'أسئلة توضيحية' : 'Clarifying Questions'}
                          </h4>
                          <div className="space-y-3">
                            {strategy.clarifyingQuestions.map((q: string, i: number) => (
                              <div key={i} className="flex gap-3 items-start">
                                <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">?</div>
                                <p className="text-sm text-zinc-300">{q}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
  
                  {/* Market Sentiment (Full Width) */}
                  <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl p-8">
                    <h4 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> {t.sentiment}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {(sentiment?.labels || []).map((label: string, i: number) => (
                        <div key={label} className="space-y-2">
                          <div className="flex justify-between text-[10px] uppercase tracking-widest">
                            <span>{label}</span>
                            <span className="text-orange-500">{Math.round((sentiment?.scores?.[i] || 0) * 100)}%</span>
                          </div>
                          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${(sentiment?.scores?.[i] || 0) * 100}%` }}
                              className="h-full bg-orange-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
  
                {/* Chat Bot - Desktop Floating / Mobile Drawer */}
                {strategy && (
                  <>
                    {isMobile ? (
                      <Drawer.Root>
                        <Drawer.Trigger asChild>
                          <button className="fixed bottom-6 right-6 p-4 bg-orange-500 rounded-full shadow-2xl shadow-orange-500/50 hover:scale-110 transition-transform z-40">
                            <Bot className="w-6 h-6 text-black" />
                          </button>
                        </Drawer.Trigger>
                        <Drawer.Portal>
                          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
                          <Drawer.Content className="bg-zinc-900 flex flex-col rounded-t-[32px] h-[85%] mt-24 fixed bottom-0 left-0 right-0 z-50 border-t border-white/10">
                            <Drawer.Title className="sr-only">Agent Support</Drawer.Title>
                            <div className="p-6 bg-zinc-900 rounded-t-[32px] flex-1 flex flex-col">
                              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-800 mb-8" />
                              <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
                                <div className="flex items-center gap-3 mb-6">
                                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                                    <Bot className="w-6 h-6 text-black" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-white">{t.support}</h3>
                                    <p className="text-[10px] text-orange-500 font-mono uppercase tracking-widest">{t.online}</p>
                                  </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
                                  {chatMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                                        msg.role === 'user' ? 'bg-orange-500 text-black font-medium' : 'bg-zinc-800 text-zinc-300 border border-white/5'
                                      }`}>
                                        {msg.content}
                                      </div>
                                    </div>
                                  ))}
                                  {isChatting && (
                                    <div className="bg-zinc-800 p-4 rounded-2xl rounded-tl-none max-w-[85%]">
                                      <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                                    </div>
                                  )}
                                </div>
  
                                <form onSubmit={handleChat} className="relative pb-8">
                                  <input 
                                    type="text" 
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder={t.chatPlaceholder}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl p-4 pr-12 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                                  />
                                  <button 
                                    type="submit"
                                    disabled={isChatting || !chatInput.trim()}
                                    className={`absolute ${lang === 'ar' ? 'left-3' : 'right-3'} top-4 text-zinc-500 hover:text-orange-500 disabled:opacity-50`}
                                  >
                                    {isChatting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                  </button>
                                </form>
                              </div>
                            </div>
                          </Drawer.Content>
                        </Drawer.Portal>
                      </Drawer.Root>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="fixed bottom-8 right-8 w-96 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-40 overflow-hidden flex flex-col max-h-[600px]"
                      >
                        <div className="p-4 border-b border-white/10 bg-orange-500/10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center">
                              <Bot className="w-6 h-6 text-black" />
                            </div>
                            <div>
                              <h3 className="font-bold text-white text-sm">{t.support}</h3>
                              <p className="text-[10px] text-orange-500 font-medium uppercase tracking-wider">{t.online}</p>
                            </div>
                          </div>
                        </div>
  
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] custom-scrollbar">
                          {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                                msg.role === 'user' ? 'bg-orange-500 text-black font-medium' : 'bg-white/5 text-white/90 border border-white/10'
                              }`}>
                                {msg.content}
                              </div>
                            </div>
                          ))}
                          {isChatting && (
                            <div className="bg-zinc-800/50 p-4 rounded-2xl rounded-tl-none max-w-[80%]">
                              <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                            </div>
                          )}
                        </div>
  
                        <div className="p-4 border-t border-white/10 bg-black/20">
                          <form onSubmit={handleChat} className="flex gap-2">
                            <input 
                              type="text" 
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              placeholder={t.chatPlaceholder}
                              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                            />
                            <button 
                              type="submit"
                              disabled={isChatting || !chatInput.trim()}
                              className="p-2 bg-orange-500 text-black rounded-xl disabled:opacity-50"
                            >
                              {isChatting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                          </form>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
  
          {/* Footer */}
          <footer className="mt-32 pt-12 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6 opacity-30 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-mono uppercase">{t.footer}</span>
            </div>
            <div className="flex gap-8 text-xs font-mono uppercase">
              <a href="#" className="hover:text-orange-500 transition-colors">Documentation</a>
              <a href="#" className="hover:text-orange-500 transition-colors">API Status</a>
              <a href="#" className="hover:text-orange-500 transition-colors">Privacy</a>
            </div>
          </footer>
        </main>
  
        {/* Side Settings Panel */}
        <AnimatePresence>
          {isSettingsOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSettingsOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ x: lang === 'ar' ? '-100%' : '100%' }}
                animate={{ x: 0 }}
                exit={{ x: lang === 'ar' ? '-100%' : '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className={`fixed top-0 bottom-0 ${lang === 'ar' ? 'left-0' : 'right-0'} w-full md:w-[450px] bg-zinc-950 border-${lang === 'ar' ? 'r' : 'l'} border-white/10 z-50 flex flex-col shadow-2xl`}
              >
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-zinc-900/50">
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-orange-500" />
                    <h2 className="font-bold text-lg">{lang === 'ar' ? 'إعدادات المنصة والذكاء' : 'Platform & AI Settings'}</h2>
                  </div>
                  <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
  
                <div className="flex flex-wrap border-b border-white/10 bg-zinc-900/50 sticky top-0 z-10">
                  <button 
                    onClick={() => setActiveSettingsTab('agents')}
                    className={`flex-1 min-w-[25%] md:min-w-[20%] py-3 text-[10px] md:text-xs font-medium border-b-2 transition-colors ${activeSettingsTab === 'agents' ? 'border-orange-500 text-orange-500' : 'border-transparent text-zinc-400 hover:text-white'}`}
                  >
                    <Bot className="w-3 h-3 md:w-4 md:h-4 mx-auto mb-1" />
                    {lang === 'ar' ? 'الوكلاء' : 'Agents'}
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('templates')}
                    className={`flex-1 min-w-[25%] md:min-w-[20%] py-3 text-[10px] md:text-xs font-medium border-b-2 transition-colors ${activeSettingsTab === 'templates' ? 'border-orange-500 text-orange-500' : 'border-transparent text-zinc-400 hover:text-white'}`}
                  >
                    <Layout className="w-3 h-3 md:w-4 md:h-4 mx-auto mb-1" />
                    {lang === 'ar' ? 'القوالب' : 'Templates'}
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('libraries')}
                    className={`flex-1 min-w-[25%] md:min-w-[20%] py-3 text-[10px] md:text-xs font-medium border-b-2 transition-colors ${activeSettingsTab === 'libraries' ? 'border-orange-500 text-orange-500' : 'border-transparent text-zinc-400 hover:text-white'}`}
                  >
                    <Component className="w-3 h-3 md:w-4 md:h-4 mx-auto mb-1" />
                    {lang === 'ar' ? 'المكتبات' : 'Libraries'}
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('code')}
                    className={`flex-1 min-w-[25%] md:min-w-[20%] py-3 text-[10px] md:text-xs font-medium border-b-2 transition-colors ${activeSettingsTab === 'code' ? 'border-orange-500 text-orange-500' : 'border-transparent text-zinc-400 hover:text-white'}`}
                  >
                    <Code className="w-3 h-3 md:w-4 md:h-4 mx-auto mb-1" />
                    {lang === 'ar' ? 'محرر الأكواد' : 'Code Editor'}
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('capabilities')}
                    className={`flex-1 min-w-[25%] md:min-w-[20%] py-3 text-[10px] md:text-xs font-medium border-b-2 transition-colors ${activeSettingsTab === 'capabilities' ? 'border-orange-500 text-orange-500' : 'border-transparent text-zinc-400 hover:text-white'}`}
                  >
                    <ShieldCheck className="w-3 h-3 md:w-4 md:h-4 mx-auto mb-1" />
                    {lang === 'ar' ? 'الصلاحيات' : 'Capabilities'}
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('content')}
                    className={`flex-1 min-w-[25%] md:min-w-[20%] py-3 text-[10px] md:text-xs font-medium border-b-2 transition-colors relative ${activeSettingsTab === 'content' ? 'border-orange-500 text-orange-500' : 'border-transparent text-zinc-400 hover:text-white'}`}
                  >
                    <Sparkles className="w-3 h-3 md:w-4 md:h-4 mx-auto mb-1" />
                    {lang === 'ar' ? 'مختبر المحتوى' : 'Content Lab'}
                    <span className="absolute top-1 right-1 px-1 bg-orange-500 text-[7px] text-black font-bold rounded">NEW</span>
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('tools')}
                    className={`flex-1 min-w-[25%] md:min-w-[20%] py-3 text-[10px] md:text-xs font-medium border-b-2 transition-colors relative ${activeSettingsTab === 'tools' ? 'border-orange-500 text-orange-500' : 'border-transparent text-zinc-400 hover:text-white'}`}
                  >
                    <Wrench className="w-3 h-3 md:w-4 md:h-4 mx-auto mb-1" />
                    {lang === 'ar' ? 'أدوات ذكية' : 'Smart Tools'}
                    <span className="absolute top-1 right-1 px-1 bg-green-500 text-[7px] text-white font-bold rounded">NEW</span>
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('upload')}
                    className={`flex-1 min-w-[25%] md:min-w-[20%] py-3 text-[10px] md:text-xs font-medium border-b-2 transition-colors ${activeSettingsTab === 'upload' ? 'border-orange-500 text-orange-500' : 'border-transparent text-zinc-400 hover:text-white'}`}
                  >
                    <UploadCloud className="w-3 h-3 md:w-4 md:h-4 mx-auto mb-1" />
                    {lang === 'ar' ? 'رفع مشروع' : 'Upload'}
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('models')}
                    className={`flex-1 min-w-[25%] md:min-w-[20%] py-3 text-[10px] md:text-xs font-medium border-b-2 transition-colors relative ${activeSettingsTab === 'models' ? 'border-orange-500 text-orange-500' : 'border-transparent text-zinc-400 hover:text-white'}`}
                  >
                    <Database className="w-3 h-3 md:w-4 md:h-4 mx-auto mb-1" />
                    {lang === 'ar' ? 'النماذج العالمية' : 'Universal Models'}
                    <span className="absolute top-1 right-1 px-1 bg-blue-500 text-[7px] text-white font-bold rounded">NEW</span>
                  </button>
                  <button 
                    onClick={() => setActiveSettingsTab('database')}
                    className={`flex-1 min-w-[25%] md:min-w-[20%] py-3 text-[10px] md:text-xs font-medium border-b-2 transition-colors relative ${activeSettingsTab === 'database' ? 'border-orange-500 text-orange-500' : 'border-transparent text-zinc-400 hover:text-white'}`}
                  >
                    <Database className="w-3 h-3 md:w-4 md:h-4 mx-auto mb-1" />
                    {lang === 'ar' ? 'قاعدة البيانات' : 'Database Explorer'}
                    <span className="absolute top-1 right-1 px-1 bg-orange-500 text-[7px] text-black font-bold rounded">NEW</span>
                  </button>
                </div>
  
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  {activeSettingsTab === 'agents' && (
                    <div className="space-y-6">
                      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6">
                        <h3 className="text-orange-500 font-bold mb-2 flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          {lang === 'ar' ? 'تحديث قاعدة البيانات' : 'Update Database'}
                        </h3>
                        <p className="text-sm text-zinc-400 mb-4">
                          {lang === 'ar' ? 'مزامنة وكلاء الذكاء الاصطناعي الجدد (المحتوى، SEO، تحليل السوق) مع قاعدة بيانات Supabase.' : 'Sync new AI agents (Content, SEO, Market Analysis) with Supabase database.'}
                        </p>
                        <button 
                          onClick={async () => {
                            try {
                              await brandApi.updateModels();
                              toast.success(lang === 'ar' ? 'تم تحديث النماذج بنجاح' : 'Models updated successfully');
                            } catch (e) {
                              toast.error(lang === 'ar' ? 'فشل التحديث' : 'Update failed');
                            }
                          }}
                          className="w-full py-2 bg-orange-500 text-black font-bold rounded-lg hover:bg-orange-400 transition-colors text-sm"
                        >
                          {lang === 'ar' ? 'مزامنة النماذج' : 'Sync Models'}
                        </button>
                      </div>
  
                      <div className="space-y-4">
                        <h4 className="font-bold text-zinc-300">{lang === 'ar' ? 'الوكلاء النشطين' : 'Active Agents'}</h4>
                        {[
                          { name: "Content Generator", type: "Content", icon: <Bot className="w-4 h-4 text-blue-400" /> },
                          { name: "SEO Optimizer", type: "SEO", icon: <TrendingUp className="w-4 h-4 text-green-400" /> },
                          { name: "Market Analyst", type: "Market", icon: <Globe className="w-4 h-4 text-purple-400" /> },
                          { name: "Logic Alpha", type: "General", icon: <Cpu className="w-4 h-4 text-orange-400" /> },
                          { name: "Vision Beta", type: "Vision", icon: <Eye className="w-4 h-4 text-pink-400" /> },
                        ].map((agent, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-zinc-800 rounded-md">{agent.icon}</div>
                              <div>
                                <p className="font-medium text-sm">{agent.name}</p>
                                <p className="text-xs text-zinc-500">{agent.type}</p>
                              </div>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
  
                  {activeSettingsTab === 'templates' && (
                    <div className="space-y-6">
                      <p className="text-sm text-zinc-400">
                        {lang === 'ar' 
                          ? 'مجموعة القوالب الجاهزة التي يستخدمها الذكاء الاصطناعي لبناء المنصات.' 
                          : 'Pre-built templates used by AI to construct platforms.'}
                      </p>
                      
                      {[
                        { title: lang === 'ar' ? 'قوالب لوحات التحكم' : 'Admin & Dashboard', items: ['Sidebar Navigation', 'Stats Cards (KPIs)', 'Data Tables (CRUD)', 'Analytics Charts'] },
                        { title: lang === 'ar' ? 'قوالب الصفحات الرئيسية' : 'Landing Page Patterns', items: ['Hero Section', 'Feature Grid', 'Pricing Tables', 'Testimonials Slider'] },
                        { title: lang === 'ar' ? 'التجارة الإلكترونية' : 'E-commerce Patterns', items: ['Product Grid', 'Filter Sidebar', 'Shopping Cart Drawer', 'Checkout Stepper'] },
                        { title: lang === 'ar' ? 'قوالب الذكاء الاصطناعي' : 'AI & Communication', items: ['Chat Interface', 'Prompt Input Area', 'Model Playground', 'Typewriter Effect'] },
                      ].map((category, i) => (
                        <div key={i} className="mb-4">
                          <h4 className="font-bold text-zinc-300 mb-3 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-orange-500" />
                            {category.title}
                          </h4>
                          <div className="grid grid-cols-1 gap-2">
                            {category.items.map((item, j) => (
                              <div key={j} className="text-xs p-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 flex items-center gap-2">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                {item}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
  
                  {activeSettingsTab === 'libraries' && (
                    <div className="space-y-6">
                      <p className="text-sm text-zinc-400">
                        {lang === 'ar' 
                          ? 'المكتبات المدعومة والمدمجة في النظام.' 
                          : 'Supported and integrated libraries in the system.'}
                      </p>
  
                      <div className="space-y-4">
                        {[
                          { name: "Shadcn/ui", desc: lang === 'ar' ? 'مكونات حديثة قابلة للتخصيص' : 'Modern customizable components', badge: 'Tailwind' },
                          { name: "Radix UI", desc: lang === 'ar' ? 'مكونات أساسية بدون تصميم' : 'Unstyled primitive components', badge: 'Core' },
                          { name: "Vercel AI SDK", desc: lang === 'ar' ? 'واجهات الذكاء الاصطناعي المتدفقة' : 'Streaming AI interfaces', badge: 'AI' },
                          { name: "Lucide React", desc: lang === 'ar' ? 'أيقونات متناسقة وجميلة' : 'Consistent & beautiful icons', badge: 'Icons' },
                          { name: "Framer Motion", desc: lang === 'ar' ? 'حركات وتفاعلات سلسة' : 'Smooth animations & interactions', badge: 'Animation' },
                        ].map((lib, i) => (
                          <div key={i} className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                            <div className="flex justify-between items-start mb-1">
                              <h4 className="font-bold text-sm text-white">{lib.name}</h4>
                              <span className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-full">{lib.badge}</span>
                            </div>
                            <p className="text-xs text-zinc-500">{lib.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
  
                  {activeSettingsTab === 'code' && (
                    <div className="space-y-6 flex flex-col h-full">
                      <p className="text-sm text-zinc-400">
                        {lang === 'ar' 
                          ? 'محرر الأكواد المدمج لتصحيح الأخطاء وتحليلها باستخدام الذكاء الاصطناعي.' 
                          : 'Integrated code editor for debugging and analysis using AI.'}
                      </p>
                      <div className="flex-1 flex flex-col gap-4">
                        <textarea 
                          className="flex-1 w-full min-h-[300px] bg-zinc-900 border border-zinc-800 rounded-lg p-4 font-mono text-sm text-zinc-300 focus:outline-none focus:border-orange-500 resize-none"
                          placeholder={lang === 'ar' ? 'اكتب أو الصق الكود هنا...' : 'Type or paste code here...'}
                          value={editorCode}
                          onChange={(e) => setEditorCode(e.target.value)}
                        />
                        <button 
                          onClick={async () => {
                            if (!editorCode.trim()) return;
                            setIsAnalyzingCode(true);
                            setEditorResult(null);
                            try {
                              const res = await brandApi.analyzeCode(editorCode);
                              setEditorResult(res.fixedCode);
                              toast.success(lang === 'ar' ? 'تم تحليل الكود بنجاح' : 'Code analyzed successfully');
                            } catch (error) {
                              setEditorResult(lang === 'ar' ? 'فشل تحليل الكود. حاول مرة أخرى.' : 'Failed to analyze code. Try again.');
                            } finally {
                              setIsAnalyzingCode(false);
                            }
                          }}
                          disabled={isAnalyzingCode || !editorCode.trim()}
                          className="w-full py-3 bg-orange-500 text-black font-bold rounded-lg hover:bg-orange-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isAnalyzingCode ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wrench className="w-5 h-5" />}
                          {lang === 'ar' ? 'تحليل وتصحيح الكود' : 'Analyze & Fix Code'}
                        </button>
                        {editorResult && (
                          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-y-auto max-h-64">
                            <h4 className="font-bold text-orange-500 mb-2">{lang === 'ar' ? 'النتيجة:' : 'Result:'}</h4>
                            <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">{editorResult}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {activeSettingsTab === 'capabilities' && (
                    <div className="space-y-6">
                      <p className="text-sm text-zinc-400">
                        {lang === 'ar' 
                          ? 'الصلاحيات والقدرات المتاحة للذكاء الاصطناعي لاستخدامها في المشاريع.' 
                          : 'Capabilities and permissions available for AI to use in projects.'}
                      </p>
  
                      {[
                        { 
                          title: lang === 'ar' ? 'الوسائط والتواصل' : 'Media & Communication', 
                          items: ['Camera', 'Microphone', 'Photos & Media', 'Contacts', 'Call Logs', 'Phone'] 
                        },
                        { 
                          title: lang === 'ar' ? 'الموقع والحركة' : 'Location & Motion', 
                          items: ['Location (GPS)', 'Physical Activity', 'Body Sensors', 'Bluetooth'] 
                        },
                        { 
                          title: lang === 'ar' ? 'التنبيهات والظهور' : 'Notifications & Display', 
                          items: ['Notifications', 'Display over other apps', 'Write System Settings', 'Notification Access'] 
                        },
                        { 
                          title: lang === 'ar' ? 'النظام والخصوصية' : 'System & Privacy', 
                          items: ['Storage / Files', 'Usage Data', 'Calendar', 'SMS', 'Biometrics'] 
                        },
                        { 
                          title: lang === 'ar' ? 'الحركة والتحريك' : 'Motion & Animation', 
                          items: ['Animation', 'Transitions', 'Interactive Animation', 'Physics-based Motion', '2D/3D Animation', 'Parallax Effect'] 
                        },
                        { 
                          title: lang === 'ar' ? 'الجرافيكس والرسومات' : 'Graphics & Visuals', 
                          items: ['Vector Graphics', 'UI/UX Elements', '3D Rendering', 'Canvas', 'Modeling', 'Lighting & Shadows'] 
                        },
                        { 
                          title: lang === 'ar' ? 'التأثيرات البصرية' : 'Visual Effects (VFX)', 
                          items: ['Filters', 'Particle Effects', 'Blur Effects', 'Overlay/Blending', 'Distortion', 'Bloom/Glow', 'Chroma Key'] 
                        },
                        { 
                          title: lang === 'ar' ? 'التعامل مع الوسائط' : 'Media Handling', 
                          items: ['Image Processing', 'Video Editing', 'Audio Processing', 'Content Generation'] 
                        },
                        { 
                          title: lang === 'ar' ? 'أدوات متقدمة' : 'Advanced Tools', 
                          items: ['Background Camera', 'Install Unknown Apps', 'Battery Optimization', 'Accessibility'] 
                        }
                      ].map((category, i) => (
                        <div key={i} className="mb-4">
                          <h4 className="font-bold text-zinc-300 mb-3 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-orange-500" />
                            {category.title}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {category.items.map((item, j) => (
                              <span key={j} className="text-[10px] px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
  
                  {activeSettingsTab === 'content' && (
                    <ContentLab lang={lang} brandStrategy={strategy} />
                  )}

                  {activeSettingsTab === 'tools' && (
                    <SmartTools lang={lang} />
                  )}

                  {activeSettingsTab === 'upload' && (
                    <div className="space-y-6 flex flex-col h-full">
                      <p className="text-sm text-zinc-400">
                        {lang === 'ar' 
                          ? 'رفع مشروعك الحالي ليقوم الذكاء الاصطناعي بتحليله والبناء عليه.' 
                          : 'Upload your existing project for AI to analyze and build upon.'}
                      </p>
                      <div className="flex-1 flex flex-col gap-4">
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileUpload} 
                          className="hidden" 
                          multiple 
                        />
                        <div 
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center transition-all cursor-pointer ${isDragging ? 'border-orange-500 bg-orange-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:border-orange-500/50'}`}
                        >
                          <UploadCloud className={`w-12 h-12 mb-4 transition-colors ${isDragging ? 'text-orange-500' : 'text-zinc-600'}`} />
                          <h3 className="text-zinc-300 font-bold mb-2">
                            {lang === 'ar' ? 'اسحب وأفلت ملفات المشروع هنا' : 'Drag & drop project files here'}
                          </h3>
                          <p className="text-xs text-zinc-500 mb-6">
                            {lang === 'ar' ? 'يدعم ملفات ZIP أو المجلدات' : 'Supports ZIP files or folders'}
                          </p>
                          <div className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors">
                            {lang === 'ar' ? 'تصفح الملفات' : 'Browse Files'}
                          </div>
                        </div>
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-bold text-orange-500 mb-1">
                                {lang === 'ar' ? 'تحليل ذكي للمشاريع' : 'Smart Project Analysis'}
                              </h4>
                              <p className="text-xs text-zinc-400 leading-relaxed">
                                {lang === 'ar' 
                                  ? 'سيقوم الذكاء الاصطناعي بقراءة هيكل المشروع، فهم المكاتب المستخدمة، وإضافة الميزات المطلوبة مع الحفاظ على الكود الأصلي.' 
                                  : 'AI will read the project structure, understand used libraries, and add requested features while preserving original code.'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSettingsTab === 'models' && (
                    <UniversalModels lang={lang} />
                  )}
                  {activeSettingsTab === 'database' && (
                    <DatabaseExplorer lang={lang} />
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PlatformLayout>
  );
};
