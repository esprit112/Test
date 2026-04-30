import React, { memo } from 'react';
import { DamageAnalysis, WorkspaceStage, ProjectImage } from '../types';
import { MapPin, ExternalLink, Activity, Layers, Play, CheckCircle, Download, Palette, Eraser, ShieldCheck, ScanSearch, Coins, BarChart3, Info } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface RightSidebarProps {
  analysis: DamageAnalysis | null;
  workspaceStage: WorkspaceStage;
  onRestore: () => void;
  isRestoring: boolean;
  onAudit: (focus: 'general' | 'colour' | 'defects') => void;
  onReAnalyze: () => void;
  onToggleStep: (id: string) => void;
  restoredUrl: string | null;
  projectTitle: string;
  imageIndex: number;
  restorationSource: 'analysed' | 'restored';
  activeImage?: ProjectImage;
}

const RightSidebar: React.FC<RightSidebarProps> = memo(({
  analysis,
  workspaceStage,
  onRestore,
  isRestoring,
  onAudit,
  onToggleStep,
  restoredUrl,
  projectTitle,
  restorationSource,
  activeImage
}) => {
  
  if (!analysis) {
      return (
          <div className="w-[360px] bg-[#050a14] border-l border-white/5 p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full border border-white/5 flex items-center justify-center mb-6 opacity-20">
                <Activity className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-[9px] font-mono uppercase tracking-[0.4em] text-gray-700">Awaiting Telemetry</p>
          </div>
      );
  }

  const firstMapLink = analysis.groundingLinks?.find(l => l.uri.includes('maps') || l.uri.includes('google'));

  return (
    <div className="w-[360px] flex flex-col h-full bg-[#050a14] border-l border-white/5 relative z-40">
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            
            {activeImage?.usage && (activeImage.usage.totalTokens > 0) && (
              <div className="p-8 border-b border-white/5 bg-gray-900/10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[9px] font-mono text-neon-yellow uppercase tracking-[0.3em] flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5" /> Compute Cost
                    </h3>
                    <span className="text-[10px] font-bold text-white font-mono">${activeImage.usage.totalCost.toFixed(3)}</span>
                </div>
                
                <div className="space-y-4">
                  <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-yellow transition-all duration-1000" style={{ width: '100%' }} />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                    <span>Cluster Usage</span>
                    <span>{activeImage.usage.totalTokens.toLocaleString()} Tokens</span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-8 border-b border-white/5">
                <h3 className="text-[9px] font-mono text-neon-cyan uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Forensic Findings
                </h3>
                
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-950 border border-white/5 rounded-2xl p-4">
                            <span className="text-[8px] text-gray-600 block uppercase mb-1.5 font-mono tracking-widest">Substrate</span>
                            <span className="text-[11px] text-white font-display font-bold block truncate" title={analysis.materialSubstrate}>{analysis.materialSubstrate}</span>
                        </div>
                        <div className="bg-gray-950 border border-white/5 rounded-2xl p-4">
                            <span className="text-[8px] text-gray-600 block uppercase mb-1.5 font-mono tracking-widest">Probable Era</span>
                            <span className="text-[11px] text-white font-display font-bold block truncate">{analysis.historicalEra}</span>
                        </div>
                    </div>

                    {analysis.geolocation && (
                        <div className="bg-gray-950 border border-white/5 rounded-2xl p-4">
                            <span className="text-[8px] text-gray-600 block uppercase mb-2 font-mono tracking-widest flex items-center gap-1.5">
                                <MapPin className="w-2.5 h-2.5" /> Location Derivation
                            </span>
                            <p className="text-[11px] text-gray-400 mb-4 line-clamp-3 leading-relaxed">{analysis.geolocation}</p>
                            {firstMapLink && (
                                <a href={firstMapLink.uri} target="_blank" className="inline-flex items-center gap-2 text-[8px] font-mono font-bold text-neon-cyan hover:text-white uppercase transition-colors tracking-widest">
                                    <ExternalLink className="w-3 h-3" /> External Verification
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="p-8 pb-32">
                <h3 className="text-[9px] font-mono text-neon-purple uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" /> Agentic Pipeline
                </h3>
                
                {restorationSource === 'restored' && (
                    <div className="mb-8 bg-neon-purple/5 border border-neon-purple/20 rounded-2xl p-4">
                         <h4 className="text-[9px] font-bold text-neon-purple uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <ScanSearch className="w-3.5 h-3.5" /> Post-Restoration Audit
                         </h4>
                         <p className="text-[10px] text-gray-500 leading-relaxed font-mono">
                            The Reflection Agent has flagged potential refinements based on your audit focus.
                         </p>
                    </div>
                )}

                <div className="space-y-6 relative">
                    <div className="absolute left-3 top-2 bottom-2 w-px bg-white/5"></div>

                    {analysis.restorationPlan?.map((step, idx) => {
                        const isCompleted = step.status === 'completed';
                        const isApproved = step.status === 'approved';
                        const isRejected = step.status === 'rejected';

                        return (
                            <div key={idx} className="relative pl-10 group cursor-pointer" onClick={() => !isCompleted && onToggleStep(step.id)}>
                                <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border flex items-center justify-center bg-[#050a14] z-10 transition-all duration-300 ${
                                    isCompleted ? 'border-green-500 bg-green-500/10' :
                                    isApproved ? 'border-neon-cyan shadow-[0_0_15px_rgba(15,240,252,0.3)]' : 
                                    isRejected ? 'border-red-500 opacity-50' :
                                    'border-gray-800'
                                }`}>
                                    <div className={`w-2 h-2 rounded-full ${
                                        isCompleted ? 'bg-green-500' :
                                        isApproved ? 'bg-neon-cyan' : 
                                        isRejected ? 'bg-red-500' :
                                        'bg-transparent'
                                    }`} />
                                </div>
                                
                                <div className={`p-4 rounded-2xl border text-[11px] transition-all duration-300 font-mono leading-relaxed ${
                                    isCompleted
                                    ? 'bg-green-500/5 border-green-500/10 text-gray-400'
                                    : isApproved 
                                    ? 'bg-gray-900 border-white/10 text-white shadow-xl' 
                                    : isRejected
                                    ? 'border-transparent text-gray-700 line-through opacity-40'
                                    : 'bg-transparent border-transparent text-gray-500 hover:bg-white/5'
                                }`}>
                                    <p className="font-medium mb-3">{step.description}</p>
                                    <div className="flex items-center justify-between text-[8px] uppercase tracking-widest font-bold">
                                        <span className="bg-white/5 px-2 py-1 rounded-md text-gray-600">{step.tool}</span>
                                        <span className={isCompleted ? 'text-green-500' : isApproved ? 'text-neon-cyan' : isRejected ? 'text-red-500' : 'text-gray-700'}>
                                            {step.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 bg-[#050a14]/90 backdrop-blur-xl border-t border-white/5 shadow-2xl">
            {workspaceStage === WorkspaceStage.COMPARE ? (
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em] font-mono">Restoration Finalized</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                        <button onClick={() => onAudit('general')} className={`p-3 text-[8px] rounded-xl font-bold uppercase tracking-widest border transition-all ${analysis.auditFocus === 'general' ? 'bg-white text-black border-white' : 'bg-gray-950 border-white/5 text-gray-500 hover:text-white hover:border-white/20'}`}>
                             Audit
                        </button>
                        <button onClick={() => onAudit('colour')} className={`p-3 text-[8px] rounded-xl font-bold uppercase tracking-widest border transition-all ${analysis.auditFocus === 'colour' ? 'bg-neon-purple text-white border-neon-purple shadow-lg' : 'bg-gray-950 border-white/5 text-gray-500 hover:text-white hover:border-white/20'}`}>
                             Color
                        </button>
                        <button onClick={() => onAudit('defects')} className={`p-3 text-[8px] rounded-xl font-bold uppercase tracking-widest border transition-all ${analysis.auditFocus === 'defects' ? 'bg-neon-yellow text-black border-neon-yellow shadow-lg' : 'bg-gray-950 border-white/5 text-gray-500 hover:text-white hover:border-white/20'}`}>
                             Fix
                        </button>
                    </div>

                    <a href={restoredUrl || '#'} download={`RESORED_${projectTitle.toUpperCase()}.jpg`} className="block w-full py-4 bg-neon-cyan text-black font-bold text-xs uppercase tracking-[0.2em] text-center rounded-2xl hover:bg-white shadow-xl transition-all">
                        <Download className="w-4 h-4 inline mr-2" /> Download Asset
                    </a>
                </div>
            ) : (
                <button
                    onClick={onRestore}
                    disabled={isRestoring || !analysis}
                    className={`w-full py-5 font-bold text-[10px] uppercase tracking-[0.3em] rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-20 ${
                        restorationSource === 'restored' ? 'bg-neon-purple text-white shadow-xl' : 'bg-neon-pink text-white shadow-xl'
                    }`}
                >
                    {isRestoring ? <LoadingSpinner size="sm" variant="button" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    {isRestoring ? 'PROCESSING' : restorationSource === 'restored' ? 'APPLY REFINEMENT' : 'EXECUTE PIPELINE'}
                </button>
            )}
            <div className="mt-4 flex items-center justify-center gap-2 opacity-30 text-[8px] font-mono text-gray-500 uppercase tracking-widest">
                <Info className="w-3 h-3" /> Documentary Integrity Locked
            </div>
        </div>
    </div>
  );
});

export default RightSidebar;