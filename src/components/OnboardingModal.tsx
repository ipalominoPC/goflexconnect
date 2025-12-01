/**
 * OnboardingModal Component
 *
 * Welcome modal for new users explaining the GoFlexConnect workflow
 */

import { Cloud, Zap, MapPin, TrendingUp } from 'lucide-react';

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function OnboardingModal({ open, onClose, onComplete }: OnboardingModalProps) {
  if (!open) return null;

  const handleGetStarted = () => {
    onComplete();
  };

  const handleSkip = () => {
    onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-8 animate-in zoom-in-95 duration-300">
        {/* Header with Icon */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#27AAE1] to-[#1d8bb8] rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-[#27AAE1]/25">
            <Cloud className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Welcome to GoFlexConnect
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-md">
            Let's get you ready to capture clean RF coverage data in just a few steps.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {/* Step 1 */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 transition-colors hover:border-[#27AAE1]/30">
            <div className="flex-shrink-0 w-10 h-10 bg-[#27AAE1]/10 dark:bg-[#27AAE1]/20 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[#27AAE1]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                1. Create your first project
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Define a site or building where you'll collect signal measurements.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 transition-colors hover:border-[#27AAE1]/30">
            <div className="flex-shrink-0 w-10 h-10 bg-[#27AAE1]/10 dark:bg-[#27AAE1]/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#27AAE1]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                2. Run a quick Speed Test
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Validate connection strength and capture baseline performance.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 transition-colors hover:border-[#27AAE1]/30">
            <div className="flex-shrink-0 w-10 h-10 bg-[#27AAE1]/10 dark:bg-[#27AAE1]/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#27AAE1]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
                3. Walk the site & generate insights
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Collect measurements on each floor, then review AI-powered insights and heatmaps.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleGetStarted}
            className="w-full sm:flex-1 px-6 py-3 bg-gradient-to-r from-[#27AAE1] to-[#1d8bb8] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#27AAE1]/25 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Cloud className="w-5 h-5" />
            Get Started
          </button>
          <button
            onClick={handleSkip}
            className="w-full sm:w-auto px-6 py-3 text-slate-600 dark:text-slate-400 font-semibold hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
