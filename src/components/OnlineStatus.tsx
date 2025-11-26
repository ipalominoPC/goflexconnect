import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react';
import { syncService } from '../services/syncService';

export default function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    const unsubscribe = syncService.onOnlineStatusChange((online) => {
      setIsOnline(online);
      if (online) {
        performSync();
      }
    });

    return unsubscribe;
  }, []);

  const performSync = async () => {
    setSyncing(true);
    try {
      await syncService.syncWithServer();
      setLastSync(new Date());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div
      className={`fixed top-4 left-4 z-50 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium transition-all ${
        isOnline
          ? 'bg-emerald-500 text-white'
          : 'bg-amber-500 text-white'
      }`}
    >
      {syncing ? (
        <>
          <Cloud className="w-4 h-4 animate-pulse" />
          <span>Syncing...</span>
        </>
      ) : isOnline ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Offline Mode</span>
        </>
      )}
    </div>
  );
}
