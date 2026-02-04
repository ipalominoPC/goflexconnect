import { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, User, Building2, Phone, ShieldCheck, Briefcase } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useStore } from '../store/useStore';

interface AuthProps {
  onAuthSuccess: () => void;
  initialMode?: 'login' | 'signup';
}

export default function Auth({ onAuthSuccess, initialMode = 'login' }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // IDENTITY GOVERNANCE STATE
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('Field Tech'); // PHASE 5.0 ROLE BINDING

  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const [error, setError] = useState<string | null>(null);
  const setUser = useStore((state) => state.setUser);

  useEffect(() => {
    setIsSignUp(initialMode === 'signup');
  }, [initialMode]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        if (!fullName.trim()) throw new Error('Full Name is mandatory.');

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              company_name: companyName,
              phone_number: phoneNumber,
              role: role, // TASK 5.0: Bind Persona
              billing_tier: 'trial', // Start on Trial Tier
              is_comped: false       // Default paid status
            },
          },
        });
        if (signUpError) throw signUpError;
        if (data.user) {
          setUser(data.user);
          onAuthSuccess();
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        if (signInError) throw signInError;
        if (data.user) {
          setUser(data.user);
          onAuthSuccess();
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-sans relative overflow-hidden">
      
      {/* VERSION VERIFIER TAG */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#27AAE1]/10 border border-[#27AAE1]/30 rounded-full flex items-center gap-2">
         <ShieldCheck size={10} className="text-[#27AAE1]" />
         <span className="text-[8px] font-black text-[#27AAE1] uppercase tracking-widest">Identity Protocol v1.1</span>
      </div>

      <div className="w-full max-w-md mt-10">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-[#27AAE1] blur-[50px] opacity-40 rounded-full animate-pulse"></div>
            <img
              src="/icons/logo-128.png"
              alt="GoFlexConnect"
              className="relative w-24 h-24 rounded-[28px] shadow-[0_0_40px_rgba(39,170,225,0.5)] border-2 border-[#27AAE1]/40"
            />
          </div>

          <h1 className="text-3xl font-black text-white mb-1 force-mixed-case tracking-tight italic">
            GoFlexConnect
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
            {isSignUp ? 'New Asset Registration' : 'Secure HQ Session'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-tighter p-3 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          
          {isSignUp && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-[#27AAE1] transition-all text-white placeholder:text-slate-700 font-bold"
                  placeholder="Full Name (Mandatory)"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              {/* PHASE 5.0: PERSONA SELECTOR */}
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#27AAE1]" />
                <select
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-[#27AAE1] transition-all text-white appearance-none font-bold"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="Field Tech" className="bg-slate-900">Lens: Field Tech</option>
                  <option value="IT Department" className="bg-slate-900">Lens: IT Department</option>
                  <option value="Property Manager" className="bg-slate-900">Lens: Property Manager</option>
                  <option value="End User" className="bg-slate-900">Lens: End User</option>
                </select>
              </div>

              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-[#27AAE1] transition-all text-white placeholder:text-slate-700"
                  placeholder="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="tel"
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-[#27AAE1] transition-all text-white placeholder:text-slate-700"
                  placeholder="Phone Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="email"
              autoComplete="username"
              className="w-full bg-slate-900 border border-white/5 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-[#27AAE1] transition-all text-white placeholder:text-slate-700"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="w-full bg-slate-900 border border-white/5 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-[#27AAE1] transition-all text-white placeholder:text-slate-700"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#27AAE1] text-black py-4 rounded-xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : (isSignUp ? 'Deploy Mission Node' : 'Initialize Session')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#27AAE1] text-[10px] font-black uppercase tracking-widest hover:underline transition-all"
          >
            {isSignUp ? 'Already Verified? Log In' : "New Asset? Request Access"}
          </button>
        </div>
      </div>
    </div>
  );
}