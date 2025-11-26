import { useState, useRef, ReactNode } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

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

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setScale((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;

    setIsDragging(true);
    setDragMoved(false);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    if (Math.abs(newX - position.x) > 2 || Math.abs(newY - position.y) > 2) {
      setDragMoved(true);
    }

    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    setIsDragging(false);

    if (!dragMoved && allowClick && onCanvasClick) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const adjustedX = (clickX - position.x) / scale;
      const adjustedY = (clickY - position.y) / scale;

      const normalizedX = adjustedX / rect.width;
      const normalizedY = adjustedY / rect.height;

      if (normalizedX >= 0 && normalizedX <= 1 && normalizedY >= 0 && normalizedY <= 1) {
        onCanvasClick(normalizedX, normalizedY);
      }
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="flex-1 relative overflow-hidden bg-gray-900">
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center border border-gray-700 transition-colors shadow-lg"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center border border-gray-700 transition-colors shadow-lg"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={handleReset}
          className="w-10 h-10 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center justify-center border border-gray-700 transition-colors shadow-lg"
          aria-label="Reset zoom"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
      </div>

      <div
        ref={containerRef}
        className={`absolute inset-0 ${allowClick ? 'cursor-crosshair' : 'cursor-grab'} ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          backgroundColor: floorPlanImage ? '#1f2937' : '#374151',
        }}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
            transition: isDragging ? 'none' : 'transform 0.1s',
            pointerEvents: 'none',
          }}
        >
          {floorPlanImage && floorPlanImage.startsWith('data:application/pdf') ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-gray-800 rounded-xl p-8 max-w-md text-center border border-gray-700">
                <p className="text-white text-lg font-semibold mb-2">PDF Floor Plan Detected</p>
                <p className="text-gray-400 text-sm mb-4">
                  For best results with zoom and measurements, please upload your floor plan as an image (PNG or JPG) instead of PDF.
                </p>
                <p className="text-gray-500 text-xs">
                  You can convert PDFs to images using online tools or screenshot software.
                </p>
              </div>
            </div>
          ) : floorPlanImage ? (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${floorPlanImage})`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
              }}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px',
              }}
            />
          )}

          {children}
        </div>
      </div>
    </div>
  );
}
