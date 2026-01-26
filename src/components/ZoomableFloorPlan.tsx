import { useState, useRef, ReactNode } from 'react';
import { ZoomIn, ZoomOut, RefreshCcw } from 'lucide-react';

interface ZoomableFloorPlanProps {
  children: ReactNode;
  floorPlanImage?: string;
  allowClick?: boolean;
  onCanvasClick?: (x: number, y: number) => void;
}

export default function ZoomableFloorPlan({
  children,
  floorPlanImage,
  allowClick = false,
  onCanvasClick,
}: ZoomableFloorPlanProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragMoved, setDragMoved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialScale, setInitialScale] = useState(1);
  const [lastTouchEnd, setLastTouchEnd] = useState(0);

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleInteractionEnd = (clientX: number, clientY: number) => {
    if (!dragMoved && allowClick && onCanvasClick && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      
      // Precision math: Map click to 0.0 - 1.0 within the visible image pixels
      const x = (clientX - rect.left) / rect.width;
      const y = (clientY - rect.top) / rect.height;

      // HARD LOCK: Only trigger if the click is physically on the floor plan pixels
      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        onCanvasClick(x, y);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      setInitialPinchDistance(Math.sqrt(dx * dx + dy * dy));
      setInitialScale(scale);
      setDragMoved(true);
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setDragMoved(false);
      setDragStart({ x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && initialPinchDistance !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      setScale(Math.max(1, Math.min(8, initialScale * (currentDistance / initialPinchDistance))));
    } else if (e.touches.length === 1 && isDragging) {
      setDragMoved(true);
      setPosition({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y });
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-black touch-none flex items-center justify-center" ref={containerRef}>
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-3">
        <button onClick={(e) => { e.stopPropagation(); setScale(s => Math.min(s + 1, 8)); }} className="w-12 h-12 bg-slate-800/90 text-white rounded-xl border border-white/20 flex items-center justify-center shadow-2xl active:bg-[#27AAE1]"><ZoomIn className="w-6 h-6" /></button>
        <button onClick={(e) => { e.stopPropagation(); setScale(s => Math.max(s - 1, 1)); }} className="w-12 h-12 bg-slate-800/90 text-white rounded-xl border border-white/20 flex items-center justify-center shadow-2xl active:bg-[#27AAE1]"><ZoomOut className="w-6 h-6" /></button>
        <button onClick={(e) => { e.stopPropagation(); handleReset(); }} className="w-12 h-14 bg-[#27AAE1] text-white rounded-xl border border-[#27AAE1]/50 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(39,170,225,0.4)] active:scale-95 transition-all">
          <RefreshCcw className="w-5 h-5 mb-0.5" />
          <span className="text-[8px] font-black">RESET</span>
        </button>
      </div>

      <div
        className="relative flex items-center justify-center"
        onMouseDown={(e) => { if(e.button === 0) { setIsDragging(true); setDragMoved(false); setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y }); }}}
        onMouseMove={(e) => { if(isDragging) { setDragMoved(true); setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); }}}
        onMouseUp={(e) => { setIsDragging(false); handleInteractionEnd(e.clientX, e.clientY); }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={(e) => {
          if (e.touches.length === 0) {
            setInitialPinchDistance(null);
            if (e.changedTouches.length === 1) {
              const now = Date.now();
              if (now - lastTouchEnd > 300) {
                handleInteractionEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
              }
              setLastTouchEnd(now);
            }
            setIsDragging(false);
          }
        }}
        style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, width: '100%', height: '100%' }}
      >
        {floorPlanImage ? (
          <img
            ref={imageRef}
            src={floorPlanImage}
            className="max-w-full max-h-full object-contain pointer-events-none select-none shadow-2xl"
            alt="Map"
            draggable={false}
          />
        ) : (
          <div className="p-20 bg-slate-900 rounded-3xl border-2 border-dashed border-white/5 text-slate-700 font-black uppercase text-xs">No Floor Plan</div>
        )}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* This ensures dots and crosshairs stay relative to the image size */}
            <div style={{ 
                width: imageRef.current?.clientWidth || '100%', 
                height: imageRef.current?.clientHeight || '100%',
                position: 'relative' 
            }}>
                {children}
            </div>
        </div>
      </div>
    </div>
  );
}
