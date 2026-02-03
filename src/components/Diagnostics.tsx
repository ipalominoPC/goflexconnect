import React, { useEffect, useState } from 'react';
import { ArrowLeft, Radio, Database, Cpu, ShieldCheck, Zap, Activity } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getCellularSignal } from '../services/cellularSignalService';

console.log('🐛 [DIAGNOSTICS] Component file loading...');

interface DiagnosticsProps {
  onBack: () => void;
}

export default function Diagnostics({ onBack }: DiagnosticsProps) {
  console.log('🐛 [DIAGNOSTICS] Component rendering...');

  const { measurements = [], settings } = useStore();
  const [uptime, setUptime] = useState(0);
  const [liveSignal, setLiveSignal] = useState<any>(null);

  useEffect(() => {
    console.log('🐛 [DIAGNOSTICS] useEffect triggered - mounting component');

    // 1. System Uptime
    const timer = setInterval(() => setUptime(prev => prev + 1), 1000);

    // 2. Poll signal every 1 second
    const pollInterval = setInterval(async () => {
      try {
        const signal = await getCellularSignal();
        console.log('🐛 [DIAGNOSTICS] Signal update:', signal);
        setLiveSignal(signal);
      } catch (err) {
        console.error('🐛 [DIAGNOSTICS] Signal poll error:', err);
      }
    }, 1000);

    return () => {
      console.log('🐛 [DIAGNOSTICS] Component unmounting');
      clearInterval(timer);
      clearInterval(pollInterval);
    };
  }, []);

  // DATA MAPPING
  const carrier = liveSignal?.carrier || 'INITIALIZING...';
  const tech = liveSignal?.technology || 'CONNECTING...';
  const bridgeStatus = liveSignal ? 'LIVE' : 'SYNCING';

  const rsrpValue = liveSignal?.rsrp;
  const rsrqValue = liveSignal?.rsrq;
  const sinrValue = liveSignal?.sinr;

  const rsrpDisplay = rsrpValue !== undefined && rsrpValue !== null ? String(rsrpValue) : '--';
  const rsrqDisplay = rsrqValue !== undefined && rsrqValue !== null ? String(rsrqValue) : '--';
  const sinrDisplay = sinrValue !== undefined && sinrValue !== null ? String(sinrValue) : '--';

  const rsrpNumber = rsrpValue !== undefined && rsrpValue !== null ? Number(rsrpValue) : null;

  console.log('🐛 [DIAGNOSTICS] Display values:', {
    carrier,
    rsrpDisplay,
    rsrqDisplay,
    sinrDisplay,
    tech,
    bridgeStatus
  });

  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pt-12 font-inter relative overflow-hidden">
      {/* HEADER */}
      <button onClick={onBack} className="text-slate-400 mb-6 uppercase text-[10px] font-black tracking-widest flex items-center gap-2 relative z-10">
        <ArrowLeft className="w-4 h-4" /> Exit
      </button>

      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
          <h1 className="text-2xl font-black tracking-tighter italic uppercase text-white">System HUD</h1>
          <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${bridgeStatus === 'LIVE' ? 'text-[#27AAE1]' : 'text-orange-500'}`}>
            Bridge: {bridgeStatus}
          </p>
        </div>

        {/* PRESERVED: 6-LEG BUG BOX */}
        <div className="relative w-16 h-16 bg-slate-900/50 rounded-2xl border border-[#27AAE1]/30 flex items-center justify-center overflow-hidden">
          <svg width="40" height="40" viewBox="0 0 100 100" className="relative z-10 drop-shadow-[0_0_10px_#27AAE1]">
            <style>{`
              @keyframes scuttle { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } }
              .leg { stroke: #27AAE1; stroke-width: 5; stroke-linecap: round; fill: none; animation: scuttle 0.2s infinite ease-in-out; transform-origin: 50px 50px; }
              .leg-mid { animation-delay: 0.05s; } .leg-bot { animation-delay: 0.1s; }
            `}</style>
            <path className="leg" d="M35 40 L15 30" /><path className="leg leg-mid" d="M32 50 L10 50" /><path className="leg leg-bot" d="M35 60 L15 75" />
            <path className="leg" d="M65 40 L85 30" /><path className="leg leg-mid" d="M68 50 L90 50" /><path className="leg leg-bot" d="M65 60 L85 75" />
            <path d="M50 30 C40 30 35 45 35 55 C35 65 42 75 50 75 C58 75 65 65 65 55 C65 45 60 30 50 30" fill="#27AAE1" />
            <circle cx="50" cy="38" r="7" fill="#27AAE1" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4">
          <Radio className="w-3 h-3 text-[#27AAE1] mb-2" />
          <p className="text-lg font-black text-white truncate">{carrier}</p>
          <p className="text-[9px] font-mono text-[#27AAE1] uppercase">{tech}</p>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4">
          <Zap className="w-3 h-3 text-yellow-500 mb-2" />
          <p className="text-lg font-black text-white">
            {rsrpDisplay} <span className="text-[10px] text-slate-500">dBm</span>
          </p>
          <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all duration-300"
              style={{ width: rsrpNumber !== null ? `${Math.min(100, Math.max(0, (rsrpNumber + 140)))}%` : '0%' }}
            ></div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4">
          <ShieldCheck className="w-3 h-3 text-[#27AAE1] mb-2" />
          <p className="text-sm font-black text-white">
            RSRQ: {rsrqDisplay} <span className="text-[9px] text-slate-500">dB</span>
          </p>
          <p className="text-sm font-black text-white mt-1">
            SINR: {sinrDisplay} <span className="text-[9px] text-slate-500">dB</span>
          </p>
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4">
          <Cpu className="w-3 h-3 text-purple-500 mb-2" />
          <p className="text-lg font-black text-white">{formatUptime(uptime)}</p>
        </div>
      </div>

      <div className="bg-[#27AAE1]/5 border border-[#27AAE1]/20 rounded-2xl p-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-[#27AAE1]" />
          <p className="text-xs font-bold text-white">{measurements.length} Records</p>
        </div>
        <Activity className="w-4 h-4 text-[#27AAE1] animate-pulse" />
      </div>
    </div>
  );
}