import { ReactNode } from 'react';

interface AppLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
}

export default function AppLayout({ children, showBottomNav = false }: AppLayoutProps) {
  return (
    <div className={`mobile-full-height bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 transition-colors duration-500 ease-in-out ${showBottomNav ? 'mobile-container' : ''}`}>
      {children}
    </div>
  );
}
