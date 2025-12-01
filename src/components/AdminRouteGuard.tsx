import { useEffect, useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { isAdminEmail } from '../config/admin';

interface AdminRouteGuardProps {
  children: React.ReactNode;
  onUnauthorized: () => void;
}

export default function AdminRouteGuard({ children, onUnauthorized }: AdminRouteGuardProps) {
  const [checking, setChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // Not logged in - redirect to auth
          onUnauthorized();
          return;
        }

        if (!isAdminEmail(user.email)) {
          // Logged in but not an admin - redirect away
          onUnauthorized();
          return;
        }

        // User is an authorized admin
        setIsAuthorized(true);
      } catch (error) {
        console.error('Admin access check failed:', error);
        onUnauthorized();
      } finally {
        setChecking(false);
      }
    };

    checkAdminAccess();
  }, [onUnauthorized]);

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-[#27AAE1] mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400 font-semibold">
            Verifying admin access...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Access Denied
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You do not have permission to access the Admin Dashboard.
          </p>
          <button
            onClick={onUnauthorized}
            className="px-6 py-3 bg-[#27AAE1] hover:bg-[#0178B7] text-white font-semibold rounded-lg transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
