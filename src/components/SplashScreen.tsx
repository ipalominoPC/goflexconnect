import { ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 animate-fadeIn">
      <div className="text-center">
        <div className="mb-12 animate-scaleIn text-center">
          <div className="flex justify-center mb-8">
            <img
              src="/icons/logo-512.png"
              alt="GoFlexConnect logo"
              className="h-28 w-28 rounded-[28px] shadow-[0_0_30px_rgba(39,170,225,0.4)] border border-[#27AAE1]/20"
            />
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight" >
            GoFlexConnect
          </h1>
          <p className="text-[#27AAE1] text-[10px] font-bold uppercase tracking-[0.4em] opacity-80">RF Intelligence</p>
        </div>

        <div className="animate-slideUp">
          {/* ANIMATED SIGNAL BARS */}
          <div className="flex items-end justify-center gap-1.5 mb-12 h-10">
            <div className="animate-signal-1 w-2 h-3 bg-[#27AAE1] rounded-t-sm"></div>
            <div className="animate-signal-2 w-2 h-5 bg-[#27AAE1] rounded-t-sm"></div>
            <div className="animate-signal-3 w-2 h-7 bg-[#27AAE1] rounded-t-sm"></div>
            <div className="animate-signal-4 w-2 h-9 bg-[#27AAE1] rounded-t-sm"></div>
            <div className="animate-signal-5 w-2 h-11 bg-[#27AAE1] rounded-t-sm"></div>
          </div>

          <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto leading-relaxed mb-12 uppercase tracking-widest" style={{ fontFamily: 'Roboto, sans-serif' }}>
            Professional cellular signal survey and heatmap tool
          </p>

          <button
            onClick={onComplete}
            className="group bg-[#27AAE1] text-white px-10 py-4 rounded-2xl font-black text-lg shadow-[0_0_25px_rgba(39,170,225,0.4)] active:scale-95 transition-all duration-300 flex items-center gap-3 mx-auto"
          >
            GET STARTED
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

