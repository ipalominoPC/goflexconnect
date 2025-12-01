import { Crown, ArrowRight } from 'lucide-react';

interface HouseAdBannerProps {
  onUpgradeClick: () => void;
  variant?: 'default' | 'compact';
  className?: string;
}

export default function HouseAdBanner({
  onUpgradeClick,
  variant = 'default',
  className = ''
}: HouseAdBannerProps) {
  if (variant === 'compact') {
    return (
      <div
        className={`bg-gradient-to-r from-[#27AAE1]/10 to-[#27AAE1]/5 dark:from-[#27AAE1]/10 dark:to-[#27AAE1]/5 border border-[#27AAE1]/30 dark:border-[#27AAE1]/20 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2 ${className}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-[#27AAE1]/20 dark:bg-[#27AAE1]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-[#27AAE1]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                Built for RF professionals.
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                Pro-grade heatmaps without ads.
              </p>
            </div>
          </div>
          <button
            onClick={onUpgradeClick}
            className="flex-shrink-0 bg-[#27AAE1] hover:bg-[#0178B7] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-[#27AAE1]/25 focus:outline-none focus:ring-2 focus:ring-[#27AAE1]/40 whitespace-nowrap"
            aria-label="Upgrade to Pro"
          >
            Upgrade
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-bottom-3 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-[#27AAE1]/20 dark:bg-[#27AAE1]/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Crown className="w-6 h-6 text-[#27AAE1]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
            Built for RF professionals.
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
            GoFlexConnect Pro delivers pro-grade heatmaps and analytics without ads.
          </p>
          <button
            onClick={onUpgradeClick}
            className="inline-flex items-center gap-2 bg-[#27AAE1] hover:bg-[#0178B7] text-white font-semibold px-5 py-2.5 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-[#27AAE1]/25 focus:outline-none focus:ring-2 focus:ring-[#27AAE1]/40 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
            aria-label="Upgrade to GoFlexConnect Pro"
          >
            <span>Upgrade to Pro</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
