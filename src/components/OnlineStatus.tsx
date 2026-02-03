import { useState, useEffect } from 'react';
import { Signal, SignalLow, RefreshCw, Wifi } from 'lucide-react';
import { Network } from '@capacitor/network';
import { syncService } from '../services/syncService';

export default function OnlineStatus() {
  const [status, setStatus] = useState<{ connected: boolean; type: string }>({
    connected: true,
    type: 'unknown'
  });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // 1. Initial Check
    const checkNetwork = async () => {
      const status = await Network.getStatus();
      setStatus({ connected: status.connected, type: status.connectionType });
    };
    checkNetwork();

    // 2. Listen for changes
    const handler = Network.addListener('networkStatusChange', (s) => {
      setStatus({ connected: s.connected, type: s.connectionType });
      if (s.connected) {
        setSyncing(true);
        syncService.syncWithServer().finally(() => setSyncing(false));
      }
    });

    return () => {
      handler.remove();
    };
  }, []);

  const isWifi = status.type === 'wifi';
  const isOnline = status.connected;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
      <div
        className={`px-4 py-1.5 rounded-full border backdrop-blur-md flex items-center gap-2.5 transition-all duration-500 shadow-2xl ${
          !isOnline 
            ? 'bg-red-950/80 border-red-500/50 shadow-red-500/20' 
            : isWifi 
              ? 'bg-amber-950/80 border-amber-500/50 shadow-amber-500/20' 
              : 'bg-slate-900/80 border-[#27AAE1]/50 shadow-[#27AAE1]/20'
        }`}
      >
        <div className="relative flex items-center justify-center">
          {isOnline && !isWifi && (
            <div className="absolute inset-0 bg-[#27AAE1] blur-md opacity-50 animate-pulse rounded-full"></div>
          )}
          {syncing ? (
            <RefreshCw className="w-3.5 h-3.5 text-[#27AAE1] animate-spin" />
          ) : !isOnline ? (
            <SignalLow className="w-3.5 h-3.5 text-red-500 relative z-10" />
          ) : isWifi ? (
            <Wifi className="w-3.5 h-3.5 text-amber-500 relative z-10" />
          ) : (
            <Signal className="w-3.5 h-3.5 text-[#27AAE1] relative z-10" />
          )}
        </div>
        
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
          !isOnline ? 'text-red-500' : isWifi ? 'text-amber-500' : 'text-[#27AAE1]'
        }`}>
          {!isOnline ? 'Offline' : isWifi ? 'WiFi Detected' : 'Cellular Live'}
        </span>
      </div>
    </div>
  );
}
