import React from 'react';
import { TrustLevel } from '../types';

interface TrustPyramidProps {
  currentLevel: TrustLevel;
}

const TrustPyramid: React.FC<TrustPyramidProps> = ({ currentLevel }) => {
  const levels = [
    { level: TrustLevel.RECONSTRUCTION, color: 'bg-purple-600', label: 'AI Reconstruction (Low Trust)' },
    { level: TrustLevel.RESTORATION, color: 'bg-blue-500', label: 'Restoration (Medium Trust)' },
    { level: TrustLevel.CONSERVATION, color: 'bg-green-500', label: 'Conservation (High Trust)' },
    { level: TrustLevel.FOUNDATION, color: 'bg-gray-500', label: 'Original Scan (Source of Truth)' },
  ];

  return (
    <div className="absolute bottom-6 left-6 z-10 bg-gray-900/90 backdrop-blur-sm p-4 rounded-xl border border-gray-700 shadow-2xl max-w-xs">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Image Trust Pyramid</h4>
      <div className="flex flex-col gap-1">
        {levels.map((lvl) => {
          const isActive = lvl.level === currentLevel;
          return (
            <div 
              key={lvl.label} 
              className={`text-xs px-2 py-1.5 rounded flex items-center gap-2 transition-all ${
                isActive ? 'bg-gray-800 text-white font-semibold shadow-inner' : 'text-gray-600'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isActive ? lvl.color : 'bg-gray-700'}`} />
              {lvl.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrustPyramid;