import { useState } from 'react';
import { LogIn, UserPlus, Loader2, KeyRound } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

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
        if (error) throw error;
        onAuthSuccess();
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <img
            src="/GFConnect.PNG"
            alt="GoFlexConnect Logo"
            className="h-32 w-auto mx-auto mb-6"
          />
          <p className="text-black text-lg font-sans">Cellular Signal Survey & Analysis Tool</p>
        </div>

        {!isForgotPassword && (
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                isLogin
                  ? 'bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                !isLogin
                  ? 'bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {isForgotPassword && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h2>
            <p className="text-slate-600 text-sm">Enter your email address and we'll send you a password reset link.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
              placeholder="you@example.com"
            />
          </div>

          {!isForgotPassword && (
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900"
                placeholder="••••••••"
              />
              {!isLogin && (
                <p className="text-xs text-slate-500 mt-2">Minimum 6 characters</p>
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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white py-3.5 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-goflex-blue/25 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-goflex-blue focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
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

        <div className="mt-6 text-center text-sm text-slate-600">
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
