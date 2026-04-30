import React, { useMemo, memo } from 'react';
import { Folder, Trash2, User, FolderOpen, ArrowRight, Clock, Coins, Database } from 'lucide-react';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onOpen: (id: string) => void;
  onDelete: (e: React.MouseEvent, project: Project) => void;
  onOpenFolder: (e: React.MouseEvent, id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = memo(({ project, onOpen, onDelete, onOpenFolder }) => {
  
  const stats = useMemo(() => {
    const images = project.images || [];
    const total = images.length;
    const restored = images.filter(i => i.status === 'completed').length;
    const analyzed = images.filter(i => i.status === 'analyzed' || i.status === 'restoring').length;
    const percent = total > 0 ? Math.round((restored / total) * 100) : 0;
    
    const totalTokens = project.stats?.totalTokens || 0;
    const totalCost = project.stats?.totalCost || 0;
    
    return { total, restored, analyzed, percent, totalTokens, totalCost };
  }, [project.images, project.stats]);

  return (
    <div 
        onClick={() => onOpen(project.id)}
        className="relative bg-gray-900/30 backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:border-neon-cyan/40 transition-all group flex flex-col h-[340px] hover:shadow-2xl cursor-pointer overflow-hidden animate-in fade-in zoom-in-95 duration-500"
    >
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-neon-cyan/[0.03] rounded-full blur-[80px] group-hover:bg-neon-cyan/[0.08] transition-colors duration-700"></div>

      <button 
          onClick={(e) => onDelete(e, project)}
          className="absolute top-6 right-6 text-gray-600 hover:text-red-400 hover:bg-red-400/10 p-2.5 rounded-xl transition-all opacity-0 group-hover:opacity-100 z-10"
      >
          <Trash2 className="w-4 h-4" />
      </button>
      
      <div className="flex justify-between items-start mb-6">
          <div className="w-14 h-14 bg-black/40 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-neon-cyan/20 transition-colors">
              <Database className="w-7 h-7 text-gray-600 group-hover:text-neon-cyan transition-all duration-500" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-full border uppercase tracking-widest ${
                stats.percent === 100
                ? 'border-green-500/20 text-green-400 bg-green-500/5' 
                : 'border-white/5 text-gray-500 bg-white/5'
            }`}>
                {stats.percent === 100 ? 'ARCHIVED' : 'ACTIVE'}
            </span>
            {stats.totalTokens > 0 && (
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-neon-yellow/60">
                <Coins className="w-3 h-3" />
                ${stats.totalCost.toFixed(3)}
              </div>
            )}
          </div>
      </div>

      <h3 className="text-xl font-display font-bold text-white mb-2 line-clamp-2 leading-tight pr-4 min-h-[3.5rem] flex items-center">{project.title}</h3>
      <div className="flex items-center gap-4 text-gray-500 text-[10px] mb-8 font-mono tracking-widest uppercase">
          <span className="flex items-center gap-1.5 text-gray-400"><User className="w-3 h-3" /> {project.clientName}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(project.createdAt).toLocaleDateString()}</span>
      </div>
      
      <div className="mt-auto">
          <div className="flex justify-between items-end mb-4">
               <div className="flex flex-col">
                   <span className="text-[9px] text-gray-500 uppercase tracking-widest mb-1.5">Restoration Ratio</span>
                   <span className="text-sm font-display text-white">
                      <span className="text-neon-cyan font-bold">{stats.restored}</span>
                      <span className="text-gray-600"> / </span>
                      <span>{stats.total}</span>
                      <span className="text-[10px] font-mono text-gray-600 ml-2 uppercase tracking-tighter">Assets</span>
                   </span>
               </div>
               <div className="flex flex-col items-end">
                    <span className="text-[9px] text-gray-600 font-mono uppercase tracking-widest mb-1.5">Lateny Tier</span>
                    <span className="text-[10px] text-gray-400 font-mono">{(stats.totalTokens / 1000).toFixed(1)}k Tokens</span>
               </div>
          </div>

          <div className="w-full h-1.5 bg-gray-950 rounded-full overflow-hidden mb-6 flex">
               <div 
                  className="h-full bg-neon-cyan shadow-[0_0_12px_rgba(15,240,252,0.4)] transition-all duration-700 ease-out" 
                  style={{ width: `${(stats.restored / Math.max(stats.total, 1)) * 100}%` }}
               />
               <div 
                  className="h-full bg-neon-purple/40 transition-all duration-700 ease-out" 
                  style={{ width: `${(stats.analyzed / Math.max(stats.total, 1)) * 100}%` }}
               />
          </div>

          <div className="flex gap-3">
               <button 
                   onClick={(e) => onOpenFolder(e, project.id)}
                   className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-transparent"
               >
                   <FolderOpen className="w-4 h-4" />
               </button>
               <div className="flex-1 flex items-center justify-end text-[10px] font-bold text-neon-cyan opacity-40 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 tracking-widest">
                   WORKSPACE <ArrowRight className="w-3 h-3 ml-2" />
               </div>
          </div>
      </div>
    </div>
  );
});

export default ProjectCard;