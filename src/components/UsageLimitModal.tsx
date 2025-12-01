import { AlertTriangle, X } from 'lucide-react';

interface UsageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  title: string;
  message: string;
  showUpgrade?: boolean;
}

export default function UsageLimitModal({
  isOpen,
  onClose,
  onUpgrade,
  title,
  message,
  showUpgrade = true,
}: UsageLimitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 dark:bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-semibold transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          {showUpgrade && (
            <button
              onClick={onUpgrade}
              className="px-6 py-2 bg-[#27AAE1] hover:bg-[#0178B7] text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              Upgrade to Pro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
