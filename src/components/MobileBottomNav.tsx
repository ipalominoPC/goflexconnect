import { Home, Folder, Gauge, HelpCircle, User } from 'lucide-react';

interface MobileBottomNavProps {
  currentView: string;
  onNavigate: (view: 'menu' | 'projects' | 'speedTest' | 'support' | 'settings') => void;
}

export default function MobileBottomNav({ currentView, onNavigate }: MobileBottomNavProps) {
  const navItems = [
    { id: 'menu', icon: Home, label: 'Home' },
    { id: 'projects', icon: Folder, label: 'Projects' },
    { id: 'speedTest', icon: Gauge, label: 'Speed Test' },
    { id: 'support', icon: HelpCircle, label: 'Support' },
    { id: 'settings', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 safe-area-inset-bottom">
      <div className="flex justify-around items-center h-24 pb-8 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as any)}
              className={`flex flex-col items-center justify-center flex-1 h-full min-w-[44px] transition-colors ${
                isActive
                  ? 'text-goflex-blue'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              aria-label={item.label}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}







