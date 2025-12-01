import { useState } from 'react';
import { Mail, X } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface EmailVerificationBannerProps {
  userEmail: string;
  onDismiss?: () => void;
}

export default function EmailVerificationBanner({ userEmail, onDismiss }: EmailVerificationBannerProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleResend = async () => {
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });

      if (error) throw error;
      setMessage('Verification email sent! Check your inbox.');
    } catch (error) {
      console.warn('Resend verification failed:', error);
      setMessage('Unable to resend at this time. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-start gap-3">
        <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">
            Please verify your email
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed mb-2">
            Some features may be limited until your email is verified. Check your inbox for a confirmation link.{' '}
            <button
              onClick={handleResend}
              disabled={loading}
              className="font-semibold underline hover:no-underline disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Need a new link?'}
            </button>
          </p>
          {message && (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              {message}
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
