import { useState, useEffect } from 'react';
import { Radio, Grid3X3, FolderLock, Shield, Cloud, Loader2, ChevronRight, Zap } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface LandingProps {
  onGetAccess: () => void;
  onLogIn: () => void;
}

export function Landing({ onGetAccess, onLogIn }: LandingProps) {
  const [partnerData, setPartnerData] = useState<any>(null);
  const [loadingPartner, setLoadingPartner] = useState(true);

  useEffect(() => {
    async function fetchPartner() {
      try {
        const { data } = await supabase
          .from('strategic_partners')
          .select('*')
          .eq('is_active', true)
          .single();
        if (data) setPartnerData(data);
      } catch (e) {
        console.log("Defaulting to incognito gateway");
      } finally {
        setLoadingPartner(false);
      }
    }
    fetchPartner();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#27AAE1]/30">
      <style>{`
        @keyframes signal-slow { 0%, 100% { opacity: 0.2; transform: scaleY(0.8); } 50% { opacity: 1; transform: scaleY(1.1); } }
        @keyframes grid-pulse { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.8) blur(1px); } }
        @keyframes vault-lock { 0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px #f97316); } 50% { transform: scale(1.05); filter: drop-shadow(0 0 25px #f97316); } }
        @keyframes bridge-glow { 0%, 100% { border-color: rgba(39, 170, 225, 0.2); box-shadow: 0 0 30px rgba(39, 170, 225, 0.05); } 50% { border-color: rgba(39, 170, 225, 0.6); box-shadow: 0 0 50px rgba(39, 170, 225, 0.2); } }
        @keyframes button-pulse { 0% { box-shadow: 0 0 0 0px rgba(39, 170, 225, 0.4); } 100% { box-shadow: 0 0 0 15px rgba(39, 170, 225, 0); } }
      `}</style>
      
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 pt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/icons/logo-96.png" className="h-9 w-9 rounded-xl border border-[#27AAE1]/50 shadow-[0_0_15px_#27AAE1]" />
            <span className="text-xl font-bold tracking-tighter text-white italic">GoFlexConnect</span>
          </div>
        </div>
      </nav>

      {/* SECTION 1: HERO - Reduced bottom padding */}
      <section id="hero" className="pt-20 pb-6 px-6 flex flex-col items-center text-center">
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-[#27AAE1] blur-[60px] opacity-40 rounded-full animate-pulse"></div>
          <img src="/icons/logo-128.png" className="relative w-32 h-32 rounded-[32px] shadow-[0_0_50px_#27AAE1] border-2 border-[#27AAE1]/50" />
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic text-white mb-6">Cellular Signal Survey <br/><span className="text-[#27AAE1] drop-shadow-[0_0_15px_#27AAE1]">& Analysis Tool</span></h1>
        <p className="max-w-2xl mx-auto text-slate-400 text-lg mb-10 font-medium leading-relaxed px-4">Surgical RF mapping and coverage heatmapping for professional field engineering.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md mx-auto">
          <button onClick={onGetAccess} className="flex-1 bg-[#27AAE1] px-8 py-5 rounded-2xl text-sm font-black shadow-[0_0_25px_#27AAE1] active:scale-95 transition-all text-black uppercase tracking-widest">Register for Access</button>
          <button onClick={onLogIn} className="flex-1 bg-slate-900 border border-white/20 px-8 py-5 rounded-2xl text-sm font-black hover:bg-slate-800 transition-all uppercase tracking-widest">Member Login</button>
        </div>
      </section>

      {/* SECTION 2: THE STRATEGIC BRIDGE - Pulled Up closer to Hero */}
      <section className="py-6 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-900/60 border-2 border-dashed border-[#27AAE1]/30 rounded-[2.5rem] p-8 md:p-14 text-center animate-[bridge-glow_4s_infinite]">
            {loadingPartner ? (
              <div className="flex items-center justify-center gap-3 py-4">
                <Loader2 className="animate-spin text-[#27AAE1]" size={18} />
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em]">Establishing Engineering Link...</span>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="text-left max-w-2xl">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-[#27AAE1]/20 rounded-lg border border-[#27AAE1]/40">
                      <Shield size={18} className="text-[#27AAE1]" />
                    </div>
                    <span className="text-[10px] font-black text-[#27AAE1] uppercase tracking-[0.5em]">Certified Design Division</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tight mb-3">
                    {partnerData?.name || "Professional Design Support"}
                  </h2>
                  <p className="text-slate-400 text-base font-medium leading-relaxed">
                    {partnerData?.description || "Create a free account to unlock hardware-direct signal analysis. Our engineering team provides complimentary system review for all captured field data."}
                  </p>
                </div>
                
                {/* UPGRADED EXECUTIVE ACTION BUTTON */}
                <button 
                  onClick={onGetAccess}
                  className="relative group w-full md:w-auto bg-[#27AAE1] hover:bg-[#32c1fd] text-black px-10 py-6 rounded-2xl flex items-center justify-center gap-4 transition-all active:scale-95 animate-[button-pulse_2s_infinite]"
                >
                  <Zap size={20} fill="black" className="group-hover:scale-125 transition-transform" />
                  <span className="text-sm font-black uppercase tracking-[0.2em]">Start Design Review</span>
                  <ChevronRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 3: FEATURES */}
      <section id="features" className="py-24 bg-slate-900/40 border-y border-white/10 px-6 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="p-8 bg-slate-950 border border-[#27AAE1]/60 rounded-[2.5rem] shadow-[0_0_40px_rgba(39,170,225,0.2)]">
              <div className="flex items-end gap-1.5 h-10 mb-8">
                <div className="w-1.5 h-1/3 bg-red-500 rounded-full animate-[signal-slow_2.5s_infinite_0.1s]" />
                <div className="w-1.5 h-1/2 bg-red-500 rounded-full animate-[signal-slow_2.5s_infinite_0.4s]" />
                <div className="w-1.5 h-2/3 bg-yellow-500 rounded-full animate-[signal-slow_2.5s_infinite_0.7s]" />
                <div className="w-1.5 h-3/4 bg-yellow-500 rounded-full animate-[signal-slow_2.5s_infinite_1.0s]" />
                <div className="w-1.5 h-[90%] bg-green-500 rounded-full animate-[signal-slow_2.5s_infinite_1.3s]" />
                <div className="w-1.5 h-full bg-green-500 rounded-full animate-[signal-slow_2.5s_infinite_1.6s]" />
              </div>
              <h3 className="text-xl font-black mb-3 tracking-widest text-white italic">Signal Scanning</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Capture hardware-direct RSRP, RSRQ, and SINR telemetry.</p>
            </div>

            <div className="p-8 bg-slate-950 border border-green-500/60 rounded-[2.5rem] shadow-[0_0_40_rgba(34,197,94,0.2)]">
              <div className="grid grid-cols-3 gap-1 w-fit mb-8 animate-[grid-pulse_4s_infinite]">
                 <div className="w-4 h-4 bg-green-500 rounded-sm shadow-[0_0_8px_#22c55e]" />
                 <div className="w-4 h-4 bg-yellow-500 rounded-sm" />
                 <div className="w-4 h-4 bg-red-600 rounded-sm shadow-[0_0_8px_#ef4444]" />
                 <div className="w-4 h-4 bg-yellow-500 rounded-sm" />
                 <div className="w-4 h-4 bg-green-500 rounded-sm" />
                 <div className="w-4 h-4 bg-green-500 rounded-sm" />
                 <div className="w-4 h-4 bg-red-600 rounded-sm" />
                 <div className="w-4 h-4 bg-yellow-500 rounded-sm" />
                 <div className="w-4 h-4 bg-green-500 rounded-sm" />
              </div>
              <h3 className="text-xl font-black mb-3 tracking-widest text-white italic">Live Heatmaps</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Coverage visualization using Peak Signal Engine.</p>
            </div>

            <div className="p-8 bg-slate-950 border border-orange-500/60 rounded-[2.5rem] shadow-[0_0_40px_rgba(249,115,22,0.2)]">
              <div className="mb-8 w-fit animate-[vault-lock_3s_infinite]"><FolderLock className="w-10 h-10 text-orange-500" /></div>
              <h3 className="text-xl font-black mb-3 tracking-widest text-white italic">Project Vault</h3>
              <p className="text-slate-400 text-sm leading-relaxed">Organize surveys with automated cloud infrastructure.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/5 text-center px-6">
        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em]">© 2026 GoFlexConnect • Mission Driven Data</p>
      </footer>
    </div>
  );
}