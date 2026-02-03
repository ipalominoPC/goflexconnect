import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Layers, Info } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getMetricValue, getIBwaveColor } from '../utils/calculations';
import { MetricType } from '../types';
import ZoomableFloorPlan from './ZoomableFloorPlan';

export default function HeatmapView({ projectId, floorId, onBack }: any) {
  const { projects, floors, measurements: allMs } = useStore();
  const project = projects.find((p) => p.id === projectId);
  const floor = floors.find((f) => f.id === floorId) || floors.find(f => f.project_id === projectId);
  const mapImage = floor?.image_data || floor?.floorPlanImage || project?.floorPlanImage;

  const [viewMode, setViewMode] = useState<'heatmap' | 'points'>('heatmap');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const measurements = floorId
    ? allMs.filter((m) => m.floorId === floorId || m.floor_id === floorId)
    : allMs.filter((m) => m.projectId === projectId);

  useEffect(() => {
    if (!canvasRef.current || measurements.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // 1. CLEAR CANVAS
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 2. TRUTH CLOUD PARAMETERS
    const radius = 320; 
    const gridSize = 4; // Grid for logic, Blur will hide the squares
    const sigma = radius / 2.5; // Gaussian standard deviation

    // 3. GENERATE RAW DATA GRID
    for (let x = 0; x < canvas.width; x += gridSize) {
      for (let y = 0; y < canvas.height; y += gridSize) {
        let weightedSum = 0;
        let totalWeight = 0;
        let foundAny = false;

        measurements.forEach((m) => {
          const dx = x - (m.x * canvas.width);
          const dy = y - (m.y * canvas.height);
          const distSq = dx * dx + dy * dy;

          if (distSq < radius * radius) {
            // GAUSSIAN WEIGHT: This creates the "Cloud" distribution
            const weight = Math.exp(-distSq / (2 * sigma * sigma));
            weightedSum += getMetricValue(m, 'rsrp') * weight;
            totalWeight += weight;
            foundAny = true;
          }
        });

        if (foundAny && totalWeight > 0.001) {
          const val = weightedSum / totalWeight;
          ctx.fillStyle = getIBwaveColor(val);
          // Opacity fade at the edges of the cloud
          ctx.globalAlpha = Math.min(totalWeight * 0.8, 0.9);
          ctx.fillRect(x, y, gridSize, gridSize);
        }
      }
    }

    // 4. THE iBWAVE SECRET SAUCE: MULTI-PASS SMOOTHING
    // This removes the "Lines" and "Squares" and turns them into clouds.
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    
    tempCtx.filter = 'blur(12px) contrast(1.1)'; // Heavy feathering
    tempCtx.drawImage(canvas, 0, 0);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;
    ctx.drawImage(tempCanvas, 0, 0);

  }, [measurements, viewMode]);

  if (!project) return null;

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden text-white z-[1000]">
      <div className="shrink-0 bg-[#1A1C1E] border-b border-white/10 pt-12 pb-4 px-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-2 text-slate-400 hover:text-[#27AAE1] active:scale-90 transition-all"><ArrowLeft size={22} /></button>
          <div className="text-center">
             <h2 className="text-[10px] font-black text-[#27AAE1] uppercase tracking-[0.3em] mb-0.5">RF Simulation</h2>
             <h1 className="text-sm font-bold text-white uppercase tracking-tight">{project.name}</h1>
          </div>
          <button className="p-2 text-slate-400" onClick={() => setViewMode(viewMode === 'heatmap' ? 'points' : 'heatmap')}>
            <Layers size={20} className={viewMode === 'points' ? 'text-[#27AAE1]' : ''} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-[#0D0F11]">
        <ZoomableFloorPlan floorPlanImage={mapImage}>
           <div className="absolute inset-0 pointer-events-none" style={{ mixBlendMode: 'multiply', opacity: viewMode === 'heatmap' ? 0.9 : 0, transition: 'opacity 0.4s ease' }}>
             <canvas ref={canvasRef} width={1000} height={1000} className="w-full h-full" />
           </div>
           
           {viewMode === 'points' && measurements.map((m, index) => (
            <div key={m.id} className="absolute" style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%`, transform: 'translate(-50%, -50%)' }}>
               <div className={`w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black text-black shadow-lg`} style={{ backgroundColor: getIBwaveColor(m.rsrp) }}>
                 {index + 1}
               </div>
            </div>
          ))}
        </ZoomableFloorPlan>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/80 backdrop-blur-xl border border-[#27AAE1]/30 rounded-full shadow-2xl flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
        <span className="text-[10px] font-black text-white uppercase tracking-widest italic">iBwave Mesh v3.0 Active</span>
      </div>
    </div>
  );
}