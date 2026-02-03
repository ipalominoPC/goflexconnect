import { useState, useEffect } from 'react';
import { ArrowLeft, Radio, Navigation, Compass as CompassIcon, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { getNearbyCellTowers, CellTowerWithDistance } from '../services/openCelliDService';

interface CellTowerCompassProps {
  onBack: () => void;
}

export default function CellTowerCompass({ onBack }: CellTowerCompassProps) {
  const [heading, setHeading] = useState(0);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [towers, setTowers] = useState<CellTowerWithDistance[]>([]);
  const [selectedTower, setSelectedTower] = useState<string | null>(null);
  const [compassSupported, setCompassSupported] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [radius, setRadius] = useState(5);

  useEffect(() => {
    if ('DeviceOrientationEvent' in window) {
      const handleOrientation = (e: DeviceOrientationEvent) => {
        if (e.alpha !== null) setHeading(360 - e.alpha);
      };
      window.addEventListener('deviceorientation', handleOrientation);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    } else {
      setCompassSupported(false);
    }
  }, []);

  const loadTowers = async (lat: number, lon: number, searchRadius: number) => {
    setLoading(true);
    setError(null);
    try {
      const nearbyTowers = await getNearbyCellTowers(lat, lon, searchRadius);
      if (nearbyTowers.length === 0) {
        setError('No nodes detected. Expand radius.');
      } else {
        setTowers(nearbyTowers);
        setSelectedTower(nearbyTowers[0].cellId);
      }
    } catch (err) {
      setError('Telemetry Link Offline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const { latitude: lat, longitude: lon } = p.coords;
          setLocation({ lat, lon });
          loadTowers(lat, lon, radius);
        },
        () => { setError('GPS Lock Failed.'); setLoading(false); }
      );
    }
  }, []);

  const selected = towers.find(t => t.cellId === selectedTower);
  const relativeBearing = selected ? (selected.bearing - heading + 360) % 360 : 0;

  return (
    <div className="fixed inset-0 bg-black text-white z-[1000] flex flex-col overflow-hidden font-inter">
      <div className="shrink-0 bg-slate-950 border-b-2 border-[#27AAE1] pt-12 pb-5 px-6 z-30 shadow-[0_0_40px_rgba(39,170,225,0.3)]">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-3 text-[#27AAE1] border-2 border-[#27AAE1]/50 rounded-2xl bg-black active:scale-90 transition-all"><ArrowLeft size={28} /></button>
          <div className="text-center">
            <h1 className="text-lg font-black tracking-widest italic text-white leading-none uppercase">Tower Compass</h1>
            <p className="text-[10px] font-black text-[#27AAE1] uppercase tracking-[0.3em] mt-1">Infrastructure HUD</p>
          </div>
          <button onClick={() => location && loadTowers(location.lat, location.lon, radius)} className="p-3 text-[#27AAE1] bg-black rounded-2xl border-2 border-[#27AAE1]/50"><RefreshCw size={24} className={loading ? 'animate-spin' : ''} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-10 pb-32">
        <div className="max-w-md mx-auto space-y-10">
          <div className="relative w-80 h-80 mx-auto">
             <div className="absolute inset-0 rounded-full border-4 border-[#27AAE1]/40 shadow-[0_0_60px_rgba(39,170,225,0.2)] bg-slate-900" />
             <div className="absolute inset-0 transition-transform duration-500 ease-out" style={{ transform: `rotate(${-heading}deg)` }}>
                <span className="absolute top-4 left-1/2 -translate-x-1/2 text-red-500 font-black text-3xl drop-shadow-[0_0_15px_red]">N</span>
                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white font-black text-2xl">S</span>
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-black text-2xl">W</span>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white font-black text-2xl">E</span>

                {towers.map((tower) => {
                  const x = Math.sin((tower.bearing * Math.PI) / 180) * 130;
                  const y = -Math.cos((tower.bearing * Math.PI) / 180) * 130;
                  return (
                    <button
                      key={tower.cellId}
                      className={`absolute left-1/2 top-1/2 w-9 h-9 -ml-4.5 -mt-4.5 rounded-full flex items-center justify-center border-2 transition-all ${selectedTower === tower.cellId ? 'bg-[#27AAE1] border-white scale-125 shadow-[0_0_30px_#27AAE1]' : 'bg-black border-[#27AAE1]/60 opacity-60'}`}
                      style={{ transform: `translate(${x}px, ${y}px)` }}
                      onClick={() => setSelectedTower(tower.cellId)}
                    >
                      <Radio size={16} className={selectedTower === tower.cellId ? 'text-black font-black' : 'text-[#27AAE1]'} />
                    </button>
                  );
                })}
             </div>

             {selected && (
               <div className="absolute inset-0 transition-transform duration-500" style={{ transform: `rotate(${relativeBearing}deg)` }}>
                  <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 w-1.5 h-36 bg-gradient-to-t from-[#27AAE1] to-transparent shadow-[0_0_20px_#27AAE1]" />
                  <Navigation className="absolute top-0 left-1/2 -translate-x-1/2 text-[#27AAE1] drop-shadow-[0_0_15px_#27AAE1]" size={36} />
               </div>
             )}

             <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black border-4 border-[#27AAE1] rounded-full w-28 h-28 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(39,170,225,0.4)]">
                   <span className="text-4xl font-black italic text-white">{Math.round(heading)}°</span>
                   <span className="text-[10px] font-black text-[#27AAE1] uppercase tracking-widest mt-1">Heading</span>
                </div>
             </div>
          </div>

          <div className="bg-slate-900 border-2 border-[#27AAE1]/60 rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
               <span className="text-xs font-black text-white uppercase tracking-widest italic">Scan Radius</span>
               <span className="text-2xl font-black text-[#27AAE1]">{radius}km</span>
            </div>
            <input type="range" min="1" max="25" value={radius} onChange={(e) => { setRadius(Number(e.target.value)); if(location) loadTowers(location.lat, location.lon, Number(e.target.value)); }} className="w-full h-4 bg-black rounded-full appearance-none cursor-pointer accent-[#27AAE1]" />
          </div>

          <div className="space-y-5">
             {loading ? (
               <div className="flex flex-col items-center py-12 gap-5"><Loader2 className="animate-spin text-[#27AAE1]" size={56} /><p className="text-sm font-black uppercase text-[#27AAE1] tracking-[0.2em]">Syncing Mission Nodes...</p></div>
             ) : towers.map((tower) => (
               <button key={tower.cellId} onClick={() => setSelectedTower(tower.cellId)} className={`w-full p-6 rounded-[2.5rem] border-2 transition-all text-left flex items-center justify-between ${selectedTower === tower.cellId ? 'bg-[#27AAE1]/40 border-[#27AAE1] shadow-[0_0_40px_rgba(39,170,225,0.3)]' : 'bg-slate-950 border-white/30'}`}>
                  <div>
                    <p className="text-2xl font-black text-white italic uppercase leading-none">{tower.operator}</p>
                    <p className="text-xs text-[#27AAE1] mt-3 font-black uppercase tracking-tight">{tower.radio} • CID {tower.cellId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black italic text-[#27AAE1]">{tower.distance.toFixed(2)}km</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Range</p>
                  </div>
               </button>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
