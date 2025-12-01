import { AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onStaySignedIn: () => void;
  onSignOut: () => void;
  remainingMinutes?: number;
}

export default function InactivityWarningModal({
  isOpen,
  onStaySignedIn,
  onSignOut,
  remainingMinutes = 5
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
          <div className="flex items-center gap-3 text-white">
            <AlertTriangle className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Session Warning</h2>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-gray-700 dark:text-gray-300 text-lg">
            You've been inactive for a while. You will be logged out in{' '}
            <span className="font-bold text-orange-600 dark:text-orange-400">
              {remainingMinutes} {remainingMinutes === 1 ? 'minute' : 'minutes'}
            </span>{' '}
            unless you continue working.
          </p>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Any unsaved changes may be lost if you're logged out. We recommend staying signed in to preserve your work.
          </p>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onStaySignedIn}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl py-3 px-4 font-semibold hover:shadow-lg hover:shadow-blue-600/25 transition-all"
            >
              Stay Signed In
            </button>
            <button
              onClick={onSignOut}
              className="px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Sign Out Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
