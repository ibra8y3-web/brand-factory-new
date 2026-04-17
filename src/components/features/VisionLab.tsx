import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, Send, Loader2, X, Sparkles } from 'lucide-react';
import { brandApi } from '../../api/brandApi';
import { toast } from 'sonner';

export const VisionLab = ({ lang }: { lang: 'ar' | 'en' }) => {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<{ id: string, name: string }[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    brandApi.getModels().then(models => {
      setAvailableModels(models);
      if (models.length > 0) setSelectedModel(models[0].id);
    }).catch(console.error);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(lang === 'ar' ? 'حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)' : 'Image size too large (Max 5MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) {
      toast.error(lang === 'ar' ? 'الرجاء رفع صورة أولاً' : 'Please upload an image first');
      return;
    }
    if (!prompt.trim()) {
      toast.error(lang === 'ar' ? 'الرجاء كتابة سؤال أو وصف' : 'Please enter a prompt');
      return;
    }

    setIsLoading(true);
    try {
      const res = await brandApi.executeUniversal({
        prompt,
        image,
        taskType: "vision",
        modelName: selectedModel
      });
      setResult(res.text);
      toast.success(lang === 'ar' ? `تم التحليل بواسطة: ${res.modelUsed}` : `Analysis complete by: ${res.modelUsed}`);
    } catch (error: any) {
      console.error('Vision analysis failed:', error);
      toast.error(lang === 'ar' ? 'فشل تحليل الصورة' : 'Failed to analyze image');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ImageIcon className="text-purple-400" />
            {lang === 'ar' ? 'مختبر الرؤية (Vision Lab)' : 'Vision Lab'}
          </h2>
          <p className="text-gray-400">
            {lang === 'ar' 
              ? 'ارفع صورة واسأل الذكاء الاصطناعي عنها، استخرج النصوص، أو حلل محتواها.' 
              : 'Upload an image and ask AI about it, extract text, or analyze its content.'}
          </p>
        </div>
        <select 
          value={selectedModel} 
          onChange={(e) => setSelectedModel(e.target.value)}
          className="bg-transparent text-white text-xs p-1 outline-none opacity-20 hover:opacity-100 cursor-pointer"
        >
          <option value="">{lang === 'ar' ? 'تلقائي' : 'Auto'}</option>
          {availableModels.map(model => (
            <option key={model.id} value={model.name}>{model.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${image ? 'border-purple-500/50 bg-purple-500/5' : 'border-zinc-700 hover:border-purple-500/30 hover:bg-white/5'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setImage(reader.result as string);
                reader.readAsDataURL(file);
              }
            }}
          >
            {image ? (
              <div className="relative inline-block">
                <img src={image} alt="Uploaded" className="max-h-64 rounded-lg shadow-lg" />
                <button 
                  onClick={() => { setImage(null); setResult(null); }}
                  className="absolute -top-3 -right-3 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <UploadCloud className="w-12 h-12 text-zinc-500 mb-4" />
                <p className="text-zinc-400 mb-4">
                  {lang === 'ar' ? 'اسحب وأفلت الصورة هنا أو' : 'Drag and drop an image here or'}
                </p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium"
                >
                  {lang === 'ar' ? 'اختر صورة' : 'Choose Image'}
                </button>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">
              {lang === 'ar' ? 'ماذا تريد أن تعرف عن الصورة؟' : 'What do you want to know about the image?'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={lang === 'ar' ? 'مثال: استخرج النص من هذه الصورة، أو اشرح ما بداخلها...' : 'e.g., Extract text from this image, or describe what is in it...'}
              className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 resize-none"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!image || !prompt.trim() || isLoading}
            className="w-full py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {lang === 'ar' ? 'جاري التحليل...' : 'Analyzing...'}
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                {lang === 'ar' ? 'تحليل الصورة' : 'Analyze Image'}
              </>
            )}
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-full min-h-[400px]">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            {lang === 'ar' ? 'النتيجة' : 'Result'}
          </h3>
          
          {result ? (
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-zinc-300 leading-relaxed">
                {result}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4 opacity-50">
              <ImageIcon className="w-16 h-16" />
              <p>{lang === 'ar' ? 'ستظهر نتيجة التحليل هنا' : 'Analysis result will appear here'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
