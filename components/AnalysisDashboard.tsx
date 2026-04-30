
import React, { memo } from 'react';
import { DamageAnalysis } from '../types';
import { Microscope, AlertTriangle, Layers, CheckCircle, XCircle, MapPin, ExternalLink, Brush, FlaskConical, Cpu, Users, Box, Search, ShieldCheck } from 'lucide-react';

interface AnalysisDashboardProps {
  analysis: DamageAnalysis;
  onToggleStep: (id: string) => void;
}

const getStepStyle = (type: string) => {
  switch (type) {
    case 'physical':
      return {
        icon: Brush,
        label: 'Physical',
        badgeClass: 'text-amber-300 bg-amber-900/30 border-amber-700/50',
        borderClass: 'border-amber-900/30 hover:border-amber-700/50'
      };
    case 'chemical':
      return {
        icon: FlaskConical,
        label: 'Chemical',
        badgeClass: 'text-fuchsia-300 bg-fuchsia-900/30 border-fuchsia-700/50',
        borderClass: 'border-fuchsia-900/30 hover:border-fuchsia-700/50'
      };
    case 'digital':
    default:
      return {
        icon: Cpu,
        label: 'Digital',
        badgeClass: 'text-cyan-300 bg-cyan-900/30 border-cyan-700/50',
        borderClass: 'border-cyan-900/30 hover:border-cyan-700/50'
      };
  }
};

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = memo(({ analysis, onToggleStep }) => {
  
  const isRefinement = analysis.materialSubstrate?.includes('Restored') || analysis.materialSubstrate?.includes('Digital Master');

  return (
    <div className="h-full overflow-y-auto bg-gray-900 border-r border-gray-700 p-6 w-full max-w-md">
      <div className="mb-6">
        <h2 className="text-xl font-mono font-bold text-white flex items-center gap-2">
          {isRefinement ? <Cpu className="w-5 h-5 text-purple-500" /> : <ShieldCheck className="w-5 h-5 text-brand-500" />}
          {isRefinement ? "Refinement Audit" : "Forensic Diagnosis"}
        </h2>
        <p className="text-gray-400 text-sm mt-1">{isRefinement ? "Quality Control & Artifact Check" : "AgenticIR Perception Phase"}</p>
      </div>

      {/* Material Archaeology Card */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700 shadow-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-gray-500">Substrate</span>
            <div className="text-brand-400 font-semibold truncate text-sm" title={analysis.materialSubstrate}>{analysis.materialSubstrate}</div>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-gray-500">Era</span>
            <div className="text-white font-medium text-sm">{analysis.historicalEra}</div>
          </div>
          <div className="col-span-2">
            <span className="text-xs uppercase tracking-wider text-gray-500">Conservation Status</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${analysis.conditionRating > 7 ? 'bg-green-500' : analysis.conditionRating > 4 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                  style={{ width: `${analysis.conditionRating * 10}%` }}
                />
              </div>
              <span className="text-sm font-mono">{analysis.conditionRating}/10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Research (New AgenticIR Feature) */}
      {analysis.visualResearch && (
        <div className="mb-6 bg-brand-900/20 border border-brand-500/30 p-4 rounded-lg">
           <h3 className="text-sm font-bold text-brand-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Search className="w-4 h-4" /> Historical Research
           </h3>
           <p className="text-xs text-gray-300 leading-relaxed font-mono">
              {analysis.visualResearch}
           </p>
           {analysis.groundingLinks && analysis.groundingLinks.length > 0 && (
             <div className="mt-3 pt-2 border-t border-brand-500/20 flex flex-col gap-1">
                {analysis.groundingLinks.map((link, i) => (
                    <a key={i} href={link.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] text-brand-300 hover:text-white flex items-center gap-1 truncate hover:underline">
                        <ExternalLink className="w-3 h-3" /> {link.title || link.uri}
                    </a>
                ))}
             </div>
           )}
        </div>
      )}

      {/* Identified Defects (Pathology) */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Pathology (Defects)
        </h3>
        <ul className="space-y-2">
          {analysis.defects?.map((defect, idx) => (
            <li key={idx} className="flex justify-between items-start text-sm bg-gray-800/50 p-2 rounded border border-gray-700/50">
              <div className="flex flex-col">
                  <span className="text-gray-200 font-medium">{defect.type}</span>
                  {defect.location && <span className="text-[10px] text-gray-500">{defect.location}</span>}
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${
                  defect.severity === 'high' ? 'bg-red-900/50 text-red-400' : 'bg-gray-700 text-gray-400'
              }`}>
                {defect.severity || 'Detected'}
              </span>
            </li>
          ))}
          {(!analysis.defects || analysis.defects.length === 0) && (
             <li className="text-sm text-gray-500 italic">No specific defects identified.</li>
          )}
        </ul>
      </div>

      {/* Restoration Plan */}
      <div>
        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4" /> Restoration Schedule
        </h3>
        <div className="space-y-3">
          {Array.isArray(analysis.restorationPlan) && analysis.restorationPlan.map((step) => {
            const priority = step.priority || 'medium';
            const isCompleted = step.status === 'completed';
            const isActive = step.status !== 'rejected';
            const typeStyle = getStepStyle(step.type);
            const TypeIcon = typeStyle.icon;
            
            return (
              <div 
                key={step.id} 
                onClick={() => !isCompleted && onToggleStep(step.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 group relative overflow-hidden ${
                  isActive 
                    ? `bg-gray-800/80 ${typeStyle.borderClass} shadow-lg` 
                    : 'bg-gray-800/30 border-gray-800 opacity-60 hover:opacity-100'
                } ${isCompleted ? 'opacity-80' : ''}`}
              >
                {isActive && (
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    step.type === 'physical' ? 'bg-amber-500' : step.type === 'chemical' ? 'bg-fuchsia-500' : 'bg-cyan-500'
                  }`}></div>
                )}

                <div className="flex justify-between items-start mb-2 pl-2">
                  <div className="flex flex-col gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border w-fit ${typeStyle.badgeClass}`}>
                        <TypeIcon className="w-3 h-3" />
                        {typeStyle.label}
                      </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                         <div className="bg-green-500/20 p-1 rounded-full border border-green-500/50">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                         </div>
                    ) : step.status === 'approved' || step.status === 'pending' ? 
                      <CheckCircle className="w-5 h-5 text-brand-500 shadow-brand-500/50 drop-shadow-sm" /> : 
                      <XCircle className="w-5 h-5 text-gray-600 group-hover:text-red-400 transition-colors" />
                    }
                  </div>
                </div>
                
                <div className="pl-2">
                    <h4 className={`font-semibold text-sm transition-colors ${
                        isActive ? 'text-gray-100' : 'text-gray-500 line-through decoration-gray-600'
                    }`}>
                        {step.description}
                    </h4>
                    <p className={`text-xs mt-1 font-mono transition-colors flex items-center gap-2 ${isActive ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span className="opacity-50">Tool:</span> {step.tool}
                    </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default AnalysisDashboard;
