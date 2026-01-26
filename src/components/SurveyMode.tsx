import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Crosshair, Wifi, MapPin, Radio as RadioIcon, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getCellularSignal, watchCellularSignal, clearSignalWatch } from '../services/cellularSignalService';
import { getCurrentLocation, watchLocation, clearLocationWatch, requestLocationPermissions } from '../services/deviceService';
import { Measurement } from '../types';
import ZoomableFloorPlan from './ZoomableFloorPlan';
import { generateUUID } from '../utils/uuid';
import { getSignalQuality } from '../utils/qualityUtils';
import { trackUsageEvent } from '../services/usageTracking';

const getCarrierLogo = (carrier: string | null) => {
  if (!carrier) return null;
  const name = carrier.toLowerCase();
  if (name.includes('verizon')) return <span className="bg-red-600 text-white px-1.5 rounded font-black text-[10px] mr-1">VZ</span>;
  if (name.includes('at&t') || name.includes('at & t')) return <span className="bg-blue-500 text-white px-1.5 rounded font-black text-[10px] mr-1">ATT</span>;
  if (name.includes('t-mobile') || name.includes('tmobile')) return <span className="bg-[#E20074] text-white px-1.5 rounded font-black text-[10px] mr-1">T-MO</span>;
  return <span className="text-[#27AAE1] font-bold mr-1">{carrier}</span>;
};

interface SurveyModeProps {
  projectId: string;
  floorId?: string;
  onBack: () => void;
}

