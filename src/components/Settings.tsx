import { useState, useEffect } from 'react';
import { ArrowLeft, Settings as SettingsIcon, Bug, Download, Upload, LogOut, HelpCircle, Crown, RotateCcw, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';
import { MetricType } from '../types';
import { exportAllData, importData, supabase } from '../services/supabaseClient';
import SupportForm from './SupportForm';
import UpgradeProModal from './UpgradeProModal';
import { useOnboarding } from '../hooks/useOnboarding';
import { resolveUserPlan, ResolvedPlan } from '../services/planService';

interface SettingsProps {
  onBack: () => void;
  onShowDiagnostics: () => void;
}

export default function Settings({ onBack, onShowDiagnostics }: SettingsProps) {
  const user = useStore((state) => state.user);
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);

  const [rsrpGood, setRsrpGood] = useState(settings.thresholds.rsrp.good);
  const [rsrpFair, setRsrpFair] = useState(settings.thresholds.rsrp.fair);
  const [sinrGood, setSinrGood] = useState(settings.thresholds.sinr.good);
  const [sinrFair, setSinrFair] = useState(settings.thresholds.sinr.fair);
  const [defaultMetric, setDefaultMetric] = useState<MetricType>(settings.defaultMetric);
  const [autosaveEnabled, setAutosaveEnabled] = useState(settings.autosaveEnabled !== false);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(settings.sessionTimeoutMinutes || 30);
  const [supportOpen, setSupportOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Onboarding hook
  const { isAdmin, resetOnboarding } = useOnboarding();
  const [resetting, setResetting] = useState(false);

  // Plan detection
  const [resolvedPlan, setResolvedPlan] = useState<ResolvedPlan | null>(null);

  useEffect(() => {
    if (user) {
      resolveUserPlan(user.id).then(setResolvedPlan);
    }
  }, [user]);

  const handleSave = () => {
    updateSettings({
      thresholds: {
        rsrp: {
          good: rsrpGood,
          fair: rsrpFair,
        },
        sinr: {
          good: sinrGood,
          fair: sinrFair,
        },
      },
      defaultMetric,
      autosaveEnabled,
      sessionTimeoutMinutes,
    });
    onBack();
  };

  const handleReset = () => {
    setRsrpGood(-90);
    setRsrpFair(-110);
    setSinrGood(10);
    setSinrFair(0);
    setDefaultMetric('rsrp');
  };

  const handleReplayOnboarding = async () => {
    if (isAdmin) return; // Admins shouldn't see onboarding

    setResetting(true);
    try {
      await resetOnboarding();
      // Refresh the page to trigger onboarding modal
      window.location.reload();
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
      alert('Failed to reset onboarding. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `goflexconnect-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        await importData(text);
        alert('Data imported successfully!');
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import data. Please check the file format.');
      }
    };
    input.click();
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50/30">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="group flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-goflex-blue to-goflex-blue-dark rounded-2xl flex items-center justify-center shadow-lg shadow-goflex-blue/20">
              <SettingsIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 text-base mt-1">Configure thresholds and defaults</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-5">RSRP Thresholds (dBm)</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Good (minimum value)
                  </label>
                  <input
                    type="number"
                    value={rsrpGood}
                    onChange={(e) => setRsrpGood(Number(e.target.value))}
                    className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-goflex-blue/20 focus:border-goflex-blue transition-all text-base font-semibold"
                  />
                  <p className="text-sm text-gray-500 mt-2">Values ≥ this are considered good</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Fair (minimum value)
                  </label>
                  <input
                    type="number"
                    value={rsrpFair}
                    onChange={(e) => setRsrpFair(Number(e.target.value))}
                    className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-goflex-blue/20 focus:border-goflex-blue transition-all text-base font-semibold"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Values between this and good are fair; below is poor
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-5">SINR Thresholds (dB)</h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Good (minimum value)
                  </label>
                  <input
                    type="number"
                    value={sinrGood}
                    onChange={(e) => setSinrGood(Number(e.target.value))}
                    className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-goflex-blue/20 focus:border-goflex-blue transition-all text-base font-semibold"
                  />
                  <p className="text-sm text-gray-500 mt-2">Values ≥ this are considered good</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Fair (minimum value)
                  </label>
                  <input
                    type="number"
                    value={sinrFair}
                    onChange={(e) => setSinrFair(Number(e.target.value))}
                    className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-goflex-blue/20 focus:border-goflex-blue transition-all text-base font-semibold"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Values between this and good are fair; below is poor
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-5">Default Metric</h3>
              <select
                value={defaultMetric}
                onChange={(e) => setDefaultMetric(e.target.value as MetricType)}
                className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-goflex-blue/20 focus:border-goflex-blue transition-all text-base font-semibold"
              >
                <option value="rsrp">RSRP</option>
                <option value="rsrq">RSRQ</option>
                <option value="sinr">SINR</option>
                <option value="rssi">RSSI</option>
              </select>
              <p className="text-sm text-gray-500 mt-2">
                This metric will be shown by default in heatmap view
              </p>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={handleReset}
              className="flex-1 px-6 py-4 border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              Reset to Defaults
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-goflex-blue/25 hover:scale-[1.01] transition-all duration-200"
            >
              Save Settings
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Form & Session Settings</h2>

          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Enable Autosave</h3>
                <p className="text-sm text-gray-600">
                  Automatically save form drafts to prevent data loss if your session expires or browser refreshes.
                  Drafts are saved locally on your device.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={autosaveEnabled}
                  onChange={(e) => setAutosaveEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Session Timeout</h3>
              <p className="text-sm text-gray-600 mb-4">
                You'll receive a warning 5 minutes before being logged out due to inactivity.
              </p>
              <select
                value={sessionTimeoutMinutes}
                onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-goflex-blue/20 focus:border-goflex-blue transition-all text-base font-semibold"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={120}>2 hours</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Management</h2>
          <p className="text-gray-600 mb-6">
            Export your data to back it up to your device or cloud storage of choice. Import previously exported data to restore it.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/25 hover:scale-[1.01] transition-all duration-200"
            >
              <Download className="w-5 h-5" />
              Export Data
            </button>
            <button
              onClick={handleImport}
              className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-emerald-500/25 hover:scale-[1.01] transition-all duration-200"
            >
              <Upload className="w-5 h-5" />
              Import Data
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Tip: Save exported files to iCloud Drive, Google Drive, or your preferred cloud storage for safekeeping.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={onShowDiagnostics}
            className="bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-2xl py-4 font-semibold hover:shadow-xl hover:shadow-gray-900/25 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-3"
          >
            <Bug className="w-5 h-5" />
            View Diagnostics
          </button>
          <button
            onClick={() => setSupportOpen(true)}
            className="bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white rounded-2xl py-4 font-semibold hover:shadow-xl hover:shadow-goflex-blue/25 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-3"
          >
            <HelpCircle className="w-5 h-5" />
            Contact Support
          </button>
        </div>

        {/* Onboarding Section - Only for non-admin users */}
        {!isAdmin && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              Onboarding
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Want to see the welcome tour again? Replay the onboarding experience.
            </p>
            <button
              onClick={handleReplayOnboarding}
              disabled={resetting}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#27AAE1] to-[#1d8bb8] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#27AAE1]/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resetting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="w-5 h-5" />
                  Replay welcome tour
                </>
              )}
            </button>
          </div>
        )}

        <div className={`rounded-2xl border shadow-sm p-8 ${
          resolvedPlan?.plan === 'pro'
            ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200'
            : 'bg-gradient-to-br from-goflex-blue/10 to-goflex-blue-dark/10 border-goflex-blue/30'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <Crown className={`w-6 h-6 ${resolvedPlan?.plan === 'pro' ? 'text-amber-600' : 'text-goflex-blue'}`} />
            <h2 className="text-2xl font-bold text-gray-900">
              {resolvedPlan?.plan === 'pro' ? 'GoFlexConnect PRO' : 'GoFlexConnect Free'}
            </h2>
          </div>

          {resolvedPlan?.plan === 'pro' && resolvedPlan.override ? (
            <>
              <p className="text-gray-700 mb-2">
                <span className="font-semibold">Current plan: PRO (Beta access)</span>
              </p>
              <p className="text-gray-600 text-sm mb-4">
                Your PRO access was granted by the GoFlexConnect team. This may be changed or expire in the future.
              </p>
              {resolvedPlan.reason && (
                <p className="text-gray-600 text-sm mb-4 italic">
                  Note: {resolvedPlan.reason}
                </p>
              )}
            </>
          ) : resolvedPlan?.plan === 'pro' ? (
            <>
              <p className="text-gray-700 mb-4">
                <span className="font-semibold">Current plan: PRO</span>
              </p>
              <p className="text-gray-600 text-sm mb-4">
                Enjoy unlimited access to all GoFlexConnect features.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-700 mb-2">
                <span className="font-semibold">Current plan: Free</span>
              </p>
              <p className="text-gray-600 text-sm mb-6">
                Want GoFlexConnect without ads or watermarks? Learn more about Pro.
              </p>
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="w-full bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white rounded-xl py-4 font-semibold hover:shadow-xl hover:shadow-goflex-blue/25 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-3"
              >
                <Crown className="w-5 h-5" />
                Learn about Pro
              </button>
            </>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Account</h2>
          <p className="text-gray-600 mb-6">
            Logged in as: <span className="font-semibold">{user?.email}</span>
          </p>
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl py-4 font-semibold hover:shadow-xl hover:shadow-red-500/25 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-3"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
      {supportOpen && <SupportForm onClose={() => setSupportOpen(false)} />}
      <UpgradeProModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}
