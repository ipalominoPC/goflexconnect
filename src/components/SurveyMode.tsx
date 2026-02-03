import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Crosshair, Wifi, Radio as RadioIcon, Trash2, Database, AlertTriangle, Activity } from 'lucide-react';
import { useStore } from '../store/useStore';
import { startSignalMonitoring, getCellularSignal } from '../services/cellularSignalService';
import { requestLocationPermissions } from '../services/deviceService';
import { Measurement } from '../types';
import ZoomableFloorPlan from './ZoomableFloorPlan';
import { generateUUID } from '../utils/uuid';
import { getSignalQuality } from '../utils/qualityUtils';

const RFSparkline = ({ data, color, min, max }: { data: number[], color: string, min: number, max: number }) => {
  if (!data || data.length < 2) return <div className="h-4 w-full bg-slate-800/20 rounded mt-1" />;
  const width = 100;
  const height = 20;
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const normalized = Math.min(Math.max((val - min) / (max - min), 0), 1);
    const y = height - (normalized * height);
    return `${x},${y}`;
  }).join(' ');
  return (
    <div className="h-6 w-full opacity-90 mt-1">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
      </svg>
    </div>
  );
};

export default function SurveyMode({ projectId, floorId, onBack }: any) {
  // LINK TO CURRENT SIGNAL IN STORE
  const { projects, floors, measurements: allMs, addMeasurement, deleteMeasurement, settings, currentSignal } = useStore();

  const project = projects.find((p) => p.id === projectId);
  const floor = floors.find((f) => f.id === floorId);
  const mapImage = floor?.image_data || floor?.floorPlanImage || project?.floorPlanImage;

  const measurements = (allMs || []).filter((m) => (m.floorId === floorId || m.floor_id === floorId) && m.projectId === projectId);

  const [cursorPosition, setCursorPosition] = useState({ x: 0.5, y: 0.5 });
  const [isCapturing, setIsCapturing] = useState(false);
  const [activeCarrier, setActiveCarrier] = useState<'T-Mobile' | 'Verizon' | 'AT&T'>('T-Mobile');
  const [signalHistory, setSignalHistory] = useState<{rsrp: number[], rsrq: number[], snr: number[]}>({ rsrp: [], rsrq: [], snr: [] });
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // 1. HYBRID DRIVE: Wake up Modem Bridge + High-Intensity Heartbeat
  useEffect(() => {
    requestLocationPermissions();
    const stopMonitoring = startSignalMonitoring();
    
    // 1.5s Heartbeat to ensure UI is snappy even if the listener is quiet
    const heartbeat = setInterval(async () => {
      const liveData = await getCellularSignal();
      if (liveData && liveData.carrier !== 'ERROR') {
        useStore.setState({ 
          currentSignal: {
            ...liveData,
            sinr: (liveData as any).sinr ?? -10,
            technology: (liveData as any).technology ?? 'LTE'
          }
        });
      }
    }, 1500);

    return () => {
      stopMonitoring();
      clearInterval(heartbeat);
    };
  }, []);

  // 2. HISTORY TRACKING: Sync sparklines with store
  useEffect(() => {
    if (currentSignal) {
      setSignalHistory(prev => ({
        rsrp: [...(prev.rsrp || []), Number(currentSignal.rsrp) || -140].slice(-30),
        rsrq: [...(prev.rsrq || []), Number(currentSignal.rsrq) || -20].slice(-30),
        snr: [...(prev.snr || []), Number(currentSignal.sinr) || -10].slice(-30),
      }));
    }
  }, [currentSignal]);

  if (!project || !floor) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-center">
        <AlertTriangle size={64} className="text-red-500 mb-4 animate-pulse" />
        <h2 className="text-xl font-black text-white uppercase mb-2">Data Link Severed</h2>
        <button onClick={onBack} className="w-full py-4 bg-[#27AAE1] text-black font-black rounded-2xl uppercase">Return to Mission Control</button>
      </div>
    );
  }

  const handleCaptureSample = async () => {
    if (!mapImage || !currentSignal) return;
    setIsCapturing(true);

    try {
      const measurement: Measurement = {
        id: generateUUID(),
        projectId,
        floorId: floorId || '',
        x: Math.max(0.01, Math.min(0.99, cursorPosition.x)),
        y: Math.max(0.01, Math.min(0.99, cursorPosition.y)),
        locationNumber: measurements.length + 1,
        rsrp: Number(currentSignal.rsrp) || -140,
        rsrq: Number(currentSignal.rsrq) || -20,
        sinr: Number(currentSignal.sinr) || -10,
        carrierName: currentSignal.carrier || activeCarrier,
        timestamp: Date.now(),
      };

      console.log('[SurveyMode] Capturing Real Hardware Data:', measurement);
      addMeasurement(measurement);

    } catch (e) {
      console.error('[SurveyMode] Capture failed:', e);
    }

    setTimeout(() => setIsCapturing(false), 300);
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden text-white z-[1000]">
      {/* HEADER */}
      <div className="shrink-0 bg-slate-900/95 border-b border-white/5 pt-12 pb-3 px-4 z-30 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <button onClick={onBack} className="p-2 text-[#27AAE1] active:opacity-50"><ArrowLeft size={24} /></button>
          
          <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full border border-white/10">
            <div className={`w-1.5 h-1.5 rounded-full ${currentSignal ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">
              {currentSignal ? 'Link Active' : 'Waiting for Modem'}
            </span>
          </div>

          <button onClick={() => measurements.length > 0 && deleteMeasurement(measurements[measurements.length-1].id)} className="p-2 text-red-500 active:scale-90"><Trash2 size={20} /></button>
        </div>

        <div className="bg-black/60 rounded-xl border border-[#27AAE1]/20 p-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-slate-500 font-bold uppercase">RSRP</span>
              <span className="text-sm font-black">{currentSignal?.rsrp ?? "--"}</span>
              <RFSparkline data={signalHistory.rsrp} color="#27AAE1" min={-140} max={-44} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-slate-500 font-bold uppercase">SNR</span>
              <span className="text-sm font-black">{currentSignal?.sinr ?? "--"}</span>
              <RFSparkline data={signalHistory.snr} color="#27AAE1" min={-10} max={30} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[8px] text-slate-500 font-bold uppercase">RSRQ</span>
              <span className="text-sm font-black">{currentSignal?.rsrq ?? "--"}</span>
              <RFSparkline data={signalHistory.rsrq} color="#27AAE1" min={-20} max={-3} />
            </div>
          </div>
        </div>
      </div>

      {/* VIEWPORT */}
      <div className="flex-1 relative bg-black">
        <ZoomableFloorPlan
          floorPlanImage={mapImage}
          allowClick={true}
          onCanvasClick={(x,y) => setCursorPosition({x, y})}
          onLoad={() => setIsMapLoaded(true)}
        >
           {isMapLoaded && measurements.map((m, index) => {
            try {
              const quality = getSignalQuality(m, settings?.thresholds || { rsrp: { good: -90, fair: -110 }, sinr: { good: 10, fair: 0 } });
              return (
                <div key={m.id} className="absolute" style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%`, transform: 'translate(-50%, -50%)' }}>
                   <div className={`w-4 h-4 rounded-full border border-white/50 shadow-lg flex items-center justify-center text-[7px] font-black text-black ${quality.bgColor}`}>
                      {index + 1}
                   </div>
                </div>
              );
            } catch (e) { return null; }
          })}

          <div className="absolute" style={{ left: `${cursorPosition.x * 100}%`, top: `${cursorPosition.y * 100}%`, transform: 'translate(-50%, -50%)' }}>
             <Crosshair className="w-5 h-5 text-[#27AAE1] drop-shadow-[0_0_8px_#27AAE1]" strokeWidth={2} />
          </div>
        </ZoomableFloorPlan>

        <div className="absolute top-6 left-6 p-3 bg-black/80 backdrop-blur-md rounded-2xl border border-[#27AAE1]/30 shadow-2xl z-40">
           <div className="flex items-center gap-2">
             <Database size={14} className="text-[#27AAE1]" />
             <span className="text-xs font-black text-white">{measurements.length} <span className="text-[#27AAE1] opacity-60 uppercase font-bold text-[9px]">Captures</span></span>
           </div>
        </div>
      </div>

      {/* CAPTURE BUTTON AREA */}
      <div className="shrink-0 p-4 bg-slate-900 border-t border-white/5 pb-12">
        <div className="mb-3 p-4 bg-yellow-500/10 border border-yellow-500/40 rounded-2xl">
          <div className="flex items-center justify-between mb-1">
             <span className="text-[9px] font-black text-yellow-500 uppercase tracking-tighter">Hardware Telemetry Stream</span>
             <Activity size={10} className="text-yellow-500 animate-pulse" />
          </div>
          <div className="flex justify-between items-end">
             <p className="text-xs font-mono text-white">
                RSRP: <span className="text-yellow-400 font-bold">{currentSignal?.rsrp ?? 'NULL'}</span> | 
                SINR: <span className="text-yellow-400 font-bold">{currentSignal?.sinr ?? 'NULL'}</span>
             </p>
             <p className="text-[8px] font-mono text-slate-500">{currentSignal?.carrier || 'SCANNING'}</p>
          </div>
        </div>

        <button 
          onClick={handleCaptureSample} 
          disabled={isCapturing || !mapImage || !currentSignal} 
          className="w-full py-5 bg-[#27AAE1] text-black rounded-2xl font-black text-lg active:scale-95 transition-all shadow-[0_10px_30px_rgba(39,170,225,0.3)] disabled:opacity-50 disabled:grayscale"
        >
          {isCapturing ? 'ACQUIRING DATA...' : 'CAPTURE SITE SAMPLE'}
        </button>
      </div>
    </div>
  );
}