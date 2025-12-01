import { Radio, ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-goflex-blue via-goflex-blue to-goflex-blue-dark flex flex-col items-center justify-center px-6 animate-fadeIn">
      <div className="text-center">
        <div className="mb-8 animate-scaleIn text-center">
          <div className="flex justify-center mb-6">
            <img
              src="/icons/logo-512.png"
              alt="GoFlexConnect logo"
              className="h-32 w-32 rounded-[32px] shadow-xl shadow-cyan-500/40"
            />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            GoFlexConnect
          </h1>
        </div>

        <div className="animate-slideUp">

          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Radio className="w-7 h-7 text-white" />
            </div>
          </div>

          <p className="text-xl text-white/90 font-medium max-w-md mx-auto leading-relaxed mb-12">
            Professional cellular signal survey and heatmap visualization tool
          </p>

          <button
            onClick={onComplete}
            className="group bg-white text-goflex-blue px-8 py-4 rounded-2xl font-semibold text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 mx-auto"
          >
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
