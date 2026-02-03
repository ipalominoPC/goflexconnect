import { useState } from 'react';
import { MapPin, Radio, BarChart3 } from 'lucide-react';
import { useStore } from '../store/useStore';

// Cellular Signal Animation Component - 6 bars with color gradient
function CellularSignal() {
  const bars = [
    { height: 'h-3', color: 'bg-red-500', delay: '0ms' },
    { height: 'h-5', color: 'bg-red-400', delay: '100ms' },
    { height: 'h-7', color: 'bg-yellow-500', delay: '200ms' },
    { height: 'h-9', color: 'bg-yellow-400', delay: '300ms' },
    { height: 'h-11', color: 'bg-green-500', delay: '400ms' },
    { height: 'h-14', color: 'bg-green-400', delay: '500ms' },
  ];

  return (
    <div className="flex items-end justify-center gap-1.5 h-16">
      {bars.map((bar, idx) => (
        <div
          key={idx}
          className={`w-3 ${bar.height} ${bar.color} rounded-t-md animate-pulse shadow-lg`}
          style={{ animationDelay: bar.delay, animationDuration: '1.5s' }}
        />
      ))}
    </div>
  );
}

// Heatmap Preview Component - 5x5 grid with color gradient
function HeatmapPreview() {
  const grid = [
    ['bg-red-500', 'bg-red-400', 'bg-yellow-500', 'bg-yellow-400', 'bg-green-500'],
    ['bg-red-400', 'bg-yellow-500', 'bg-yellow-400', 'bg-green-500', 'bg-green-400'],
    ['bg-yellow-500', 'bg-yellow-400', 'bg-green-500', 'bg-green-400', 'bg-green-500'],
    ['bg-yellow-400', 'bg-green-500', 'bg-green-400', 'bg-green-500', 'bg-yellow-400'],
    ['bg-green-500', 'bg-green-400', 'bg-green-500', 'bg-yellow-500', 'bg-yellow-400'],
  ];

  return (
    <div className="flex flex-col gap-1">
      {grid.map((row, rowIdx) => (
        <div key={rowIdx} className="flex gap-1">
          {row.map((color, colIdx) => (
            <div
              key={colIdx}
              className={`w-3 h-3 ${color} rounded-sm animate-pulse shadow-lg`}
              style={{ 
                animationDelay: `ms`,
                animationDuration: '2s'
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const setHasCompletedOnboarding = useStore((state) => state.setHasCompletedOnboarding);

  const steps = [
    {
      icon: MapPin,
      title: 'Walk the Site',
      description: 'Move through your building with your phone to capture signal data at different locations.',
      showSignal: false,
      showHeatmap: false,
    },
    {
      icon: Radio,
      title: 'Capture Signal Samples',
      description: 'Tap to record cellular signal metrics including RSRP, RSRQ, SINR, and cell information.',
      showSignal: true,
      showHeatmap: false,
    },
    {
      icon: BarChart3,
      title: 'View Heatmap',
      description: 'Visualize signal strength across your floor plan with color-coded heatmaps.',
      showSignal: false,
      showHeatmap: true,
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl shadow-xl border border-white/10 p-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-[#27AAE1] blur-[50px] opacity-40 rounded-full animate-pulse"></div>
              <img
                src="/icons/logo-256.png"
                alt="GoFlexConnect logo"
                className="relative h-20 w-20 rounded-3xl shadow-[0_0_40px_rgba(39,170,225,0.6)] border-2 border-[#27AAE1]/40"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            GoFlexConnect
          </h1>
        </div>

        <div className="flex justify-center mb-6">
          {currentStep.showSignal ? (
            <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center border border-[#27AAE1]/20">
              <CellularSignal />
            </div>
          ) : currentStep.showHeatmap ? (
            <div className="w-24 h-24 bg-slate-800/50 rounded-2xl flex items-center justify-center border border-[#27AAE1]/20 p-3">
              <HeatmapPreview />
            </div>
          ) : (
            <div className="w-20 h-20 bg-goflex-blue/10 rounded-full flex items-center justify-center">
              <Icon className="w-10 h-10 text-goflex-blue" />
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-3">
          {currentStep.title}
        </h2>
        <p className="text-slate-400 text-center mb-8">
          {currentStep.description}
        </p>

        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === step ? 'w-8 bg-goflex-blue' : 'w-2 bg-white/20'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 px-6 py-3 border border-white/20 text-white rounded-xl font-medium hover:bg-white/5 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (step < steps.length - 1) {
                setStep(step + 1);
              } else {
                setHasCompletedOnboarding(true);
                onComplete();
              }
            }}
            className="flex-1 px-6 py-3 bg-goflex-blue text-white rounded-xl font-medium hover:bg-goflex-blue-dark transition-colors"
          >
            {step < steps.length - 1 ? 'Next' : 'Get Started'}
          </button>
        </div>
      </div>
    </div>
  );
}
