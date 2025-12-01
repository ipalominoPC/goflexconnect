import { useState, useEffect } from 'react';
import { Folder, Gauge, Settings as SettingsIcon, LogOut, Calculator, Compass, HelpCircle, BarChart3, FileText, Shield } from 'lucide-react';
import Chatbot, { ChatbotButton } from './Chatbot';
import SupportForm from './SupportForm';
import ThemeToggle from './ThemeToggle';
import HouseAdBanner from './HouseAdBanner';
import UpgradeProModal from './UpgradeProModal';
import EmailVerificationBanner from './EmailVerificationBanner';
import OnboardingModal from './OnboardingModal';
import { useStore } from '../store/useStore';
import { supabase } from '../services/supabaseClient';
import { logSessionEvent } from '../services/sessionTracking';
import { isAdminEmail } from '../config/admin';
import { useOnboarding } from '../hooks/useOnboarding';

interface MenuProps {
  onSelectFeature: (feature: 'projects' | 'speedTest' | 'linkBudget' | 'cellTowerCompass' | 'analytics' | 'reports' | 'admin') => void;
  onSettings: () => void;
  onFinish: () => void;
}

export default function Menu({ onSelectFeature, onSettings, onFinish }: MenuProps) {
  const settings = useStore((state) => state.settings);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [showVerificationBanner, setShowVerificationBanner] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Onboarding state
  const { loading: onboardingLoading, isCompleted, isAdmin: onboardingIsAdmin, completeOnboarding } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const checkEmailVerification = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || null);
        setIsEmailVerified(user.email_confirmed_at != null);
        setIsAdmin(isAdminEmail(user.email));
      }
    };
    checkEmailVerification();
  }, []);

  // Show onboarding modal for non-admin users who haven't completed it
  useEffect(() => {
    if (!onboardingLoading && !onboardingIsAdmin && !isCompleted) {
      setShowOnboarding(true);
    }
  }, [onboardingLoading, onboardingIsAdmin, isCompleted]);

  const handleFinish = async () => {
    await logSessionEvent({ eventType: 'sign_out' });
    onFinish();
  };

  return (
    <div className="min-h-screen bg-goflex-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <ThemeToggle />
          <button
            onClick={() => setSupportOpen(true)}
            className="w-12 h-12 bg-goflex-card border border-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
            aria-label="Contact Support"
            title="Contact Support"
          >
            <HelpCircle className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={handleFinish}
            className="w-12 h-12 bg-goflex-card border border-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
            aria-label="Finish for now"
            title="Finish for now"
          >
            <LogOut className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={onSettings}
            className="w-12 h-12 bg-goflex-card border border-gray-700 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
            aria-label="Settings"
          >
            <SettingsIcon className="w-6 h-6 text-white" />
          </button>
        </div>

        {!isEmailVerified && showVerificationBanner && userEmail && (
          <EmailVerificationBanner
            userEmail={userEmail}
            onDismiss={() => setShowVerificationBanner(false)}
          />
        )}

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <img
                src="/icons/logo-128.png"
                alt="GoFlexConnect logo"
                className="h-20 w-20 rounded-3xl shadow-lg"
              />
            </div>
            <h1 className="text-5xl font-bold text-white dark:text-white mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              GoFlexConnect
            </h1>
            <p className="text-gray-400 text-lg">
              Select a feature to get started
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button
              onClick={() => onSelectFeature('projects')}
              className="group bg-goflex-card border border-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl hover:border-goflex-blue transition-all duration-300 hover:-translate-y-1 text-left"
            >
              <div className="w-16 h-16 bg-goflex-blue/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Folder className="w-8 h-8 text-goflex-blue" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Survey Projects
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Create and manage site survey projects, upload floor plans, collect measurements, and generate heatmaps
              </p>
            </button>

            <button
              onClick={() => onSelectFeature('speedTest')}
              className="group bg-goflex-card border border-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl hover:border-goflex-blue transition-all duration-300 hover:-translate-y-1 text-left"
            >
              <div className="w-16 h-16 bg-goflex-blue/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Gauge className="w-8 h-8 text-goflex-blue" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Speed Test
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Test your network speed and view detailed cellular metrics including signal strength and network information
              </p>
            </button>

            <button
              onClick={() => onSelectFeature('linkBudget')}
              className="group bg-goflex-card border border-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl hover:border-goflex-blue transition-all duration-300 hover:-translate-y-1 text-left"
            >
              <div className="w-16 h-16 bg-goflex-blue/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calculator className="w-8 h-8 text-goflex-blue" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Link Budget
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Calculate RF link budgets with path loss models for LTE and 5G network planning
              </p>
            </button>

            <button
              onClick={() => onSelectFeature('cellTowerCompass')}
              className="group bg-goflex-card border border-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl hover:border-goflex-blue transition-all duration-300 hover:-translate-y-1 text-left"
            >
              <div className="w-16 h-16 bg-goflex-blue/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Compass className="w-8 h-8 text-goflex-blue" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Cell Tower Compass
              </h2>
              <p className="text-gray-400 leading-relaxed">
                Find and navigate to nearby cell towers with compass direction guidance
              </p>
            </button>

            <button
              onClick={() => onSelectFeature('analytics')}
              className="group bg-goflex-card border border-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl hover:border-goflex-blue transition-all duration-300 hover:-translate-y-1 text-left"
            >
              <div className="w-16 h-16 bg-goflex-blue/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-8 h-8 text-goflex-blue" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Analytics
              </h2>
              <p className="text-gray-400 leading-relaxed">
                View comprehensive insights and AI-powered analysis of your survey data
              </p>
            </button>

            <button
              onClick={() => onSelectFeature('reports')}
              className="group bg-goflex-card border border-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-xl hover:border-goflex-blue transition-all duration-300 hover:-translate-y-1 text-left"
            >
              <div className="w-16 h-16 bg-goflex-blue/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 text-goflex-blue" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Reports
              </h2>
              <p className="text-gray-400 leading-relaxed">
                View user signups, survey volume, quality metrics, and sites needing attention
              </p>
            </button>

            {isAdmin && (
              <button
                onClick={() => onSelectFeature('admin')}
                className="group bg-goflex-card border border-red-800 rounded-2xl p-8 shadow-lg hover:shadow-xl hover:border-red-600 transition-all duration-300 hover:-translate-y-1 text-left"
              >
                <div className="w-16 h-16 bg-red-500/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  Admin Dashboard
                </h2>
                <p className="text-gray-400 leading-relaxed">
                  Secure access to session logs, user activity, and advanced reports
                </p>
              </button>
            )}
          </div>

          {settings.plan !== 'pro' && (
            <div className="mt-8">
              <HouseAdBanner onUpgradeClick={() => setUpgradeModalOpen(true)} />
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              More features coming soon
            </p>
          </div>
        </div>

        {!chatbotOpen && <ChatbotButton onClick={() => setChatbotOpen(true)} />}
        <Chatbot isOpen={chatbotOpen} onClose={() => setChatbotOpen(false)} />
        {supportOpen && <SupportForm onClose={() => setSupportOpen(false)} />}
        <UpgradeProModal isOpen={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />

        {/* Onboarding Modal */}
        <OnboardingModal
          open={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={async () => {
            await completeOnboarding();
            setShowOnboarding(false);
            onSelectFeature('projects');
          }}
        />
      </div>
    </div>
  );
}
