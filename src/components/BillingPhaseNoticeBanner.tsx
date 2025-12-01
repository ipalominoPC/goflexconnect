import { useState, useEffect } from 'react';
import { Bell, X, Info } from 'lucide-react';
import {
  fetchBillingPhase,
  BillingPhaseInfo,
  getDaysUntilBillingActivation,
  formatBillingActivationDate,
} from '../services/billingPhaseService';

export default function BillingPhaseNoticeBanner() {
  const [billingInfo, setBillingInfo] = useState<BillingPhaseInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    loadBillingPhase();
  }, []);

  const loadBillingPhase = async () => {
    try {
      const info = await fetchBillingPhase();
      setBillingInfo(info);

      // Check if user has dismissed this notice
      const dismissedKey = `billing_notice_dismissed_${info.phase}_${info.noticeStartAt}`;
      const isDismissed = localStorage.getItem(dismissedKey) === 'true';
      setDismissed(isDismissed);
    } catch (error) {
      console.error('Error loading billing phase:', error);
    }
  };

  const handleDismiss = () => {
    if (billingInfo) {
      const dismissedKey = `billing_notice_dismissed_${billingInfo.phase}_${billingInfo.noticeStartAt}`;
      localStorage.setItem(dismissedKey, 'true');
      setDismissed(true);
    }
  };

  // Only show banner in NOTICE phase
  if (!billingInfo || billingInfo.phase !== 'NOTICE' || dismissed) {
    return null;
  }

  const daysRemaining = getDaysUntilBillingActivation(billingInfo);
  const activationDate = formatBillingActivationDate(billingInfo);

  if (daysRemaining === null || !activationDate) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-b-2 border-amber-200 dark:border-amber-800">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-amber-900 dark:text-amber-100 mb-1">
              Billing Notice: Your PRO access will change in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
            </h3>
            <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed mb-3">
              You're currently enjoying GoFlexConnect PRO features for free during our Beta period.
              Starting <strong>{activationDate}</strong>, billing will begin for PRO features.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-white dark:bg-amber-900/30 px-3 py-1.5 rounded-full border border-amber-300 dark:border-amber-700">
                <Info className="w-3.5 h-3.5" />
                <span className="font-medium">
                  {daysRemaining <= 7 ? (
                    <span className="text-red-600 dark:text-red-400 font-bold">Action needed soon</span>
                  ) : (
                    'You have time to decide'
                  )}
                </span>
              </div>
            </div>

            <div className="mt-3 text-xs text-amber-700 dark:text-amber-300">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span>✓ Your data will be preserved</span>
                <span>✓ FREE plan available</span>
                <span>✓ No automatic charges</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg transition-colors"
            aria-label="Dismiss notice"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
