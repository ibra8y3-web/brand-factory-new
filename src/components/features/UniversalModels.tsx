import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Zap, Plus, CheckCircle2, Loader2, RefreshCw, ShieldCheck, Layers, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { brandApi } from '../../api/brandApi';

interface UniversalModelsProps {
  lang: 'ar' | 'en';
}

export const UniversalModels: React.FC<UniversalModelsProps> = ({ lang }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [models, setModels] = useState<any[]>([]);
  const [bestModels, setBestModels] = useState<any[]>([]);
  const [modelName, setModelName] = useState('');
  const [provider, setProvider] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [tokenization, setTokenization] = useState('');
  const [agentType, setAgentType] = useState('general');
  const [apiKey, setApiKey] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const itemsPerPage = 20;

  const filteredModels = models.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
                          m.provider.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || 
                            m.agent_type.toLowerCase() === categoryFilter.toLowerCase() ||
                            m.category?.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const paginatedModels = filteredModels.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredModels.length / itemsPerPage);

  const fetchModels = async () => {
    try {
      const [modelsData, bestModelsData] = await Promise.all([
        brandApi.getModels(true), // Fetch ALL models including inactive
        brandApi.getBestModels()
      ]);
      console.log(`Fetched ${modelsData.length} models in frontend`);
      setModels(modelsData);
      setBestModels(bestModelsData);
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to fetch models");
    }
  };

  useEffect(() => {
    fetchModels();
    
    // Subscribe to real-time changes
    const subscription = brandApi.subscribeToModels(() => {
      fetchModels();
    });

    // Background sync on mount
    const backgroundSync = async () => {
      try {
        await brandApi.updateModels();
        // fetchModels will be called by the subscription if data changes
      } catch (error) {
        console.error("Background sync failed", error);
      }
    };
    backgroundSync();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleToggleModel = async (modelId: string, currentStatus: boolean) => {
    try {
      await brandApi.toggleModel(modelId, !currentStatus);
      toast.success(lang === 'ar' ? 'تم تحديث حالة النموذج' : 'Model status updated');
      fetchModels();
    } catch (error) {
      toast.error(lang === 'ar' ? 'فشل تحديث الحالة' : 'Failed to update status');
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await brandApi.updateModels(true);
      toast.success(res.message);
      fetchModels();
    } catch (error) {
      toast.error(lang === 'ar' ? 'فشل في مزامنة النماذج' : 'Failed to sync models');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleValidateKey = async () => {
    if (!apiKey || !provider) {
      toast.error(lang === 'ar' ? 'يرجى إدخال المفتاح واختيار المزود' : 'Please enter key and select provider');
      return;
    }
    setIsValidating(true);
    try {
      const { isValid } = await brandApi.validateKey(provider, apiKey);
      if (isValid) {
        toast.success(lang === 'ar' ? 'المفتاح صالح وفعال!' : 'Key is valid and active!');
      } else {
        toast.error(lang === 'ar' ? 'المفتاح غير صالح أو منتهي الصلاحية' : 'Key is invalid or expired');
      }
    } catch (error) {
      toast.error('Validation error');
    } finally {
      setIsValidating(false);
    }
  };

  const handleAddModel = async () => {
    if (!modelName || !provider || !apiUrl) {
      toast.error(lang === 'ar' ? 'يرجى تعبئة جميع الحقول' : 'Please fill all fields');
      return;
    }
    setIsAdding(true);
    try {
      await brandApi.addModel({
        name: modelName,
        provider,
        apiUrl,
        tokenization,
        agentType
      });
      toast.success(lang === 'ar' ? 'تمت إضافة النموذج بنجاح' : 'Model added successfully');
      setModelName('');
      setProvider('');
      setApiUrl('');
      setTokenization('');
      setAgentType('general');
      fetchModels();
    } catch (error: any) {
      toast.error(lang === 'ar' ? 'فشل في إضافة النموذج' : 'Failed to add model');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className={`space-y-6 ${lang === 'ar' ? 'rtl' : 'ltr'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-orange-500" />
            {lang === 'ar' ? 'المحرك الشامل (Universal AI Engine)' : 'Universal AI Engine'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            {lang === 'ar' 
              ? 'إدارة ومزامنة جميع نماذج الذكاء الاصطناعي العالمية ديناميكياً.' 
              : 'Dynamically manage and sync all universal AI models.'}
          </p>
        </div>

        {/* Army Readiness Dashboard */}
        <div className="bg-black border-2 border-orange-500/20 rounded-2xl p-6 military-frame relative overflow-hidden my-4 w-full">
          <div className="absolute top-0 right-0 p-1 bg-orange-500 text-black text-[8px] font-black uppercase tracking-tighter">Combat Ready</div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-orange-500 uppercase tracking-widest">{lang === 'ar' ? 'جاهزية جيش النماذج' : 'Model Army Readiness'}</span>
                <span className="text-xs font-mono text-zinc-400">{Math.round((models.filter(m => m.is_active).length / (models.length || 1)) * 100)}%</span>
              </div>
              <div className="h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700 p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(models.filter(m => m.is_active).length / (models.length || 1)) * 100}%` }}
                  className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                />
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter mb-1">{lang === 'ar' ? 'النماذج النشطة' : 'Active Units'}</div>
                <div className="text-2xl font-black text-white glow-orange">{models.filter(m => m.is_active).length}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter mb-1">{lang === 'ar' ? 'إجمالي الأسطول' : 'Total Fleet'}</div>
                <div className="text-2xl font-black text-zinc-600">{models.length}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter mb-1">{lang === 'ar' ? 'مزودي الخدمة' : 'Providers'}</div>
                <div className="text-2xl font-black text-blue-500">{new Set(models.map(m => m.provider)).size}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              toast.info(lang === 'ar' ? 'استخدم زر اللغة في القائمة الجانبية للتبديل' : 'Use the language button in the sidebar to switch');
            }}
            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-orange-500/10 hover:text-orange-500 transition-all"
            title={lang === 'ar' ? 'تبديل اللغة' : 'Switch Language'}
          >
            <Globe className="w-4 h-4" />
          </button>
          <button 
            onClick={async () => {
              const loading = toast.loading(lang === 'ar' ? 'جاري التبديل...' : 'Switching...');
              try {
                const data = await brandApi.getBestModels();
                setBestModels(data);
                toast.dismiss(loading);
                toast.success(lang === 'ar' ? 'تم تبديل النماذج بنجاح' : 'Models switched successfully');
              } catch (e) {
                toast.dismiss(loading);
              }
            }}
            className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-orange-500/10 hover:text-orange-500 transition-all"
            title={lang === 'ar' ? 'تبديل عشوائي' : 'Random Switch'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-lg hover:bg-orange-500 hover:text-black transition-all text-xs font-bold shadow-lg shadow-orange-500/5"
          >
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
            {lang === 'ar' ? 'مزامنة المحركات' : 'Sync Engines'}
          </button>
        </div>
      </div>

      {/* Core Intelligence Section */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
        <h4 className="text-xs font-mono uppercase text-zinc-500 mb-4 flex items-center gap-2">
          <Zap className="w-3 h-3 text-yellow-500" />
          {lang === 'ar' ? 'نواة الذكاء النشطة' : 'Active Intelligence Core'}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {bestModels.map((bm, i) => (
            <div key={i} className="p-3 bg-black/40 border border-zinc-800 rounded-xl flex flex-col gap-1">
              <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-tighter">{bm.type}</span>
              <span className="text-[10px] font-bold text-orange-400 truncate" title={bm.model?.name}>
                {bm.model?.name || '---'}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h4 className="text-xs font-mono uppercase text-orange-500 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" /> {lang === 'ar' ? 'التحقق من المفاتيح' : 'Key Validation'}
          </h4>
          <div className="space-y-3">
            <select 
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-400 focus:border-orange-500 outline-none"
            >
              <option value="">{lang === 'ar' ? 'اختر المزود' : 'Select Provider'}</option>
              <option value="Groq">Groq</option>
              <option value="OpenRouter">OpenRouter</option>
              <option value="Hugging Face">Hugging Face</option>
              <option value="Gemini">Gemini</option>
              <option value="CometAPI">CometAPI</option>
            </select>
            <div className="flex gap-2">
              <input 
                type="password" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={lang === 'ar' ? 'أدخل مفتاح الـ API للتحقق' : 'Enter API Key to validate'} 
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-white focus:border-orange-500 outline-none" 
              />
              <button 
                onClick={handleValidateKey}
                disabled={isValidating}
                className="px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold border border-zinc-700"
              >
                {isValidating ? <Loader2 className="w-3 h-3 animate-spin" /> : (lang === 'ar' ? 'تحقق' : 'Check')}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h4 className="text-xs font-mono uppercase text-orange-500 mb-4 flex items-center gap-2">
            <Zap className="w-3 h-3" /> {lang === 'ar' ? 'إضافة نموذج مخصص' : 'Add Custom Model'}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <input 
              type="text" 
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder={lang === 'ar' ? 'اسم النموذج' : 'Model Name'} 
              className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-white focus:border-orange-500 outline-none" 
            />
            <input 
              type="text" 
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder={lang === 'ar' ? 'المزود' : 'Provider'} 
              className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-white focus:border-orange-500 outline-none" 
            />
            <input 
              type="text" 
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder={lang === 'ar' ? 'رابط الـ API' : 'API URL'} 
              className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-white focus:border-orange-500 outline-none" 
            />
            <select 
              value={agentType}
              onChange={(e) => setAgentType(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-xs text-zinc-400 focus:border-orange-500 outline-none"
            >
              <option value="general">{lang === 'ar' ? 'عام' : 'General'}</option>
              <option value="coding">{lang === 'ar' ? 'برمجة' : 'Coding'}</option>
              <option value="vision">{lang === 'ar' ? 'رؤية' : 'Vision'}</option>
              <option value="market">{lang === 'ar' ? 'تسويق' : 'Market'}</option>
              <option value="voice">{lang === 'ar' ? 'صوت' : 'Voice'}</option>
              <option value="video">{lang === 'ar' ? 'فيديو' : 'Video'}</option>
              <option value="music">{lang === 'ar' ? 'موسيقى' : 'Music'}</option>
            </select>
          </div>
          <button 
            onClick={handleAddModel}
            disabled={isAdding}
            className="w-full py-2 mt-2 bg-orange-500/10 text-orange-500 border border-orange-500/30 hover:bg-orange-500 hover:text-black font-medium rounded-lg transition-colors text-xs flex items-center justify-center gap-2"
          >
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {lang === 'ar' ? 'ربط النموذج' : 'Link Model'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-mono uppercase text-zinc-500 flex items-center gap-2">
            <Layers className="w-3 h-3" />
            {lang === 'ar' ? 'مستودع النماذج الشامل' : 'Universal Model Repository'} 
            <span className="text-zinc-600">({models.filter(m => m.is_active).length} {lang === 'ar' ? 'نشط' : 'Active'} / {models.length} {lang === 'ar' ? 'إجمالي' : 'Total'})</span>
          </h4>
          <div className="flex items-center gap-2">
            <input 
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={lang === 'ar' ? 'بحث...' : 'Search...'}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-orange-500"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-400 focus:outline-none"
            >
              <option value="all">{lang === 'ar' ? 'كل التصنيفات' : 'All Categories'}</option>
              <option value="general">General</option>
              <option value="video">Video</option>
              <option value="voice">Voice</option>
              <option value="music">Music</option>
              <option value="vision">Vision</option>
              <option value="coder">Coder</option>
            </select>
            <span className="flex items-center gap-1 text-[10px] text-green-500">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              {lang === 'ar' ? 'نظام التبديل التلقائي نشط' : 'Auto-Switching Active'}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
          {paginatedModels.map((model, i) => (
            <div key={i} className={`p-4 rounded-2xl border transition-all relative overflow-hidden group ${
              model.is_active 
                ? 'bg-zinc-900 border-zinc-800 hover:border-orange-500/50' 
                : 'bg-zinc-900/30 border-zinc-800/50 opacity-60'
            }`}>
              {model.is_verified && (
                <div className="absolute top-0 right-0 p-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500/50" />
                </div>
              )}
              
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-xl ${
                  model.is_active ? 'bg-orange-500/10 text-orange-500' : 'bg-zinc-800 text-zinc-600'
                }`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="text-sm font-bold text-white truncate leading-tight" title={model.name}>
                    {model.name}
                  </h5>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[9px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-md border border-zinc-700 uppercase font-mono tracking-tighter">
                      {model.provider}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20 uppercase font-mono tracking-tighter">
                      {model.agent_type}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                <div className="flex items-center gap-2">
                  {bestModels.some(bm => bm.type === model.agent_type && bm.model?.name === model.name) && (
                    <span className="text-[9px] px-2 py-0.5 bg-orange-500 text-black rounded-md font-black uppercase tracking-tighter">
                      {lang === 'ar' ? 'أساسي' : 'CORE'}
                    </span>
                  )}
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tighter ${
                    model.is_active ? 'text-green-500 bg-green-500/10 border border-green-500/20' : 'text-zinc-500 bg-zinc-800 border border-zinc-700'
                  }`}>
                    {model.is_active ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'معطل' : 'Disabled')}
                  </span>
                </div>
                <button 
                  onClick={() => handleToggleModel(model.id, model.is_active)}
                  className="text-[10px] font-bold text-zinc-500 hover:text-orange-500 transition-colors uppercase tracking-widest"
                >
                  {model.is_active ? (lang === 'ar' ? 'تعطيل' : 'Disable') : (lang === 'ar' ? 'تفعيل' : 'Enable')}
                </button>
              </div>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded-lg text-xs hover:bg-zinc-700 disabled:opacity-50"
            >
              {lang === 'ar' ? 'السابق' : 'Prev'}
            </button>
            <span className="text-xs text-zinc-500">{currentPage} / {totalPages}</span>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded-lg text-xs hover:bg-zinc-700 disabled:opacity-50"
            >
              {lang === 'ar' ? 'التالي' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