export default function SurveyMode({ projectId, floorId, onBack }: SurveyModeProps) {
  const { projects, floors, measurements: allMeasurements, addMeasurement, settings, user } = useStore();
  const project = projects.find((p) => p.id === projectId);
  const floor = floorId ? floors.find((f) => f.id === floorId) : undefined;
  const mapImage = floor?.floorPlanImage || project?.floorPlanImage;

  const measurements = floorId
    ? allMeasurements.filter((m) => m.floorId === floorId)
    : allMeasurements.filter((m) => m.projectId === projectId && !m.floorId);

  const [cursorPosition, setCursorPosition] = useState({ x: 0.5, y: 0.5 });
  const [isCapturing, setIsCapturing] = useState(false);
  const [liveSignal, setLiveSignal] = useState<any>(null);
  const [liveLocation, setLiveLocation] = useState<any>(null);
  const timeoutRef = useRef<number | null>(null);

  const isWifi = liveSignal?.networkType === "wifi" || (navigator as any).connection?.type === "wifi";

  useEffect(() => {
    const wakeUpGps = navigator.geolocation.watchPosition(() => {}, () => {}, { enableHighAccuracy: true });
    requestLocationPermissions();
    const sigId = watchCellularSignal((s) => setLiveSignal(s), 1000);
    const locId = watchLocation((l) => setLiveLocation(l));
    return () => {
      navigator.geolocation.clearWatch(wakeUpGps);
      clearSignalWatch(sigId);
      if (locId) clearLocationWatch(locId);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCaptureSample = async () => {
    // Only allow capture if floorplan exists
    if (!mapImage) return;
    
    setIsCapturing(true);
    const signalData = liveSignal || await getCellularSignal();
    const location = liveLocation || await getCurrentLocation().catch(() => null);

    const measurement: Measurement = {
      id: generateUUID(),
      projectId,
      floorId: floorId || '',
      x: cursorPosition.x,
      y: cursorPosition.y,
      locationNumber: measurements.length + 1,
      rsrp: signalData.rsrp || 0,
      rsrq: signalData.rsrq || 0,
      sinr: signalData.sinr || 0,
      rssi: signalData.rssi || 0,
      latitude: location?.latitude,
      longitude: location?.longitude,
      techType: signalData.networkType || 'LTE',
      cellId: signalData.cellId || 'N/A',
      carrierName: signalData.carrierName || 'N/A',
      band: signalData.band,
      timestamp: Date.now(),
    };

    addMeasurement(measurement);
    setTimeout(() => setIsCapturing(false), 300);
  };

  if (!project) return null;

  return (
    <div className="fixed inset-0 bg-[#0F172A] flex flex-col overflow-hidden text-white font-sans">
      {/* COMPACT HEADER */}
      <div className="shrink-0 bg-slate-900 border-b border-white/10 pt-12 pb-3 px-4 z-30">
        <div className="flex items-center justify-between mb-2">
          <button onClick={onBack} className="p-1 -ml-1 text-slate-400 active:text-[#27AAE1]">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black bg-[#27AAE1]/10 text-[#27AAE1] px-2.5 py-0.5 rounded-full border border-[#27AAE1]/20">
              {measurements.length} SAMPLES
            </span>
          </div>
        </div>

        {isWifi && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-md p-1.5 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-orange-200 text-[9px] font-bold uppercase tracking-tighter">Disable Wi-Fi for RF Accuracy</span>
          </div>
        )}

        {/* COMPACT RF DASHBOARD */}
        <div className="bg-slate-800/40 rounded-lg border border-white/10 p-2.5 shadow-sm">
          <div className="grid grid-cols-12 gap-2 items-center">
            {/* Cell Info (5 columns) */}
            <div className="col-span-5 border-r border-white/5 pr-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Wifi className="w-3.5 h-3.5 text-[#27AAE1]" />
                <span className="text-[13px] font-black italic tracking-tight">{getCarrierLogo(liveSignal?.carrier || "SEARCH")} {liveSignal?.networkType || ""}</span>
                <span className="text-[10px] bg-[#27AAE1] px-1.5 py-0.5 rounded text-white font-bold">{liveSignal?.band || "---"}</span>
              </div>
              <div className="space-y-1 text-[11px] font-mono text-slate-300">
                <div>RSRP: <span className="text-white font-bold">{liveSignal?.rsrp || "--"}</span></div>
                <div>RSRQ: <span className="text-white font-bold">{liveSignal?.rsrq || "--"}</span></div>
                <div>RSSI: <span className="text-white font-bold">{liveSignal?.rssi || "--"}</span></div>
                <div>SINR: <span className="text-white font-bold">{liveSignal?.sinr || "--"}</span></div>
                <div className="text-[10px]">CID: <span className="text-[#27AAE1] font-bold">{liveSignal?.cellId || "--"}</span></div>
              </div>
            </div>

            {/* GPS Info (7 columns) */}
            <div className="col-span-7 pl-2 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-green-500 mb-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">GPS LOCK</span>
              </div>
              <div className="text-[11px] font-mono font-medium text-slate-300 flex justify-between gap-2">
                <span>LAT: {liveSignal?.latitude ? liveSignal.latitude.toFixed(5) : "0.00000"}</span>
                <span>LNG: {liveSignal?.longitude ? liveSignal.longitude.toFixed(5) : "0.00000"}</span>
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-tighter flex justify-between">
                <span>Acc: ±{liveSignal?.accuracy?.toFixed(1) || "0"}m</span>
                <span>Alt: {liveSignal?.altitude?.toFixed(1) || "0"}m</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAXIMIZED MAP AREA WITH GLOW */}
      <div className="flex-1 relative z-10 bg-slate-950 overflow-hidden p-2">
        <div className="w-full h-full rounded-xl border-2 border-[#27AAE1]/30 shadow-2xl shadow-[#27AAE1]/20 overflow-hidden">
          <ZoomableFloorPlan
            floorPlanImage={mapImage}
            allowClick={!!mapImage}
            onCanvasClick={(x,y) => { 
              // Only allow crosshair placement if floorplan exists
              if (!mapImage) return;
              // Constrain crosshair to map boundaries
              const clampedX = Math.max(0.01, Math.min(0.99, x));
              const clampedY = Math.max(0.01, Math.min(0.99, y));
              setCursorPosition({x: clampedX, y: clampedY}); 
            }}
          >
            {measurements.map((m, index) => {
              const quality = getSignalQuality(m, settings.thresholds);
              return (
                <div
                  key={m.id}
                  className={`absolute w-2 h-2 rounded-full border border-white shadow-sm ${quality.bgColor}`}
                  style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%`, transform: 'translate(-50%, -50%)' }}
                />
              );
            })}
            {/* Only show crosshair if floorplan exists */}
            {mapImage && (
              <div className="absolute" style={{ left: `${cursorPosition.x * 100}%`, top: `${cursorPosition.y * 100}%`, transform: 'translate(-50%, -50%)' }}>
                <Crosshair className="w-8 h-8 text-yellow-400 drop-shadow-lg opacity-90" />
              </div>
            )}
          </ZoomableFloorPlan>
        </div>
      </div>

      {/* SLIM ACTION FOOTER */}
      <div className="shrink-0 p-3 bg-slate-900 border-t border-white/5 pb-6">
        <button
          onClick={handleCaptureSample}
          disabled={isCapturing || !mapImage}
          className={`w-full py-3.5 ${!mapImage ? 'bg-slate-700 cursor-not-allowed' : 'bg-[#27AAE1] active:bg-[#1C82AD]'} text-white rounded-xl font-black text-base shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]`}
        >
          <RadioIcon className="w-5 h-5" />
          {!mapImage ? 'UPLOAD FLOORPLAN FIRST' : isCapturing ? 'LOGGING...' : 'CAPTURE SAMPLE'}
        </button>
      </div>
    </div>
  );
}
