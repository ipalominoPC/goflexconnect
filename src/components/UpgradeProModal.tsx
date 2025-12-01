import { X, Crown, Info } from 'lucide-react';

interface UpgradeProModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeProModal({ isOpen, onClose }: UpgradeProModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 slide-in-from-bottom-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#27AAE1]/40"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#27AAE1]/20 dark:bg-[#27AAE1]/20 rounded-2xl mb-4">
            <Crown className="w-8 h-8 text-[#27AAE1]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            Enjoy GoFlexConnect PRO
          </h2>
          <h3 className="text-lg font-semibold text-[#27AAE1] dark:text-[#27AAE1] mb-3">
            Free During Beta
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
            You currently have access to GoFlexConnect PRO features at no cost while we're in Beta.
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3 mb-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                What happens when Beta ends?
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>
                    <strong>We'll notify you</strong> by email and in-app with full pricing details and the date your plan will change.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>
                    <strong>You choose</strong> whether to continue on a paid PRO plan or move to FREE.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>
                    <strong>Your data is safe</strong> – All existing projects and RF data will be preserved regardless of your choice.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                  <span>
                    <strong>FREE plan available</strong> – If you don't upgrade, you'll automatically move to the FREE plan with ads.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#27AAE1] hover:bg-[#0178B7] text-white font-semibold py-3.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#27AAE1]/25 focus:outline-none focus:ring-2 focus:ring-[#27AAE1]/40 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 mb-3"
        >
          Got it – Continue with PRO (Beta)
        </button>

        <div className="text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pricing will be announced before billing starts.
          </p>
        </div>
      </div>
    </div>
  );
}
