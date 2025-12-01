import { useState, useEffect } from 'react';
import { LogIn, UserPlus, Loader2, KeyRound, AlertCircle, Mail, ShieldAlert } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { logSessionEvent } from '../services/sessionTracking';
import { notifyAdminOnSignup } from '../services/signupNotification';

interface AuthProps {
  onAuthSuccess: () => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [usesAliasOrRelay, setUsesAliasOrRelay] = useState(false);

  useEffect(() => {
    const checkAliasEmail = () => {
      const isAlias =
        email.includes('+') ||
        email.toLowerCase().includes('privaterelay.appleid.com') ||
        (email.toLowerCase().includes('icloud.com') && email.includes('-')) ||
        email.toLowerCase().includes('relay');
      setUsesAliasOrRelay(isAlias);
    };

    if (email && !isLogin) {
      checkAliasEmail();
    } else {
      setUsesAliasOrRelay(false);
    }
  }, [email, isLogin]);

  const handleQuickReset = async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSuccess('Password reset email sent! Check your inbox.');
      setFailedAttempts(0);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSuccess('Password reset email sent! Check your inbox.');
        setEmail('');
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setFailedAttempts(prev => prev + 1);
          if (error.message.toLowerCase().includes('invalid login') ||
              error.message.toLowerCase().includes('invalid credentials') ||
              error.message.toLowerCase().includes('email not confirmed')) {
            throw new Error(`${error.message}. If you're sure you've signed up before, try "Forgot password" to reset your login.`);
          }
          throw error;
        }
        setFailedAttempts(0);
        await logSessionEvent({ eventType: 'sign_in' });
        onAuthSuccess();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          if (error.message.toLowerCase().includes('user already registered') ||
              error.message.toLowerCase().includes('already exists') ||
              error.message.toLowerCase().includes('duplicate')) {
            throw new Error('An account with this email already exists. Please sign in or use "Forgot password" to regain access.');
          }
          throw error;
        }

        if (data?.user?.identities && data.user.identities.length === 0) {
          throw new Error('An account with this email already exists. Please sign in or use "Forgot password" to regain access.');
        }

        const isEmailVerified = data?.user?.email_confirmed_at != null;
        if (!isEmailVerified) {
          setShowVerificationMessage(true);
        }

        // Trigger admin notification for new signup (non-blocking)
        // This is used to send an email alert to admins when a new user creates an account
        // Includes admin dashboard alert + email notification
        if (data?.user?.email) {
          notifyAdminOnSignup(data.user.email, data.user.id);
        }

        await logSessionEvent({ eventType: 'sign_in' });
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-goflex-bg flex items-center justify-center p-4">
      <div className="bg-goflex-card rounded-2xl shadow-2xl border border-gray-800 w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center mb-6">
            <img
              src="/icons/logo-256.png"
              alt="GoFlexConnect logo"
              className="h-24 w-24 rounded-3xl shadow-lg shadow-cyan-500/30 mb-4"
            />
          </div>
          <h1 className="text-4xl font-bold text-white dark:text-white mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            GoFlexConnect
          </h1>
          <p className="text-white text-lg font-sans mb-2">Cellular Signal Survey & Analysis Tool</p>
          <p className="text-gray-400 text-sm">Early access is free while GoFlexConnect is in beta</p>
        </div>

        {!isForgotPassword && (
          <div className="flex rounded-xl bg-gray-900/50 p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                isLogin
                  ? 'bg-goflex-blue text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                !isLogin
                  ? 'bg-goflex-blue text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {isForgotPassword && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
            <p className="text-gray-400 text-sm">Enter your email address and we'll send you a password reset link.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-goflex-blue/50 focus:border-goflex-blue transition-all text-white placeholder-gray-500"
              placeholder="you@example.com"
            />
            {usesAliasOrRelay && !isLogin && (
              <div className="mt-2 flex items-start gap-2 p-3 bg-amber-500/10 dark:bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/20 rounded-lg">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Using a privacy or alias email?</p>
                  <p className="text-xs text-amber-600 dark:text-amber-500 leading-relaxed">
                    This email may be a private relay or alias. Make sure you can access it in the future, and save your login details somewhere safe so you don't lose access to your GoFlexConnect account.
                  </p>
                </div>
              </div>
            )}
          </div>

          {!isForgotPassword && (
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-gray-900/50 border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-goflex-blue/50 focus:border-goflex-blue transition-all text-white placeholder-gray-500"
                placeholder="••••••••"
              />
              {!isLogin && (
                <p className="text-xs text-gray-500 mt-2">Minimum 6 characters • Premium features coming soon</p>
              )}
              {isLogin && failedAttempts > 0 && failedAttempts < 3 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  Tip: Make sure you're using the same email you used to create the account.
                </p>
              )}
              {isLogin && failedAttempts >= 3 && (
                <div className="mt-3 p-4 bg-slate-900/50 dark:bg-slate-800/50 border border-[#27AAE1]/40 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#27AAE1] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-100 dark:text-slate-100 mb-1">
                        Having trouble signing in?
                      </p>
                      <p className="text-xs text-slate-300 dark:text-slate-400 leading-relaxed mb-3">
                        If you're sure this email is correct, try resetting your password. We'll send a secure reset link to your inbox.
                      </p>
                      <button
                        type="button"
                        onClick={handleQuickReset}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#27AAE1] hover:bg-[#0178B7] text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50"
                      >
                        <KeyRound className="w-4 h-4" />
                        Reset password
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {isLogin && (
                <div className="text-right mt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-sm text-goflex-blue hover:text-goflex-blue-dark hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          {showVerificationMessage && (
            <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-sky-800 dark:text-sky-300 mb-1">
                    Check your inbox to verify your email
                  </p>
                  <p className="text-xs text-sky-700 dark:text-sky-400 leading-relaxed">
                    We've sent a confirmation link to {email}. Open it to activate your GoFlexConnect account.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-goflex-blue hover:bg-goflex-blue-dark text-white py-3.5 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-goflex-blue/25 focus:outline-none focus:ring-2 focus:ring-goflex-blue focus:ring-offset-2 focus:ring-offset-goflex-card transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isForgotPassword ? 'Sending reset link...' : isLogin ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              <>
                {isForgotPassword ? (
                  <>
                    <KeyRound className="w-5 h-5" />
                    Send Reset Link
                  </>
                ) : isLogin ? (
                  <>
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create Account
                  </>
                )}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          {isForgotPassword ? (
            <p>
              Remember your password?{' '}
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setIsLogin(true);
                  setError('');
                  setSuccess('');
                }}
                className="text-goflex-blue font-semibold hover:text-goflex-blue-dark hover:underline transition-colors"
              >
                Back to sign in
              </button>
            </p>
          ) : isLogin ? (
            <p>
              Don't have an account?{' '}
              <button
                onClick={() => setIsLogin(false)}
                className="text-goflex-blue font-semibold hover:text-goflex-blue-dark hover:underline transition-colors"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => setIsLogin(true)}
                className="text-goflex-blue font-semibold hover:text-goflex-blue-dark hover:underline transition-colors"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
