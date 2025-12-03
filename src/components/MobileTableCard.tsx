import { ReactNode } from 'react';

interface MobileTableCardProps {
  items: Array<{
    label: string;
    value: ReactNode;
  }>;
  onClick?: () => void;
  className?: string;
}

export default function MobileTableCard({ items, onClick, className = '' }: MobileTableCardProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 ${
        onClick ? 'hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-98 transition-all touch-target' : ''
      } ${className}`}
    >
      {items.map((item, index) => (
        <div key={index} className="flex justify-between items-start gap-4">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 flex-shrink-0">
            {item.label}
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 text-right">
            {item.value}
          </span>
        </div>
      ))}
    </Component>
  );
}
