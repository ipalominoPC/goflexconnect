import { useEffect } from 'react';
import { CheckCircle, Globe, Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface ThankYouPageProps {
  onBackToApp: () => void;
}

export default function ThankYouPage({ onBackToApp }: ThankYouPageProps) {
  useEffect(() => {
    const timer = setTimeout(async () => {
      await supabase.auth.signOut();
      setTimeout(() => {
        window.location.href = '/';
      }, 200);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-goflex-bg flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Thank You!
          </h1>

          <p className="text-lg text-slate-600 mb-2">
            Your work has been saved successfully
          </p>

          <p className="text-slate-500">
            All data has been stored locally and will sync when you're back online
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">
            Need Help or Have Questions?
          </h2>

          <div className="space-y-4">
            <a
              href="https://goflexconnect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-blue-600 hover:text-blue-700 transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Globe className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Visit Our Website</div>
                <div className="text-sm text-slate-600">goflexconnect.com</div>
              </div>
            </a>

            <a
              href="mailto:support@goflexconnect.com"
              className="flex items-center gap-3 text-blue-600 hover:text-blue-700 transition-colors group"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Email Support</div>
                <div className="text-sm text-slate-600">support@goflexconnect.com</div>
              </div>
            </a>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onBackToApp}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3.5 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to App
          </button>

          <p className="text-center text-sm text-slate-500">
            We appreciate your use of GoFlexConnect
          </p>
        </div>
      </div>
    </div>
  );
}
