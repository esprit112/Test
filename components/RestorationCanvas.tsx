import React, { useRef, useState, useEffect, memo, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group } from 'react-konva';
import useImage from 'use-image';
import { DamageAnalysis } from '../types';
import { ZoomIn, ZoomOut, Maximize, Eye, EyeOff, AlertTriangle, Crosshair } from 'lucide-react';

interface RestorationCanvasProps {
  imageSrc: string;
  analysis: DamageAnalysis | null;
}

const RestorationCanvas: React.FC<RestorationCanvasProps> = memo(({ imageSrc, analysis }) => {
  const [image] = useImage(imageSrc, 'anonymous');
  const stageRef = useRef<any>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [showOverlays, setShowOverlays] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ width, height });
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (image && containerSize.width > 0 && containerSize.height > 0) {
      const scale = Math.min(
        containerSize.width / image.width,
        containerSize.height / image.height
      ) * 0.9; 
      
      setStageScale(scale);
      setStagePos({
        x: (containerSize.width - image.width * scale) / 2,
        y: (containerSize.height - image.height * scale) / 2,
      });
    }
  }, [image, containerSize]);

  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.15;
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    if (newScale < 0.05 || newScale > 20) return;

    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  }, []);

  const handleResetView = useCallback(() => {
    if (image && containerSize.width > 0) {
      const scale = Math.min(
        containerSize.width / image.width,
        containerSize.height / image.height
      ) * 0.9; 
      setStageScale(scale);
      setStagePos({
        x: (containerSize.width - image.width * scale) / 2,
        y: (containerSize.height - image.height * scale) / 2,
      });
    }
  }, [image, containerSize]);

  if (!containerSize.width) return <div ref={containerRef} className="flex-1 w-full h-full bg-black" />;

  return (
    <div className="relative w-full h-full flex flex-col bg-black overflow-hidden group select-none">
      
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-gray-900/40 backdrop-blur-2xl border border-white/5 p-1.5 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 hover:border-white/10">
        <button onClick={() => setStageScale(s => s * 1.2)} className="p-2.5 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={() => setStageScale(s => s / 1.2)} className="p-2.5 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={handleResetView} className="p-2.5 hover:bg-white/5 rounded-xl text-neon-cyan/60 hover:text-neon-cyan transition-colors">
          <Maximize className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-white/5 mx-1"></div>
        <button 
          onClick={() => setShowOverlays(!showOverlays)} 
          className={`p-2.5 rounded-xl transition-all ${showOverlays ? 'bg-neon-cyan/10 text-neon-cyan' : 'hover:bg-white/5 text-gray-500'}`}
        >
          {showOverlays ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      <div ref={containerRef} className="flex-1 w-full h-full">
        <Stage
          width={containerSize.width}
          height={containerSize.height}
          onWheel={handleWheel}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stagePos.x}
          y={stagePos.y}
          draggable
          onDragEnd={(e) => {
            setStagePos({ x: e.target.x(), y: e.target.y() });
          }}
          ref={stageRef}
          className="cursor-crosshair"
        >
          <Layer>
            {image && (
              <KonvaImage 
                image={image} 
                shadowColor="rgba(0,0,0,0.8)"
                shadowBlur={100}
                shadowOpacity={0.8}
                shadowOffsetX={0}
                shadowOffsetY={30}
              />
            )}
          </Layer>
          
          {showOverlays && (
            <Layer>
                {image && analysis && analysis.defects?.map((defect, i) => {
                if (defect.box_2d && defect.box_2d.length === 4) {
                    const [ymin, xmin, ymax, xmax] = defect.box_2d;
                    const x = (xmin / 1000) * image.width;
                    const y = (ymin / 1000) * image.height;
                    const w = ((xmax - xmin) / 1000) * image.width;
                    const h = ((ymax - ymin) / 1000) * image.height;

                    const color = defect.type.toLowerCase().includes('tear') ? '#ff2a6d' : 
                                defect.type.toLowerCase().includes('silver') ? '#0ff0fc' : 
                                defect.type.toLowerCase().includes('foxing') ? '#fbff12' : 
                                '#7b2cff';

                    return (
                    <Group key={i}>
                        <Rect
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        stroke={color}
                        strokeWidth={1.5 / stageScale} 
                        dash={[8, 4]}
                        fill={`${color}08`}
                        />
                        <Rect
                            x={x}
                            y={y - (24 / stageScale)}
                            width={(defect.type.length * 7 + 10) / stageScale}
                            height={24 / stageScale}
                            fill={color}
                        />
                        <Text
                            x={x + (6 / stageScale)}
                            y={y - (18 / stageScale)}
                            text={defect.type.toUpperCase()}
                            fontSize={9 / stageScale}
                            fill="black"
                            fontFamily="JetBrains Mono"
                            fontStyle="bold"
                            letterSpacing={1 / stageScale}
                        />
                    </Group>
                    );
                }
                return null;
                })}
            </Layer>
          )}
        </Stage>
      </div>
      
      <div className="absolute bottom-8 left-8 z-30 flex items-center gap-6 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity duration-700">
          <div className="text-[9px] font-mono text-gray-500 bg-gray-900/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-3">
            <span className="uppercase">Optic Zoom</span>
            <span className="text-white font-bold">{Math.round(stageScale * 100)}%</span>
          </div>
          {showOverlays && analysis?.defects && analysis.defects.length > 0 && (
             <div className="text-[9px] font-mono text-neon-pink bg-gray-900/40 backdrop-blur-xl px-3 py-1.5 rounded-full border border-neon-pink/20 flex items-center gap-2">
                 <AlertTriangle className="w-3.5 h-3.5" /> 
                 <span className="uppercase font-bold">{analysis.defects.length} Pathology Anchors</span>
             </div>
          )}
          <div className="flex items-center gap-2 text-[9px] font-mono text-gray-600 bg-gray-900/20 px-3 py-1.5 rounded-full">
            <Crosshair className="w-3 h-3" />
            <span className="uppercase">Coordinate Space Mapping</span>
          </div>
      </div>
    </div>
  );
});

export default RestorationCanvas;