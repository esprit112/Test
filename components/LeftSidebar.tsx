import React, { useRef, memo } from 'react';
import { Project, WorkspaceStage, LoadingStates } from '../types';
import { Upload, ChevronDown, Cpu, ArrowLeft, Download, User, Database, Terminal } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface LeftSidebarProps {
  project: Project;
  activeImageId: string | null;
  onSelectImage: (imageId: string) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  analysisContext: string;
  setAnalysisContext: (text: string) => void;
  onAnalyze: () => void;
  onBackToDashboard: () => void;
  onExport: () => void;
  loadingState: LoadingStates;
  workspaceStage: WorkspaceStage;
}

const LeftSidebar: React.FC<LeftSidebarProps> = memo(({
  project,
  activeImageId,
  onSelectImage,
  onUpload,
  analysisContext,
  setAnalysisContext,
  onAnalyze,
  onBackToDashboard,
  onExport,
  loadingState,
  workspaceStage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeImage = project.images.find(img => img.id === activeImageId);

  const totalPhotos = project.images.length;
  const restoredPhotos = project.images.filter(img => img.status === 'completed').length;
  const progressPercent = totalPhotos > 0 ? Math.round((restoredPhotos / totalPhotos) * 100) : 0;

  return (
    <div className="w-[320px] flex flex-col h-full bg-[#050a14] border-r border-white/5 relative z-40">
        <div className="p-8 border-b border-white/5 bg-gradient-to-b from-gray-900/20 to-transparent">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center border border-neon-cyan/20 shadow-2xl p-2">
                     <img src="/api/logo" alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display='none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
                     <div className="hidden font-display font-bold text-xl text-neon-cyan">L</div>
                </div>
                <div className="flex flex-col">
                    <span className="font-display font-bold text-white tracking-tight leading-none text-sm">LUMINA RESTORE</span>
                    <span className="text-[9px] text-gray-500 font-mono tracking-[0.3em] uppercase mt-1">Forensic OS v1.0</span>
                </div>
            </div>
            
            <button onClick={onBackToDashboard} className="flex items-center gap-2 text-[10px] text-gray-500 hover:text-white transition-all group font-mono tracking-widest">
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> 
                LEAVE WORKSPACE
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
            
            <div className="space-y-6">
                 <div>
                    <h3 className="text-[9px] font-mono text-gray-600 uppercase tracking-[0.3em] mb-3">Repository Info</h3>
                    <div className="text-white font-display font-bold text-lg leading-tight mb-2">{project.title}</div>
                    <div className="text-gray-500 text-[10px] font-mono uppercase flex items-center gap-2 tracking-widest">
                        <User className="w-3 h-3 text-neon-cyan" /> {project.clientName}
                    </div>
                 </div>

                 <div className="bg-gray-950/50 border border-white/5 rounded-2xl p-5 space-y-4 shadow-inner">
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] text-gray-500 uppercase font-mono tracking-widest">Asset Count</span>
                        <span className="text-xs font-mono text-white font-bold">{totalPhotos}</span>
                    </div>
                    <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                        <div className="h-full bg-neon-cyan shadow-[0_0_8px_#0ff0fc] transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-mono tracking-widest">
                        <span className="text-neon-cyan uppercase">Conserved</span>
                        <span className="text-white">{restoredPhotos}</span>
                    </div>
                 </div>
            </div>

            <div className="space-y-4">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loadingState.uploading}
                    className="w-full py-5 border border-dashed border-gray-800 bg-gray-900/20 hover:bg-gray-800/40 rounded-2xl text-gray-500 hover:text-neon-cyan hover:border-neon-cyan/30 transition-all flex flex-col items-center justify-center gap-2 group"
                >
                    {loadingState.uploading ? <LoadingSpinner size="sm" /> : <Upload className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />}
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em]">{loadingState.uploading ? 'INGESTING...' : 'IMPORT SOURCE'}</span>
                </button>
                <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={onUpload} />
            </div>

            <div className="space-y-4">
                <label className="block text-[9px] font-mono text-neon-cyan uppercase tracking-[0.3em]">Asset Pipeline</label>
                <div className="relative group">
                    <select 
                        value={activeImageId || ''}
                        onChange={(e) => onSelectImage(e.target.value)}
                        className="w-full appearance-none bg-gray-900/60 border border-white/5 text-white text-xs font-mono rounded-xl p-4 pr-10 focus:outline-none focus:border-neon-cyan transition-all cursor-pointer hover:bg-gray-900"
                    >
                        <option value="" disabled>Select Forensic Asset...</option>
                        {project.images.map(img => (
                            <option key={img.id} value={img.id}>
                                {img.displayFilename || img.filename} {img.status === 'completed' ? ' [✓]' : ''}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-4.5 w-4 h-4 text-gray-600 pointer-events-none group-hover:text-neon-cyan transition-colors" />
                </div>
            </div>

            <div className="space-y-4">
                 <label className="block text-[9px] font-mono text-gray-600 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Terminal className="w-3 h-3" /> External Context
                 </label>
                 <textarea 
                    value={analysisContext}
                    onChange={(e) => setAnalysisContext(e.target.value)}
                    placeholder="Provide historical context for the AI agent..."
                    className="w-full bg-gray-950/50 border border-white/5 rounded-2xl p-4 text-[11px] text-gray-400 placeholder:text-gray-800 focus:outline-none focus:border-neon-pink transition-all h-36 resize-none font-mono leading-relaxed shadow-inner"
                 />
            </div>

            <div className="pt-2">
                <button
                    onClick={onAnalyze}
                    disabled={!activeImageId || loadingState.analyzing || loadingState.restoring}
                    className={`w-full py-5 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-500 ${
                        (!activeImageId || loadingState.analyzing)
                        ? 'bg-gray-900 text-gray-700 cursor-not-allowed border border-white/5'
                        : 'bg-white text-black hover:bg-neon-cyan shadow-xl hover:shadow-neon-cyan/20'
                    }`}
                >
                    {loadingState.analyzing ? <LoadingSpinner size="sm" variant="button" /> : <Cpu className="w-4 h-4" />}
                    {loadingState.analyzing ? 'PROCESSING' : 'START DIAGNOSIS'}
                </button>
            </div>
        </div>

        <div className="p-8 border-t border-white/5 bg-gray-900/10">
            <button
                onClick={onExport}
                disabled={loadingState.processing}
                className="w-full py-4 bg-gray-900/50 hover:bg-gray-800 border border-white/5 hover:border-neon-cyan/30 text-gray-500 hover:text-neon-cyan rounded-xl text-[9px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all group"
            >
                 {loadingState.processing ? <LoadingSpinner size="sm" variant="button" /> : <Download className="w-4 h-4" />}
                 GENERATE ARCHIVE
            </button>
        </div>
    </div>
  );
});

export default LeftSidebar;