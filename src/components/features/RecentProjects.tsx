import React, { useEffect, useState } from 'react';
import { brandApi } from '../../api/brandApi';
import { Download, ExternalLink, Clock, FolderOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  project_name: string;
  details: any;
  created_at: string;
}

interface RecentProjectsProps {
  lang: 'ar' | 'en';
}

export const RecentProjects: React.FC<RecentProjectsProps> = ({ lang }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');

  useEffect(() => {
    fetchProjects();
    
    // Subscribe to real-time changes
    const subscription = brandApi.subscribeToDeployments(() => {
      fetchProjects();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProjects = async () => {
    try {
      const data = await brandApi.getRecentProjects();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const isOld = new Date().getTime() - new Date(project.created_at).getTime() > 7 * 24 * 60 * 60 * 1000;
    return activeTab === 'archive' ? isOld : !isOld;
  });

  const handleDownload = async (id: string, name: string) => {
    try {
      const response = await fetch(`/api/download-project/${id}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/\s+/g, '_').toLowerCase()}_project.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(lang === 'ar' ? 'بدأ التحميل...' : 'Download started...');
    } catch (error) {
      toast.error(lang === 'ar' ? 'فشل التحميل' : 'Download failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl">
        <FolderOpen className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
        <p className="text-zinc-500">
          {lang === 'ar' ? 'لا توجد مشاريع سابقة بعد' : 'No previous projects yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'active' ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          {lang === 'ar' ? 'المشاريع النشطة' : 'Active Projects'}
          {activeTab === 'active' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
        </button>
        <button
          onClick={() => setActiveTab('archive')}
          className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'archive' ? 'text-orange-500' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          {lang === 'ar' ? 'الأرشيف (قديمة)' : 'Archive (Older)'}
          {activeTab === 'archive' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
        </button>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl">
          <FolderOpen className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500">
            {activeTab === 'active' 
              ? (lang === 'ar' ? 'لا توجد مشاريع نشطة حالياً' : 'No active projects currently')
              : (lang === 'ar' ? 'الأرشيف فارغ' : 'Archive is empty')}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="py-4 px-4 text-xs font-mono uppercase text-zinc-500 font-medium">
                    {lang === 'ar' ? 'اسم المشروع' : 'Project Name'}
                  </th>
                  <th className="py-4 px-4 text-xs font-mono uppercase text-zinc-500 font-medium">
                    {lang === 'ar' ? 'الحالة' : 'Status'}
                  </th>
                  <th className="py-4 px-4 text-xs font-mono uppercase text-zinc-500 font-medium">
                    {lang === 'ar' ? 'التاريخ' : 'Date'}
                  </th>
                  <th className="py-4 px-4 text-xs font-mono uppercase text-zinc-500 font-medium text-right">
                    {lang === 'ar' ? 'الإجراءات' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="group hover:bg-zinc-900/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <FolderOpen className="w-4 h-4 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{project.project_name}</p>
                          <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">
                            {project.details?.description || (lang === 'ar' ? 'لا يوجد وصف' : 'No description')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-medium">
                        <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                        {lang === 'ar' ? 'مكتمل' : 'Completed'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Clock className="w-3 h-3" />
                        {new Date(project.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDownload(project.id, project.project_name)}
                          className="p-2 text-zinc-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                          title={lang === 'ar' ? 'تحميل' : 'Download'}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                          title={lang === 'ar' ? 'فتح' : 'Open'}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{project.project_name}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                        <Clock className="w-3 h-3" />
                        {new Date(project.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-[9px] font-bold uppercase tracking-wider">
                    {lang === 'ar' ? 'مكتمل' : 'Completed'}
                  </span>
                </div>
                
                <p className="text-xs text-zinc-400 line-clamp-2">
                  {project.details?.description || (lang === 'ar' ? 'لا يوجد وصف' : 'No description')}
                </p>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => handleDownload(project.id, project.project_name)}
                    className="flex-1 py-2.5 bg-orange-500/10 text-orange-500 border border-orange-500/20 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {lang === 'ar' ? 'تحميل' : 'Download'}
                  </button>
                  <button 
                    className="flex-1 py-2.5 bg-zinc-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {lang === 'ar' ? 'فتح' : 'Open'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
