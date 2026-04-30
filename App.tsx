import React, { useState, useEffect, useRef, Suspense, lazy, useCallback } from 'react';
import { 
    checkBackendHealth, 
    getProjects, 
    createProject, 
    getProjectDetails, 
    uploadImages, 
    getImageUrls, 
    analyzeProjectImage, 
    restoreProjectImage,
    auditProjectImage, 
    exportProject,
    openProjectFolder,
    deleteProject,
    getSettings,
    saveSettings,
    deleteProjectImage
} from './services/geminiService';
import { AppStage, DamageAnalysis, Project, WorkspaceStage, LoadingStates } from './types';
import RestorationCanvas from './components/RestorationCanvas';
import ProjectCard from './components/ProjectCard';
import LoadingSpinner from './components/LoadingSpinner';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import StatsVisualizer from './components/StatsVisualizer';

const ComparisonView = lazy(() => import('./components/ComparisonView'));

import { PlusCircle, X, AlertCircle, CheckCircle, Settings as SettingsIcon, FolderOpen, Trash2, Key, Info, HardDrive, Image as ImageIcon, Activity, Terminal, Sparkles, Database } from 'lucide-react';

const ANALYSIS_MESSAGES = [
    "Engaging forensic sensor array...",
    "Sampling spectral substrate data...",
    "Correlating era-specific grain patterns...",
    "Mapping pixel pathology nodes...",
    "Researching historical context via Google...",
    "Constructing restoration heuristics...",
    "Validating diagnostic model..."
];

const RESTORATION_MESSAGES = [
    "Priming Gemini 3 compute cluster...",
    "Initializing Nano Banana 4K pipeline...",
    "Synthesizing lost photon vectors...",
    "Normalizing chemical emulsion layers...",
    "Applying ethical documentary constraints...",
    "Reconstructing latent spatial details...",
    "Rendering high-fidelity output..."
];

