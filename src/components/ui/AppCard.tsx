import { ReactNode } from 'react';

interface AppCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export default function AppCard({ children, className = '', onClick, disabled = false }: AppCardProps) {
  const baseClasses = 'rounded-3xl bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-50 border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-900/5 dark:shadow-black/40 transition-colors duration-300 ease-in-out';

  const interactiveClasses = onClick && !disabled
    ? 'hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-xl cursor-pointer'
    : '';

  const disabledClasses = disabled
    ? 'opacity-70 cursor-not-allowed'
    : '';

  const combinedClasses = `${baseClasses} ${interactiveClasses} ${disabledClasses} ${className}`.trim();

  if (onClick && !disabled) {
    return (
      <button onClick={onClick} className={combinedClasses}>
        {children}
      </button>
    );
  }

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
}
