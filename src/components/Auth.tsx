import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useStore } from '../store/useStore';

export default function Auth({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUser = useStore((state) => state.setUser);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        setUser(data.user);
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-8 text-center">
          {/* THE GLOWING LOGO */}
          <div className="mb-6 p-1 bg-[#27AAE1]/10 rounded-[28px] shadow-[0_0_20px_rgba(39,170,225,0.4)] border border-[#27AAE1]/20">
            <img 
              src="/icons/logo-128.png" 
              alt="GoFlexConnect" 
              className="w-20 h-20 rounded-[24px] shadow-[0_0_10px_rgba(39,170,225,0.6)]" 
            />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">GoFlexConnect</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Professional Signal Surveying</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                autoComplete="username"
                className="w-full bg-slate-800 border border-white/5 rounded-xl pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-[#27AAE1] transition-all text-white font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="w-full bg-slate-800 border border-white/5 rounded-xl pl-10 pr-12 py-3 outline-none focus:ring-2 focus:ring-[#27AAE1] transition-all text-white font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#27AAE1]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#27AAE1] text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#1C82AD] transition-all active:scale-95 shadow-lg shadow-[#27AAE1]/20 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (isSignUp ? 'Create Account' : 'Log In')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#27AAE1] text-[10px] font-black uppercase tracking-tighter hover:underline"
          >
            {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Join Beta"}
          </button>
        </div>
      </div>
    </div>
  );
}
