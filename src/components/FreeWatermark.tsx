interface FreeWatermarkProps {
  position?: 'bottom-right' | 'centered' | 'bottom-center';
  variant?: 'overlay' | 'export';
  className?: string;
}

export default function FreeWatermark({
  position = 'bottom-right',
  variant = 'overlay',
  className = ''
}: FreeWatermarkProps) {
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'centered': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
  };

  const baseClasses = variant === 'overlay'
    ? 'absolute pointer-events-none select-none'
    : 'text-center my-2';

  return (
    <div
      className={`${baseClasses} ${positionClasses[position]} ${className}`}
      style={{ opacity: variant === 'overlay' ? 0.24 : 0.5 }}
    >
      <p className="text-xs sm:text-sm text-white dark:text-white font-medium px-3 py-1.5 rounded bg-black/20 dark:bg-black/30 backdrop-blur-sm whitespace-nowrap">
        GoFlexConnect – Upgrade to Pro for watermark-free reports
      </p>
    </div>
  );
}
