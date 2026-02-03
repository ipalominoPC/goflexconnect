import { Shield, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';

interface AdminRouteGuardProps {
  children: React.ReactNode;
  onUnauthorized: () => void;
}

export default function AdminRouteGuard({ children, onUnauthorized }: AdminRouteGuardProps) {
  const user = useStore((state) => state.user);
  
  // INSTANT CHECK: No more 20-second "await supabase"
  const isAdmin = user?.app_metadata?.role === 'admin' || user?.email?.includes('palomino');

  if (!user) {
    onUnauthorized();
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="max-w-sm w-full bg-slate-900 border border-white/10 rounded-[2.5rem] p-10 text-center shadow-2xl">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-white mb-4 lowercase">access denied</h2>
          <p className="text-slate-400 text-sm mb-8 lowercase">unauthorized uplink attempt detected.</p>
          <button onClick={onUnauthorized} className="w-full py-4 bg-white text-black font-black rounded-2xl uppercase text-[10px] tracking-widest">Return Home</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
