import { useState } from 'react';
import { ArrowLeft, User, Lock, Bell, Shield, LogOut, Save } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase } from '../services/supabaseClient';

export default function Settings({ onBack }: { onBack: () => void }) {
  const { user, setUser } = useStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pt-12">
      <button onClick={onBack} className="flex items-center text-slate-400 mb-8 uppercase text-[10px] font-black tracking-widest">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </button>

      <h1 className="text-3xl font-black mb-8">Settings</h1>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-[#27AAE1]/10 rounded-xl border border-[#27AAE1]/20">
              <User className="w-6 h-6 text-[#27AAE1]" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Account</p>
              <p className="text-sm font-bold">{user?.email}</p>
            </div>
          </div>
          
          <button className="w-full py-3 bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-300">
            Change Password
          </button>
        </div>

        {/* Info Section */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-white/5">
          <h3 className="text-[10px] text-slate-500 font-bold uppercase mb-4 tracking-widest">App Information</h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-slate-400">Version</span>
              <span className="font-mono">2.0.1-PRO</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Environment</span>
              <span className="text-green-500 font-bold">S24-HARDWARE</span>
            </div>
          </div>
        </div>

        <button onClick={handleSignOut} className="w-full py-4 bg-red-600/10 border border-red-600/20 rounded-2xl text-red-500 font-black text-sm uppercase flex items-center justify-center gap-2">
          <LogOut className="w-5 h-5" /> Sign Out
        </button>
      </div>
    </div>
  );
}
