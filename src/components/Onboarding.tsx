import { useState } from 'react';
import { MapPin, Radio, BarChart3 } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const setHasCompletedOnboarding = useStore((state) => state.setHasCompletedOnboarding);

  const steps = [
    {
      icon: MapPin,
      title: 'Walk the Site',
      description: 'Move through your building with your phone to capture signal data at different locations.',
    },
    {
      icon: Radio,
      title: 'Capture Signal Samples',
      description: 'Tap to record cellular signal metrics including RSRP, RSRQ, SINR, and cell information.',
    },
    {
      icon: BarChart3,
      title: 'View Heatmap',
      description: 'Visualize signal strength across your floor plan with color-coded heatmaps.',
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-goflex-blue/10 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img
              src="/icons/logo-256.png"
              alt="GoFlexConnect logo"
              className="h-20 w-20 rounded-3xl shadow-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            GoFlexConnect
          </h1>
        </div>
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-goflex-blue/10 rounded-full flex items-center justify-center">
            <Icon className="w-10 h-10 text-goflex-blue" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-black text-center mb-3">
          {currentStep.title}
        </h2>

        <p className="text-gray-600 text-center mb-8">
          {currentStep.description}
        </p>

        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === step ? 'w-8 bg-goflex-blue' : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
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
