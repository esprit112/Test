import React, { memo } from 'react';

interface ComparisonViewProps {
  original: string;
  restored: string;
}

const ComparisonView: React.FC<ComparisonViewProps> = memo(({ original, restored }) => {
  return (
    <div className="flex h-full w-full bg-gray-950 p-6 gap-6 select-none">
      
      {/* Left Panel: Original */}
      <div className="flex-1 flex flex-col relative group">
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-start p-4 pointer-events-none">
            <span className="bg-black/70 text-gray-300 px-3 py-1 rounded-full text-xs font-mono border border-gray-700 backdrop-blur-md">
                Original (Reference)
            </span>
        </div>
        
        <div className="flex-1 bg-gray-900/50 rounded-xl border border-gray-800 overflow-hidden relative shadow-inner">
            <div className="absolute inset-0 opacity-20" 
                 style={{ 
                     backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
                     backgroundSize: '20px 20px',
                     backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                 }} 
            />
            
            <img 
                src={original} 
                className="absolute inset-0 w-full h-full object-contain p-4 transition-transform duration-500 hover:scale-[1.02]"
                alt="Original Scan"
            />
        </div>
      </div>

      {/* Right Panel: Restored */}
      <div className="flex-1 flex flex-col relative group">
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-start p-4 pointer-events-none">
            <span className="bg-neon-cyan/20 text-neon-cyan px-3 py-1 rounded-full text-xs font-mono border border-neon-cyan/50 backdrop-blur-md shadow-[0_0_15px_rgba(15,240,252,0.4)]">
                Nano Banana Pro (Restored)
            </span>
        </div>

        <div className="flex-1 bg-gray-900/50 rounded-xl border border-neon-cyan/30 overflow-hidden relative shadow-inner">
             <div className="absolute inset-0 opacity-20" 
                 style={{ 
                     backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)',
                     backgroundSize: '20px 20px',
                     backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                 }} 
            />

            <img 
                src={restored} 
                className="absolute inset-0 w-full h-full object-contain p-4 transition-transform duration-500 hover:scale-[1.02]"
                alt="Restored Result"
            />
        </div>
      </div>

    </div>
  );
});

export default ComparisonView;