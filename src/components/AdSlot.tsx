import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getAdForPlacement, AdPlacement } from '../services/ads';
import { logAdImpression, logAdClick } from '../services/adTracking';
import UpgradeProModal from './UpgradeProModal';

interface AdSlotProps {
  placement: AdPlacement;
}

export default function AdSlot({ placement }: AdSlotProps) {
  const settings = useStore((state) => state.settings);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Get user's plan, default to 'free' if not set
  const plan = settings?.plan ?? 'free';

  // Don't show ads to pro users
  if (plan !== 'free') {
    return null;
  }

  // Get ad for this placement
  const ad = getAdForPlacement(placement);

  // No ad available for this placement
  if (!ad) {
    return null;
  }

  // Log impression when ad is shown
  useEffect(() => {
    if (ad) {
      logAdImpression(ad.id, placement);
    }
  }, [ad?.id, placement]);

  // Handle click tracking
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // Log click event
    logAdClick(ad.id, placement);

    // Open link in new tab
    window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Handle upgrade CTA click
  const handleUpgradeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowUpgradeModal(true);
  };

  return (
    <>
      <div className="rounded-xl border border-slate-700 dark:border-slate-700 bg-slate-900/80 dark:bg-slate-900/80 overflow-hidden">
        <a
          href={ad.targetUrl}
          onClick={handleClick}
          className="block p-4 hover:bg-slate-900/90 transition-all duration-200 no-underline cursor-pointer"
        >
          <div className="flex items-start gap-4">
            {ad.imageUrl && (
              <div className="flex-shrink-0">
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider">
                  Sponsored
                </span>
                <ExternalLink className="w-3 h-3 text-slate-500 dark:text-slate-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 dark:text-slate-100 mb-1 line-clamp-1">
                {ad.title}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 line-clamp-2">
                {ad.description}
              </p>
            </div>
          </div>
        </a>

        <div className="px-4 pb-3 pt-2 border-t border-slate-700/50">
          <p className="text-xs text-slate-400">
            Tired of ads and watermarks?{' '}
            <button
              onClick={handleUpgradeClick}
              className="text-goflex-blue font-semibold hover:underline focus:outline-none"
            >
              Upgrade to GoFlexConnect Pro
            </button>
            {' '}(coming soon).
          </p>
        </div>
      </div>

      <UpgradeProModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}
