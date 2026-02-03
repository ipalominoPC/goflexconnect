import { Home, Folder, Gauge, HelpCircle, User, Shield } from 'lucide-react';
import { useStore } from '../store/useStore';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: 'menu' | 'projects' | 'speedTest' | 'support' | 'settings' | 'admin') => void;
}

export default function MobileBottomNav({ currentView, onNavigate }: MobileBottomNavProps) {
  const user = useStore((state) => state.user);
  const isAdmin = user?.app_metadata?.role === 'admin';

  const navItems = [
    { id: 'menu', icon: Home, label: 'Home' },
    { id: 'projects', icon: Folder, label: 'Projects' },
    { id: 'speedTest', icon: Gauge, label: 'Speed' },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', icon: Shield, label: 'Admin' });
  }

  navItems.push({ id: 'settings', icon: User, label: 'Profile' });

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/5 z-[999] px-2 pb-8 pt-3">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || (item.id === 'projects' && currentView === 'projectList');
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                isActive ? 'text-[#27AAE1]' : 'text-slate-600'
              }`}
            >
              <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-[#27AAE1]/10 shadow-[0_0_20px_rgba(39,170,225,0.25)]' : ''}`}>
                <Icon className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
              </div>
              <span className="text-[9px] font-black uppercase mt-1 tracking-widest">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
