import { Cloud, Settings, Shield, Activity, Compass, LayoutDashboard, Radio } from 'lucide-react';
import { useStore } from '../store/useStore';

interface MenuProps {
  onSelectFeature: (feature: string) => void;
  onSettings: () => void;
  onFinish: () => void;
}

export default function Menu({ onSelectFeature, onSettings, onFinish }: MenuProps) {
  const user = useStore((state) => state.user);
  const isAdmin = user?.app_metadata?.role === 'admin' || user?.email?.includes('palomino');

  return (
    <div className="min-h-screen bg-black text-white p-6 pt-12 font-inter">
      <div className="flex flex-col items-center mb-10">
        <div className="mb-4 p-1 bg-[#27AAE1]/10 rounded-[28px] shadow-[0_0_20px_rgba(39,170,225,0.4)] border border-[#27AAE1]/20">
          <img src="/icons/logo-128.png" alt="GoFlexConnect" className="w-20 h-20 rounded-[24px]" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white normal-case italic">GoFlexConnect</h1>
        <p className="text-slate-500 text-[10px] font-bold normal-case tracking-[0.2em] mt-1">Select a feature to get started</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {isAdmin && (
          <button onClick={() => onSelectFeature('admin')} className="col-span-2 bg-slate-900 border-2 border-[#27AAE1] p-6 rounded-3xl flex items-center justify-between active:scale-95 transition-all shadow-[0_0_30px_rgba(39,170,225,0.2)]">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#27AAE1]/20 rounded-2xl"><Shield className="w-8 h-8 text-[#27AAE1] animate-pulse" /></div>
              <div className="text-left"><p className="text-[10px] font-black text-[#27AAE1] normal-case tracking-[0.2em]">Live System</p><p className="text-lg font-black normal-case italic">Mission Control</p></div>
            </div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping mr-2" />
          </button>
        )}
        <button onClick={() => onSelectFeature('projects')} className="bg-slate-900 border border-white/5 p-6 rounded-2xl flex flex-col items-center gap-3 active:scale-95 transition-all"><LayoutDashboard className="w-8 h-8 text-[#27AAE1]" /><span className="text-[10px] font-black normal-case tracking-widest">Projects</span></button>
        <button onClick={() => onSelectFeature('speedTest')} className="bg-slate-900 border border-white/5 p-6 rounded-2xl flex flex-col items-center gap-3 active:scale-95 transition-all"><Activity className="w-8 h-8 text-green-500" /><span className="text-[10px] font-black normal-case tracking-widest">Speed Test</span></button>
        <button onClick={() => onSelectFeature('cellTowerCompass')} className="bg-slate-900 border border-white/5 p-6 rounded-2xl flex flex-col items-center gap-3 active:scale-95 transition-all"><Compass className="w-8 h-8 text-orange-500" /><span className="text-[10px] font-black normal-case tracking-widest">Compass</span></button>
        <button onClick={onSettings} className="bg-slate-900 border border-white/5 p-6 rounded-2xl flex flex-col items-center gap-3 active:scale-95 transition-all"><Settings className="w-8 h-8 text-slate-400" /><span className="text-[10px] font-black normal-case tracking-widest">Settings</span></button>
      </div>

      <div className="mt-8 w-full bg-slate-900/40 border border-[#27AAE1]/20 rounded-3xl p-6 flex items-center gap-4">
        <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-[#27AAE1]"><Cloud className="w-6 h-6" /></div>
        <div><p className="text-[10px] font-black text-[#27AAE1] normal-case tracking-widest">Global Sync</p><p className="text-xs text-white font-bold">Cloud Infrastructure Active</p></div>
      </div>
    </div>
  );
}
