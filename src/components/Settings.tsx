import { useState, useRef } from 'react';
import { ArrowLeft, User, Lock, Shield, LogOut, Download, Eye, EyeOff, Settings as SettingsIcon, Globe, Beaker, Gauge, X, LayoutDashboard, Activity } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase } from '../services/supabaseClient';

interface SettingsProps {
  onBack: () => void;
  onShowDiagnostics: () => void;
  onNavigateToAdmin?: () => void;
}

export default function Settings({ onBack, onShowDiagnostics, onNavigateToAdmin }: SettingsProps) {
  const { user, setUser } = useStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleLongPressStart = () => {
    if (!user || user.app_metadata?.role !== 'admin') return;
    pressTimer.current = setTimeout(() => setShowAdminModal(true), 3000);
  };

  const handleLongPressEnd = () => { if (pressTimer.current) clearTimeout(pressTimer.current); };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await supabase.auth.updateUser({ password: newPassword });
      setMessage('Security Vault Updated');
      setNewPassword('');
    } catch (e) { setMessage('Update failed'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pt-12 relative overflow-hidden font-inter">
      <button onClick={onBack} className="text-slate-400 mb-8 uppercase text-[10px] font-black tracking-widest flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h1 className="text-3xl font-black mb-8 tracking-tighter">Settings</h1>

      <div className="space-y-6 relative z-10">
        {/* ACCOUNT CARD */}
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#27AAE1]/10 rounded-xl border border-[#27AAE1]/20"><User className="w-6 h-6 text-[#27AAE1]" /></div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Account</p>
              <p className="text-sm font-bold">{user?.email}</p>
              {user?.app_metadata?.role === 'admin' && <span className="text-[8px] bg-[#27AAE1] text-white px-2 py-0.5 rounded font-black mt-1 inline-block uppercase">System Admin</span>}
            </div>
          </div>
        </div>

        {/* SECURITY VAULT */}
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
          <form onSubmit={handleUpdatePassword} className="space-y-4">
             <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="NEW MASTER PASSWORD" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-[#27AAE1]/50" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button type="submit" className="w-full py-3 bg-slate-800 border border-[#27AAE1]/30 rounded-xl text-[10px] font-black text-[#27AAE1] uppercase tracking-[0.2em]">RE-KEY SECURITY VAULT</button>
          </form>
        </div>

        {/* DEVELOPER TOOLS */}
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20"><SettingsIcon className="w-6 h-6 text-orange-500" /></div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Developer Tools</p>
              <p className="text-sm font-bold">Testing & Debug</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                useStore.getState().setHasCompletedOnboarding(false);
                alert('✅ Onboarding reset - restart app to see tutorial');
              }}
              className="w-full py-3 bg-orange-800/20 border border-orange-500/30 rounded-xl text-[10px] font-black text-orange-400 uppercase tracking-[0.2em]"
            >
              Reset Onboarding Tutorial
            </button>

            <button
              onClick={onShowDiagnostics}
              className="w-full py-3 bg-[#27AAE1]/10 border border-[#27AAE1]/30 rounded-xl text-[10px] font-black text-[#27AAE1] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
            >
              <Activity className="w-3 h-3" /> System Diagnostics
            </button>
          </div>
        </div>

        {/* SYSTEM INFO (LONG PRESS TRIGGER) */}
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
          <div className="flex justify-between items-center p-1" onMouseDown={handleLongPressStart} onMouseUp={handleLongPressEnd} onTouchStart={handleLongPressStart} onTouchEnd={handleLongPressEnd}>
            <span className="text-slate-400 text-sm">Environment</span>
            <span className="text-slate-200 font-mono text-xs font-bold tracking-widest">S24-HARDWARE</span>
          </div>
        </div>
      </div>

      {/* ADMIN VAULT MODAL */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl bg-black/80">
          <div className="w-full max-w-md bg-slate-900 border border-[#27AAE1]/40 rounded-[2.5rem] p-8 shadow-[0_0_80px_rgba(39,170,225,0.25)] relative overflow-hidden">
            <div className="flex justify-between items-start mb-10 relative z-10">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tighter italic">ADMIN VAULT</h2>
                <div className="h-1 w-12 bg-[#27AAE1] mt-1 rounded-full shadow-[0_0_10px_#27AAE1]" />
              </div>
              <button onClick={() => setShowAdminModal(false)} className="p-2 bg-white/5 rounded-full text-slate-400"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-6 relative z-10">
              <button
                onClick={() => { setShowAdminModal(false); onNavigateToAdmin?.(); }}
                className="w-full py-6 bg-gradient-to-br from-[#27AAE1] to-[#1d8bb8] text-white rounded-3xl flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all"
              >
                <div className="p-3 bg-white/20 rounded-xl"><LayoutDashboard className="w-6 h-6" /></div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Full Access</p>
                  <p className="text-sm font-black uppercase">Launch Mission Control</p>
                </div>
              </button>

              <button onClick={() => setShowAdminModal(false)} className="w-full py-4 text-slate-500 font-black text-[10px] uppercase tracking-widest">Seal Vault</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
