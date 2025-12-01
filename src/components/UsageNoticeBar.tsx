/**
 * UsageNoticeBar Component
 *
 * Displays contextual usage notifications to FREE users
 * Supports multiple severity levels and upgrade CTAs
 */

import { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Info, X, Zap } from 'lucide-react';
import { UsageNotice, UsageNoticeContext, getUsageNotices } from '../services/usageNotices';
import { supabase } from '../services/supabaseClient';

interface UsageNoticeBarProps {
  context: UsageNoticeContext;
  onUpgrade?: () => void;
}

export default function UsageNoticeBar({ context, onUpgrade }: UsageNoticeBarProps) {
  const [notices, setNotices] = useState<UsageNotice[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotices();
  }, [context]);

  const loadNotices = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fetchedNotices = await getUsageNotices(user.id, context);
      setNotices(fetchedNotices);
    } catch (error) {
      console.error('Failed to load usage notices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (noticeId: string) => {
    setDismissed((prev) => new Set(prev).add(noticeId));
  };

  const handleCtaClick = (action: 'upgrade-modal' | 'contact-support') => {
    if (action === 'upgrade-modal' && onUpgrade) {
      onUpgrade();
    } else if (action === 'contact-support') {
      // Future: open support modal or redirect
      console.log('Contact support clicked');
    }
  };

  const visibleNotices = notices.filter((notice) => !dismissed.has(notice.id));

  if (loading || visibleNotices.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {visibleNotices.map((notice) => (
        <NoticeBar
          key={notice.id}
          notice={notice}
          onDismiss={() => handleDismiss(notice.id)}
          onCtaClick={handleCtaClick}
        />
      ))}
    </div>
  );
}

interface NoticeBarProps {
  notice: UsageNotice;
  onDismiss: () => void;
  onCtaClick: (action: 'upgrade-modal' | 'contact-support') => void;
}

function NoticeBar({ notice, onDismiss, onCtaClick }: NoticeBarProps) {
  const getStyles = () => {
    switch (notice.severity) {
      case 'error':
        return {
          container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          icon: 'text-red-600 dark:text-red-400',
          text: 'text-red-800 dark:text-red-200',
          button: 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300',
          ctaButton:
            'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white',
          IconComponent: AlertCircle,
        };
      case 'warning':
        return {
          container: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
          icon: 'text-amber-600 dark:text-amber-400',
          text: 'text-amber-800 dark:text-amber-200',
          button: 'text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300',
          ctaButton:
            'bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white',
          IconComponent: AlertTriangle,
        };
      case 'info':
      default:
        return {
          container: 'bg-[#27AAE1]/10 dark:bg-[#27AAE1]/20 border-[#27AAE1]/30 dark:border-[#27AAE1]/40',
          icon: 'text-[#27AAE1]',
          text: 'text-slate-800 dark:text-slate-200',
          button: 'text-[#27AAE1] hover:text-[#1d8bb8]',
          ctaButton: 'bg-[#27AAE1] hover:bg-[#1d8bb8] text-white',
          IconComponent: Info,
        };
    }
  };

  const styles = getStyles();
  const IconComponent = styles.IconComponent;

  return (
    <div
      className={`relative border rounded-lg p-4 ${styles.container} transition-all animate-in fade-in slide-in-from-top-2 duration-300`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <IconComponent className={`w-5 h-5 ${styles.icon}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${styles.text}`}>{notice.message}</p>

          {/* CTA Button */}
          {notice.cta && (
            <button
              onClick={() => onCtaClick(notice.cta!.action)}
              className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${styles.ctaButton}`}
            >
              <Zap className="w-4 h-4" />
              {notice.cta.label}
            </button>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className={`flex-shrink-0 p-1 rounded-lg transition-colors ${styles.button}`}
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