const App: React.FC = () => {
  const [appStage, setAppStage] = useState<AppStage>(AppStage.DASHBOARD);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false); 
  const [customProjectPath, setCustomProjectPath] = useState('');
  const [customLogoPath, setCustomLogoPath] = useState('');
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [workspaceStage, setWorkspaceStage] = useState<WorkspaceStage>(WorkspaceStage.IDLE);
  const [currentDisplayUrl, setCurrentDisplayUrl] = useState<string | null>(null); 
  const [currentAnalysedUrl, setCurrentAnalysedUrl] = useState<string | null>(null); 
  const [currentRestoredUrl, setCurrentRestoredUrl] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<DamageAnalysis | null>(null);
  const [analysisContext, setAnalysisContext] = useState('');
  const [restorationSource, setRestorationSource] = useState<'analysed' | 'restored'>('analysed');
  const [loadingState, setLoadingState] = useState<LoadingStates>({
      processing: false,
      uploading: false,
      analyzing: false,
      restoring: false
  });
  const [error, setError] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState<boolean>(true); 
  const [newClientName, setNewClientName] = useState('');
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessageIdx, setLoadingMessageIdx] = useState(0);
  const lastSelectedImageRef = useRef<string | null>(null);

  const setLoading = useCallback((key: keyof LoadingStates, val: boolean) => 
    setLoadingState(prev => ({...prev, [key]: val})), []);

  useEffect(() => {
    const init = async () => {
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setHasApiKey(hasKey);
        }
        const isConnected = await checkBackendHealth();
        setBackendConnected(isConnected);
        if (isConnected) loadProjects();
    };
    init();
  }, []);

  useEffect(() => {
    let progressInterval: any;
    let messageInterval: any;

    if (loadingState.analyzing || loadingState.restoring) {
        setLoadingProgress(0);
        setLoadingMessageIdx(0);
        progressInterval = setInterval(() => {
            setLoadingProgress(prev => {
                if (prev < 90) return prev + Math.random() * 1.5;
                if (prev < 98) return prev + 0.05;
                return prev;
            });
        }, 200);

        messageInterval = setInterval(() => {
            setLoadingMessageIdx(prev => prev + 1);
        }, 3500);
    } else {
        setLoadingProgress(0);
    }

    return () => {
        clearInterval(progressInterval);
        clearInterval(messageInterval);
    };
  }, [loadingState.analyzing, loadingState.restoring]);

  const handleSelectKey = useCallback(async () => {
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
          await window.aistudio.openSelectKey();
          setHasApiKey(true);
      }
  }, []);

  const loadProjects = useCallback(async () => {
      try {
          const list = await getProjects();
          setProjects(list);
      } catch (e) {
          console.error("Failed to load projects", e);
      }
  }, []);

  const selectImage = useCallback(async (project: Project, imageId: string) => {
      setActiveImageId(imageId);
      lastSelectedImageRef.current = imageId;
      setLoading('processing', true);
      setAnalysisContext(''); 
      setRestorationSource('analysed'); 
      const img = project.images.find(i => i.id === imageId);
      if (!img) return;
      try {
          const { originalUrl, analysedUrl, restoredUrl } = getImageUrls(project.id, imageId);
          if (lastSelectedImageRef.current !== imageId) return;
          if (img.analysedPath || img.status === 'analyzed' || img.status === 'completed') {
              setCurrentDisplayUrl(analysedUrl);
              setCurrentAnalysedUrl(analysedUrl);
          } else {
              setCurrentDisplayUrl(originalUrl);
              setCurrentAnalysedUrl(null);
          }
          setCurrentRestoredUrl((img.status === 'completed' || img.restoredPath) ? restoredUrl : null);
          setCurrentAnalysis(img.analysis || null);
          if (img.userContext) setAnalysisContext(img.userContext); 
          
          if (img.status === 'completed' && img.restoredPath) {
              setWorkspaceStage(WorkspaceStage.COMPARE);
          } else if (img.analysis) {
              setWorkspaceStage(WorkspaceStage.REVIEW_PLAN);
          } else {
              setWorkspaceStage(WorkspaceStage.IDLE);
          }
      } catch (e) {} finally {
          setLoading('processing', false);
      }
  }, [setLoading]);

  const openProject = useCallback(async (projectId: string) => {
      setLoading('processing', true);
      try {
          const project = await getProjectDetails(projectId);
          setActiveProject(project);
          setAppStage(AppStage.PROJECT_WORKSPACE);
          setWorkspaceStage(WorkspaceStage.IDLE);
          if (project.images.length > 0) {
              selectImage(project, project.images[0].id);
          } else {
              setActiveImageId(null);
              setCurrentDisplayUrl(null);
              setCurrentAnalysedUrl(null);
              setCurrentRestoredUrl(null);
          }
      } catch (e: any) {
          setError(e.message);
      } finally {
          setLoading('processing', false);
      }
  }, [selectImage, setLoading]);

  const handleCreateProject = useCallback(async () => {
      if (!newClientName || !newProjectTitle) return;
      setLoading('processing', true);
      try {
          const newP = await createProject(newClientName, newProjectTitle);
          setProjects(prev => [newP, ...prev]);
          setShowNewProjectModal(false);
          setNewClientName('');
          setNewProjectTitle('');
          openProject(newP.id);
      } catch (e: any) {
          setError(e.message);
      } finally {
          setLoading('processing', false);
      }
  }, [newClientName, newProjectTitle, openProject, setLoading]);

  const handleDeleteActiveImage = useCallback(async () => {
      if (!activeProject || !activeImageId) return;
      if (!window.confirm("Confirm deletion of this forensic asset?")) return;
      setLoading('processing', true);
      try {
          await deleteProjectImage(activeProject.id, activeImageId);
          const updatedProject = await getProjectDetails(activeProject.id);
          setActiveProject(updatedProject);
          if (updatedProject.images.length > 0) selectImage(updatedProject, updatedProject.images[0].id);
          else {
             setActiveImageId(null);
             setCurrentDisplayUrl(null);
             setCurrentRestoredUrl(null);
             setCurrentAnalysis(null);
             setWorkspaceStage(WorkspaceStage.IDLE);
          }
      } catch (e: any) { setError(e.message); } finally { setLoading('processing', false); }
  }, [activeProject, activeImageId, selectImage, setLoading]);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!activeProject || !e.target.files) return;
      setLoading('uploading', true);
      try {
          const updatedProject = await uploadImages(activeProject.id, Array.from(e.target.files));
          setActiveProject(updatedProject);
          if (!activeImageId && updatedProject.images.length > 0) selectImage(updatedProject, updatedProject.images[0].id);
      } catch (e: any) { setError(e.message); } finally { setLoading('uploading', false); e.target.value = ''; }
  }, [activeProject, activeImageId, selectImage, setLoading]);

  const handleGenericError = useCallback((e: any) => {
      const msg = e.message || "An unexpected system fault occurred.";
      if (msg.includes("Requested entity was not found")) {
          setHasApiKey(false);
          setError("Cloud Session Expired. Please re-authenticate.");
      } else setError(msg);
  }, []);

  const handleAnalyze = useCallback(async () => {
      if (!activeProject || !activeImageId) return;
      setLoading('analyzing', true);
      setWorkspaceStage(WorkspaceStage.ANALYZING);
      setRestorationSource('analysed'); 
      try {
          const analysis = await analyzeProjectImage(activeProject.id, activeImageId, analysisContext);
          const updated = await getProjectDetails(activeProject.id);
          setActiveProject(updated);
          selectImage(updated, activeImageId);
          setCurrentAnalysis(analysis);
          setWorkspaceStage(WorkspaceStage.REVIEW_PLAN);
      } catch (e: any) { handleGenericError(e); setWorkspaceStage(WorkspaceStage.IDLE); } finally { setLoading('analyzing', false); }
  }, [activeProject, activeImageId, analysisContext, selectImage, handleGenericError, setLoading]);

  const handleToggleStep = useCallback((stepId: string) => {
      if (!currentAnalysis) return;
      const updatedPlan = currentAnalysis.restorationPlan.map(step => {
          if (step.id === stepId) {
              if (step.status === 'completed') return step;
              let nextStatus: 'pending' | 'approved' | 'rejected' = 'pending';
              if (step.status === 'pending') nextStatus = 'approved';
              else if (step.status === 'approved') nextStatus = 'rejected';
              else if (step.status === 'rejected') nextStatus = 'pending';
              return { ...step, status: nextStatus };
          }
          return step;
      });
      setCurrentAnalysis({ ...currentAnalysis, restorationPlan: updatedPlan });
  }, [currentAnalysis]);

  const handleRestore = useCallback(async () => {
      if (!activeProject || !activeImageId || !currentAnalysis) return;
      setLoading('restoring', true);
      setWorkspaceStage(WorkspaceStage.RESTORING);
      const activeSteps = currentAnalysis.restorationPlan.filter(s => s.status === 'approved' || s.status === 'pending');
      try {
          await restoreProjectImage(activeProject.id, activeImageId, activeSteps, true, '4K', analysisContext, restorationSource); 
          const { restoredUrl } = getImageUrls(activeProject.id, activeImageId);
          setCurrentRestoredUrl(restoredUrl);
          setWorkspaceStage(WorkspaceStage.COMPARE);
          const updated = await getProjectDetails(activeProject.id);
          setActiveProject(updated);
          const updatedImg = updated.images.find(i => i.id === activeImageId);
          if (updatedImg?.analysis) setCurrentAnalysis(updatedImg.analysis);
      } catch (e: any) { handleGenericError(e); setWorkspaceStage(WorkspaceStage.REVIEW_PLAN); } finally { setLoading('restoring', false); }
  }, [activeProject, activeImageId, currentAnalysis, analysisContext, restorationSource, handleGenericError, setLoading]);

  const handleAudit = useCallback(async (focus: 'general' | 'colour' | 'defects') => {
      if (!activeProject || !activeImageId) return;
      setLoading('analyzing', true); 
      try {
          await auditProjectImage(activeProject.id, activeImageId, focus);
          const updated = await getProjectDetails(activeProject.id);
          setActiveProject(updated);
          const img = updated.images.find(i => i.id === activeImageId);
          if (img?.analysis) setCurrentAnalysis(img.analysis);
          setRestorationSource('restored');
          setCurrentDisplayUrl(currentRestoredUrl);
          setWorkspaceStage(WorkspaceStage.REVIEW_PLAN);
      } catch (e: any) { handleGenericError(e); } finally { setLoading('analyzing', false); }
  }, [activeProject, activeImageId, currentRestoredUrl, handleGenericError, setLoading]);

  const handleExport = useCallback(async () => {
      if (!activeProject) return;
      setLoading('processing', true);
      try { await exportProject(activeProject.id); setShowExportModal(true); } catch (e: any) { setError(e.message); } finally { setLoading('processing', false); }
  }, [activeProject, setLoading]);

  const handleDeleteProject = useCallback(async (e: React.MouseEvent, project: Project) => {
      e.stopPropagation();
      if(confirm(`Permanent deletion of ${project.title}? Data cannot be recovered.`)) { 
          await deleteProject(project.id); 
          loadProjects(); 
      }
  }, [loadProjects]);

  const handleOpenFolder = useCallback((e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      openProjectFolder(id);
  }, []);

  const handleSettings = useCallback(async () => {
      setLoading('processing', true);
      try {
          const s = await getSettings();
          setCustomProjectPath(s.projectsPath);
          setCustomLogoPath(s.logoPath);
          setShowSettingsModal(true);
      } catch (e) { 
          setError("System configuration inaccessible."); 
      } finally { 
          setLoading('processing', false); 
      }
  }, [setLoading]);

  const handleSaveSettings = useCallback(async () => {
      setLoading('processing', true);
      try { 
          await saveSettings(customProjectPath, customLogoPath); 
          setShowSettingsModal(false); 
          await loadProjects(); 
      } catch (e: any) { 
          setError(e.message || "Failed to update configuration"); 
      } finally { 
          setLoading('processing', false); 
      }
  }, [customProjectPath, customLogoPath, loadProjects, setLoading]);

  if (!hasApiKey) {
      return (
          <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(15,240,252,0.05),transparent_70%)]"></div>
              <div className="max-w-md w-full glass-card p-10 rounded-3xl border border-neon-cyan/20 text-center shadow-2xl relative z-10">
                  <div className="w-20 h-20 bg-neon-cyan/5 rounded-2xl flex items-center justify-center border border-neon-cyan/30 mx-auto mb-8 neon-glow-cyan">
                      <Key className="w-10 h-10 text-neon-cyan animate-pulse" />
                  </div>
                  <h1 className="text-3xl font-display font-bold text-white mb-4 tracking-tight">System Locked</h1>
                  <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                      Lumina Restore requires a validated <span className="text-neon-cyan font-bold">Gemini 3 Pro</span> session.
                  </p>
                  <button onClick={handleSelectKey} className="w-full py-4 bg-neon-cyan hover:bg-white text-black font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all flex items-center justify-center gap-3">
                      Authenticate
                  </button>
                  <div className="mt-8 pt-6 border-t border-white/5 flex items-start gap-3 text-left">
                      <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-600 uppercase tracking-widest leading-normal">
                          Connect to a paid GCP project via the AI Studio gateway.
                      </p>
                  </div>
              </div>
          </div>
      );
  }



  if (appStage === AppStage.DASHBOARD) {
    return (
        <div className="min-h-screen bg-[#020617] text-white p-10 relative overflow-hidden flex flex-col">
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>
            
            <div className="relative z-10 flex justify-between items-center mb-12 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center border border-neon-cyan/40 shadow-xl overflow-hidden p-2">
                         <img src="/api/logo" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                         <div className="hidden font-display font-bold text-2xl text-neon-cyan">L</div>
                    </div>
                    <div>
                        <h1 className="text-3xl font-display font-bold text-white mb-1 tracking-tight">Lumina <span className="text-neon-cyan">Restore</span></h1>
                        <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.3em]">Forensic Digital Conservation</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleSettings} className="bg-gray-900/50 hover:bg-gray-800 text-gray-400 hover:text-white p-3.5 rounded-xl border border-white/5 transition-all">
                        <SettingsIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setShowNewProjectModal(true)} className="bg-neon-cyan hover:bg-white text-black px-8 py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg transition-all flex items-center gap-2">
                        <PlusCircle className="w-5 h-5" /> New Session
                    </button>
                </div>
            </div>

            <StatsVisualizer projects={projects} />
            
            <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-4">
                {projects.map(p => (
                    <ProjectCard key={p.id} project={p} onOpen={openProject} onDelete={handleDeleteProject} onOpenFolder={handleOpenFolder} />
                ))}
            </div>
            
            {showNewProjectModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-gray-900 border border-white/10 p-10 rounded-3xl w-full max-w-md shadow-2xl">
                        <h2 className="text-2xl font-bold font-display text-white mb-8 tracking-tight">Initialize Repository</h2>
                        <div className="space-y-6 mb-10">
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Client Identity</label>
                                <input value={newClientName} onChange={e => setNewClientName(e.target.value)} className="w-full bg-black/40 border border-gray-800 rounded-xl p-4 text-white focus:border-neon-cyan focus:outline-none transition-colors" placeholder="e.g. British Museum" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Repository Title</label>
                                <input value={newProjectTitle} onChange={e => setNewProjectTitle(e.target.value)} className="w-full bg-black/40 border border-gray-800 rounded-xl p-4 text-white focus:border-neon-cyan focus:outline-none transition-colors" placeholder="e.g. 1922 Expedition Scans" />
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <button onClick={() => setShowNewProjectModal(false)} className="flex-1 py-4 text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest">CANCEL</button>
                            <button onClick={handleCreateProject} disabled={loadingState.processing} className="flex-1 py-4 bg-neon-cyan text-black font-bold rounded-xl uppercase tracking-widest hover:bg-white transition-all">
                                {loadingState.processing ? 'INITIALIZING...' : 'OPEN'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showSettingsModal && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-gray-900/80 border border-white/10 p-8 rounded-3xl w-full max-w-lg shadow-2xl">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-display font-bold text-white mb-1">System Configuration</h2>
                                <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">Global Platform Parameters</p>
                            </div>
                            <button onClick={() => setShowSettingsModal(false)} className="text-gray-500 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Database className="w-3 h-3 text-neon-cyan" /> Repository Root
                                </label>
                                <input 
                                    value={customProjectPath} 
                                    onChange={e => setCustomProjectPath(e.target.value)} 
                                    className="w-full bg-black/40 border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-neon-cyan focus:outline-none transition-colors"
                                    placeholder="/path/to/storage"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <ImageIcon className="w-3 h-3 text-neon-pink" /> Studio Assets
                                </label>
                                <input 
                                    value={customLogoPath} 
                                    onChange={e => setCustomLogoPath(e.target.value)} 
                                    className="w-full bg-black/40 border border-gray-800 rounded-xl p-4 text-sm text-white focus:border-neon-pink focus:outline-none transition-colors"
                                    placeholder="/path/to/logo.png"
                                />
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500'}`} />
                                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Interface Status</span>
                                    </div>
                                    <span className={`text-[10px] font-bold font-mono ${backendConnected ? 'text-green-400' : 'text-red-400'}`}>
                                        {backendConnected ? 'ONLINE' : 'OFFLINE'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button onClick={() => setShowSettingsModal(false)} className="flex-1 py-4 text-xs font-bold text-gray-500 hover:text-white tracking-widest">CANCEL</button>
                            <button onClick={handleSaveSettings} disabled={loadingState.processing} className="flex-1 py-4 bg-white text-black font-bold rounded-xl uppercase tracking-widest hover:bg-neon-cyan transition-all">
                                COMMIT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#020617] overflow-hidden text-gray-200 font-sans">
        {activeProject && (
            <LeftSidebar 
                project={activeProject} activeImageId={activeImageId} onSelectImage={(id) => selectImage(activeProject, id)} onUpload={handleUpload} analysisContext={analysisContext} setAnalysisContext={setAnalysisContext} onAnalyze={handleAnalyze} onBackToDashboard={() => setAppStage(AppStage.DASHBOARD)} onExport={handleExport} loadingState={loadingState} workspaceStage={workspaceStage}
            />
        )}
        <div className="flex-1 relative bg-black flex flex-col justify-center items-center overflow-hidden group">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20"></div>
            
            {activeImageId && (
                <div className="absolute top-8 right-8 z-40 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <button onClick={handleSettings} className="p-3 bg-gray-900/40 hover:bg-gray-800 text-gray-400 border border-white/5 rounded-2xl backdrop-blur-xl shadow-lg">
                        <SettingsIcon className="w-5 h-5" />
                    </button>
                    <button onClick={handleDeleteActiveImage} className="p-3 bg-red-900/40 hover:bg-red-600 text-red-500 hover:text-white border border-red-900/20 rounded-2xl backdrop-blur-xl shadow-lg">
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            )}

            {!activeImageId ? (
                <div className="text-center z-10 animate-in fade-in duration-1000">
                    <div className="w-20 h-20 bg-gray-900/50 border border-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                        <Sparkles className="w-10 h-10 text-gray-700" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white mb-2 tracking-tight">Workspace Ready</h2>
                    <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Import forensic assets to begin analysis</p>
                </div>
            ) : (
                <div className="w-full h-full relative z-10 animate-in fade-in duration-500">
                    {workspaceStage === WorkspaceStage.COMPARE && currentAnalysedUrl && currentRestoredUrl ? (
                        <Suspense fallback={<LoadingSpinner />}>
                             <ComparisonView original={currentAnalysedUrl} restored={currentRestoredUrl} />
                        </Suspense>
                    ) : currentDisplayUrl ? (
                        <RestorationCanvas imageSrc={currentDisplayUrl} analysis={currentAnalysis} />
                    ) : <LoadingSpinner /> }
                </div>
            )}

            {(loadingState.analyzing || loadingState.restoring) && (
                <div className="absolute inset-0 z-[60] bg-gray-950/95 backdrop-blur-xl flex flex-col items-center justify-center animate-in fade-in duration-500">
                    <div className="relative flex flex-col items-center w-full max-w-lg px-8">
                        
                        <div className="relative w-40 h-40 mb-16 flex items-center justify-center">
                            <div className="absolute inset-0 border-[1px] border-white/5 rounded-full"></div>
                            <div className="absolute inset-2 border-[1px] border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin"></div>
                            <div className="absolute inset-6 border-[1px] border-neon-pink/20 border-b-neon-pink rounded-full animate-spin-slow"></div>
                            
                            <div className="w-20 h-20 bg-gray-900 rounded-[2.5rem] flex items-center justify-center overflow-hidden border border-white/10 relative z-10 shadow-2xl">
                                <Activity className={`w-8 h-8 ${loadingState.analyzing ? 'text-neon-cyan' : 'text-neon-pink'} animate-pulse`} />
                            </div>
                        </div>

                        <div className="text-center mb-10 w-full">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <Terminal className="w-4 h-4 text-gray-500" />
                                <h3 className="text-xl font-display font-bold text-white tracking-[0.4em] uppercase">
                                    {loadingState.analyzing ? "Diagnostic Mode" : "Neural Reconstruction"}
                                </h3>
                            </div>
                            <div className="h-6 overflow-hidden relative">
                                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest absolute inset-0 flex items-center justify-center animate-in slide-in-from-bottom-2 duration-300" key={loadingMessageIdx}>
                                    {loadingState.analyzing 
                                        ? (ANALYSIS_MESSAGES[loadingMessageIdx % ANALYSIS_MESSAGES.length]) 
                                        : (RESTORATION_MESSAGES[loadingMessageIdx % RESTORATION_MESSAGES.length])
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="w-full max-w-xs space-y-4">
                            <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden relative">
                                <div 
                                    className={`h-full transition-all duration-500 ease-out ${loadingState.analyzing ? 'bg-neon-cyan' : 'bg-neon-pink'}`}
                                    style={{ width: `${loadingProgress}%` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent w-1/3 animate-scan"></div>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-mono text-gray-600 uppercase tracking-tighter">Gemini 3 Compute Unit</span>
                                <span className="text-[9px] font-mono text-white font-bold">{Math.round(loadingProgress)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        <RightSidebar 
            analysis={currentAnalysis}
            workspaceStage={workspaceStage}
            onRestore={handleRestore}
            isRestoring={loadingState.restoring}
            onAudit={handleAudit}
            onReAnalyze={handleAnalyze}
            onToggleStep={handleToggleStep}
            restoredUrl={currentRestoredUrl}
            projectTitle={activeProject?.title || ''}
            imageIndex={activeProject?.images.findIndex(i => i.id === activeImageId) || 0}
            restorationSource={restorationSource}
            activeImage={activeProject?.images.find(i => i.id === activeImageId)}
        />
        {showExportModal && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-md p-10 text-center shadow-2xl">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 mb-8 mx-auto">
                        <CheckCircle className="w-10 h-10 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white mb-2">Export Ready</h2>
                    <p className="text-sm text-gray-500 mb-10 leading-relaxed">Forensic restoration reports generated and archived in project storage.</p>
                    <div className="flex flex-col gap-4">
                        <button 
                            onClick={() => activeProject && openProjectFolder(activeProject.id)} 
                            className="w-full py-4 bg-neon-cyan text-black font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg"
                        >
                            <FolderOpen className="w-5 h-5" /> Open Directory
                        </button>
                        <button 
                            onClick={() => setShowExportModal(false)} 
                            className="w-full py-4 bg-gray-800 text-gray-400 font-bold uppercase tracking-widest rounded-xl hover:text-white transition-all"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        )}
        {error && (
            <div className="fixed bottom-10 right-10 bg-red-950/90 text-white px-8 py-5 rounded-2xl border border-red-500/30 shadow-2xl z-[150] flex items-center gap-6 animate-in slide-in-from-right-10 duration-500">
                <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                    <h4 className="font-bold text-sm tracking-tight">System Exception</h4>
                    <p className="text-[10px] font-mono text-red-400/80 mt-1 uppercase tracking-wider">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-gray-500" />
                </button>
            </div>
        )}
    </div>
  );
};

export default App;