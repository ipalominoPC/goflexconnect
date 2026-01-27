import { useState } from 'react';
import { ArrowLeft, User, Lock, Bell, Shield, LogOut, Save, Eye, EyeOff, Download } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase } from '../services/supabaseClient';

export default function Settings({ onBack }: { onBack: () => void }) {
  const { user, setUser } = useStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [exportMessage, setExportMessage] = useState('');

  const handleExportData = async () => {
    try {
      setLoading(true);
      setMessage('');
      setExportMessage('');
      const fileName = `goflexconnect-backup-${new Date().toISOString().split('T')[0]}.json`;

      const { projects, floors, measurements } = useStore.getState();
      const exportData = {
        exportDate: new Date().toISOString(),
        user: user?.email,
        projects,
        floors,
        measurements,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setExportMessage('✅ Backup saved successfully! • 📁 File: ' + fileName + ' • 📍 Location: Downloads folder • 📊 Exported: ' + measurements.length + ' measurements, ' + projects.length + ' projects, ' + floors.length + ' floors');
      setLoading(false);
    } catch (error) {
      setExportMessage('❌ Export failed: ' + error.message);
      setLoading(false);
    }
  };

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
        <div className="bg-slate-900 rounded-2xl p-6 border border-white/5">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-[#27AAE1]/10 rounded-xl border border-[#27AAE1]/20">
              <User className="w-6 h-6 text-[#27AAE1]" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">Account</p>
              <p className="text-sm font-bold">{user?.email}</p>
            </div>
          </div>
          {message && (
            <p className={`text-[10px] font-bold uppercase tracking-widest ${message.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
              {message}
            </p>
          )}
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 border border-[#27AAE1]/30 shadow-lg shadow-[#27AAE1]/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-[#27AAE1] to-[#1d8bb8] rounded-xl shadow-lg shadow-[#27AAE1]/50">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] text-[#27AAE1] font-black uppercase tracking-widest">Backup & Export</p>
              <p className="text-xs text-slate-400 font-medium">Secure your survey data locally</p>
            </div>
          </div>
          <button
            onClick={handleExportData}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#27AAE1] to-[#1d8bb8] hover:from-[#1d8bb8] hover:to-[#27AAE1] rounded-xl text-sm font-black uppercase tracking-widest text-white disabled:opacity-50 flex items-center justify-center gap-3 transition-all duration-300 shadow-lg shadow-[#27AAE1]/50 hover:shadow-xl hover:shadow-[#27AAE1]/75 hover:scale-105 border-2 border-[#27AAE1]/50"
          >
            <Download className="w-5 h-5 animate-bounce" />
            {loading ? "EXPORTING..." : "EXPORT ALL DATA"}
          </button>
          {exportMessage && (
            <p className="mt-4 text-[10px] text-green-400 font-semibold leading-relaxed">
              {exportMessage}
            </p>
          )}
        </div>

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

        <div className="px-4 py-6 text-center space-y-2">
          <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
            You are responsible for backing up your data.
          </p>
          <p className="text-[9px] text-slate-600 font-normal leading-relaxed">
            GoFlexConnect and its affiliates are not liable for any data loss. Data is stored locally and synced to the cloud when online.
          </p>
        </div>

        <button onClick={handleSignOut} className="w-full py-4 bg-red-600/10 border border-red-600/20 rounded-2xl text-red-500 font-black text-sm uppercase flex items-center justify-center gap-2">
          <LogOut className="w-5 h-5" /> Sign Out
        </button>
      </div>
    </div>
  );
}
