import React, { useState } from 'react';
import { FileText, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { brandApi } from '../../api/brandApi';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface ContentLabProps {
  lang: 'ar' | 'en';
  brandStrategy: any;
}

export const ContentLab: React.FC<ContentLabProps> = ({ lang, brandStrategy }) => {
  const [contentType, setContentType] = useState('blog');
  const [contentTopic, setContentTopic] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [availableModels, setAvailableModels] = useState<{ id: string, name: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');

  React.useEffect(() => {
    brandApi.getModels().then(models => {
      setAvailableModels(models);
      if (models.length > 0) setSelectedModel(models[0].name);
    }).catch(console.error);
  }, []);

  const handleGenerateAIContent = async () => {
    if (!contentTopic) {
      toast.error(lang === 'ar' ? 'يرجى إدخال موضوع المحتوى' : 'Please enter a content topic');
      return;
    }
    
    setIsGeneratingContent(true);
    try {
      const prompt = `Create a ${contentType} about "${contentTopic}". 
      ${brandStrategy ? `Use this brand strategy for context: ${JSON.stringify(brandStrategy)}` : ''}
      Ensure the tone matches the brand. Output in English. Format with Markdown.`;
      
      const response = await brandApi.executeUniversal({
        prompt,
        taskType: "content",
        modelName: selectedModel
      });
      setGeneratedContent(response.text);
      toast.success(lang === 'ar' ? 'تم توليد المحتوى بنجاح' : 'Content generated successfully');
    } catch (error) {
      console.error("Content generation failed:", error);
      toast.error(lang === 'ar' ? 'فشل توليد المحتوى' : 'Failed to generate content');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleCopy = () => {
    if (!generatedContent) return;
    navigator.clipboard.writeText(generatedContent);
    setIsCopied(true);
    toast.success(lang === 'ar' ? 'تم النسخ' : 'Copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6 relative">
        <div className="absolute top-4 right-4 rtl:left-4 rtl:right-auto">
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-transparent text-orange-500/50 hover:text-orange-500 text-xs p-1 outline-none cursor-pointer"
          >
            <option value="">{lang === 'ar' ? 'تلقائي' : 'Auto'}</option>
            {availableModels.map(model => (
              <option key={model.id} value={model.name}>{model.name}</option>
            ))}
          </select>
        </div>
        <h3 className="text-orange-500 font-bold mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          {lang === 'ar' ? 'مختبر المحتوى (Content Lab)' : 'Content Lab'}
        </h3>
        <p className="text-sm text-zinc-400 mt-2">
          {lang === 'ar' 
            ? 'قم بتوليد محتوى تسويقي، مقالات، ومنشورات تواصل اجتماعي متوافقة مع استراتيجية علامتك التجارية.' 
            : 'Generate marketing content, articles, and social media posts aligned with your brand strategy.'}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">
            {lang === 'ar' ? 'نوع المحتوى' : 'Content Type'}
          </label>
          <select 
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-orange-500 outline-none"
          >
            <option value="blog">{lang === 'ar' ? 'مقال مدونة (Blog Post)' : 'Blog Post'}</option>
            <option value="social">{lang === 'ar' ? 'منشور تواصل اجتماعي (Social Media)' : 'Social Media Post'}</option>
            <option value="ad">{lang === 'ar' ? 'نص إعلاني (Ad Copy)' : 'Ad Copy'}</option>
            <option value="email">{lang === 'ar' ? 'بريد إلكتروني (Email Newsletter)' : 'Email Newsletter'}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-2">
            {lang === 'ar' ? 'موضوع المحتوى' : 'Content Topic'}
          </label>
          <input 
            type="text" 
            value={contentTopic}
            onChange={(e) => setContentTopic(e.target.value)}
            placeholder={lang === 'ar' ? 'اكتب الفكرة أو الموضوع هنا...' : 'Write the idea or topic here...'}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-sm text-white focus:border-orange-500 outline-none"
          />
        </div>

        <button 
          onClick={handleGenerateAIContent}
          disabled={isGeneratingContent || !contentTopic}
          className="w-full py-3 bg-orange-500 text-black font-bold rounded-lg hover:bg-orange-400 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGeneratingContent ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
          {lang === 'ar' ? 'توليد المحتوى' : 'Generate Content'}
        </button>
      </div>

      {generatedContent && (
        <div className="mt-6 space-y-2 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-zinc-300 uppercase">{lang === 'ar' ? 'النتيجة' : 'Result'}</h4>
            <button 
              onClick={handleCopy}
              className="text-xs flex items-center gap-1 text-zinc-400 hover:text-white transition-colors"
            >
              {isCopied ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              {lang === 'ar' ? (isCopied ? 'تم النسخ' : 'نسخ') : (isCopied ? 'Copied' : 'Copy')}
            </button>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 max-h-[400px] overflow-y-auto custom-scrollbar prose prose-invert prose-sm max-w-none">
            <ReactMarkdown>{generatedContent}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};
