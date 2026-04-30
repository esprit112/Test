import React, { useState, memo, useCallback } from 'react';
import { MoveHorizontal } from 'lucide-react';

interface ImageSliderProps {
  original: string;
  restored: string;
}

const ImageSlider: React.FC<ImageSliderProps> = memo(({ original, restored }) => {
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  }, []);

  return (
    <div className="relative w-full h-full bg-[#09090b] overflow-hidden select-none flex items-center justify-center">
      
      {/* Background Image (Restored - The "After" state) */}
      <img
        src={restored}
        alt="Restored"
        className="absolute w-full h-full object-contain pointer-events-none"
      />

      {/* Foreground Image (Original - The "Before" state) - Clipped via clip-path */}
      <img
        src={original}
        alt="Original"
        className="absolute w-full h-full object-contain pointer-events-none"
        style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
      />
      
      {/* Label for Original */}
      <div className="absolute top-4 left-4 bg-black/60 text-white text-xs font-mono px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10 shadow-lg pointer-events-none">
        ORIGINAL
      </div>

      {/* Label for Restored */}
      <div className="absolute top-4 right-4 bg-blue-500/20 text-blue-400 text-xs font-mono px-3 py-1.5 rounded-lg backdrop-blur-sm border border-blue-500/30 shadow-lg pointer-events-none">
        RESTORED
      </div>

      {/* The Divider Line */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-blue-500 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#18181b] border-2 border-blue-500 rounded-full flex items-center justify-center shadow-lg pointer-events-none">
            <MoveHorizontal className="w-4 h-4 text-blue-500" />
        </div>
      </div>

      {/* Invisible Range Input for Interaction */}
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPosition}
        onChange={handleSliderChange}
        className="comparison-slider z-40 absolute inset-0 w-full h-full"
      />
    </div>
  );
});

export default ImageSlider;