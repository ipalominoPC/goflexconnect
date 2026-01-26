import { Cloud, BarChart3, Settings, Shield, Plus, Activity, Compass, LayoutDashboard } from 'lucide-react';
import { useStore } from '../store/useStore';

interface MenuProps {
  onSelectFeature: (feature: string) => void;
  onSettings: () => void;
  onFinish: () => void;
}

export default function Menu({ onSelectFeature, onSettings, onFinish }: MenuProps) {
  const user = useStore((state) => state.user);
  const isAdmin = user?.email?.includes('admin') || user?.email?.includes('palomino');

  return (
    <div className="min-h-screen bg-black text-white p-6 pt-12">
      <div className="flex flex-col items-center mb-10">
        <div className="mb-4 p-1 bg-[#27AAE1]/10 rounded-[28px] shadow-[0_0_20px_rgba(39,170,225,0.4)] border border-[#27AAE1]/20">
          <img src="/icons/logo-128.png" alt="GoFlexConnect" className="w-20 h-20 rounded-[24px] shadow-[0_0_10px_rgba(39,170,225,0.6)]" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">GoFlexConnect</h1>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Select a feature to get started</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Projects Card with Glow */}
        <button onClick={() => onSelectFeature('projects')} className="bg-slate-900 border border-[#27AAE1]/20 p-6 rounded-2xl flex flex-col items-center gap-3 active:scale-95 transition-all shadow-[0_0_10px_rgba(39,170,225,0.1)] hover:shadow-[0_0_15px_rgba(39,170,225,0.3)]">
          <LayoutDashboard className="w-8 h-8 text-[#27AAE1] drop-shadow-[0_0_5px_rgba(39,170,225,0.5)]" />
          <span className="text-xs font-bold uppercase">Projects</span>
        </button>
        
        <button onClick={() => onSelectFeature('speedTest')} className="bg-slate-900 border border-white/5 p-6 rounded-2xl flex flex-col items-center gap-3 active:scale-95 transition-all">
          <Activity className="w-8 h-8 text-green-500" />
          <span className="text-xs font-bold uppercase">Speed Test</span>
        </button>

        <button onClick={() => onSelectFeature('cellTowerCompass')} className="bg-slate-900 border border-white/5 p-6 rounded-2xl flex flex-col items-center gap-3 active:scale-95 transition-all">
          <Compass className="w-8 h-8 text-orange-500" />
          <span className="text-xs font-bold uppercase">Compass</span>
        </button>

        <button onClick={onSettings} className="bg-slate-900 border border-white/5 p-6 rounded-2xl flex flex-col items-center gap-3 active:scale-95 transition-all">
          <Settings className="w-8 h-8 text-slate-400" />
          <span className="text-xs font-bold uppercase">Settings</span>
        </button>
      </div>
    </div>
  );
}
