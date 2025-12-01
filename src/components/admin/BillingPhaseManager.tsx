import { useState, useEffect } from 'react';
import { DollarSign, Bell, CheckCircle, RefreshCw } from 'lucide-react';
import {
  fetchBillingPhase,
  updateBillingPhase,
  BillingPhase,
  BillingPhaseInfo,
  getDaysUntilBillingActivation,
  formatBillingActivationDate,
} from '../../services/billingPhaseService';

export default function BillingPhaseManager() {
  const [billingInfo, setBillingInfo] = useState<BillingPhaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<BillingPhase>('BETA_FREE');
  const [noticeDays, setNoticeDays] = useState(14);
  const [noticeStartDate, setNoticeStartDate] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadBillingPhase();
  }, []);

  const loadBillingPhase = async () => {
    setLoading(true);
    try {
      const info = await fetchBillingPhase();
      setBillingInfo(info);
      setSelectedPhase(info.phase);
      setNoticeDays(info.noticeDays || 14);
      if (info.noticeStartAt) {
        setNoticeStartDate(new Date(info.noticeStartAt).toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error('Error loading billing phase:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage(null);

    try {
      const params: any = {
        phase: selectedPhase,
        noticeDays,
      };

      // Only set noticeStartAt if we're in NOTICE phase and date is provided
      if (selectedPhase === 'NOTICE') {
        if (!noticeStartDate) {
          setStatusMessage({ type: 'error', text: 'Notice start date is required for NOTICE phase' });
          setSaving(false);
          return;
        }
        params.noticeStartAt = new Date(noticeStartDate).toISOString();
      } else {
        params.noticeStartAt = null;
      }

      await updateBillingPhase(params);
      await loadBillingPhase();
      setStatusMessage({ type: 'success', text: 'Billing phase updated successfully' });
    } catch (error) {
      console.error('Error updating billing phase:', error);
      setStatusMessage({ type: 'error', text: 'Failed to update billing phase' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Billing Phase Control</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  const daysRemaining = billingInfo ? getDaysUntilBillingActivation(billingInfo) : null;
  const activationDate = billingInfo ? formatBillingActivationDate(billingInfo) : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Billing Phase Control</h2>
        </div>
        <button
          onClick={loadBillingPhase}
          disabled={loading}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {billingInfo && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Current Phase Status</h3>
          <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <div className="flex items-center gap-2">
              <span className="font-medium">Phase:</span>
              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                billingInfo.phase === 'BETA_FREE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                billingInfo.phase === 'NOTICE' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {billingInfo.phase}
              </span>
            </div>
            {billingInfo.phase === 'NOTICE' && (
              <>
                {activationDate && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Billing starts:</span>
                    <span>{activationDate}</span>
                  </div>
                )}
                {daysRemaining !== null && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Days remaining:</span>
                    <span className="font-bold">{daysRemaining} days</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Select Billing Phase
          </label>
          <div className="space-y-3">
            <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
              selectedPhase === 'BETA_FREE'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}>
              <input
                type="radio"
                name="billingPhase"
                value="BETA_FREE"
                checked={selectedPhase === 'BETA_FREE'}
                onChange={(e) => setSelectedPhase(e.target.value as BillingPhase)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">BETA_FREE</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Everyone gets PRO features at no cost. Default during beta.
                </div>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
              selectedPhase === 'NOTICE'
                ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}>
              <input
                type="radio"
                name="billingPhase"
                value="NOTICE"
                checked={selectedPhase === 'NOTICE'}
                onChange={(e) => setSelectedPhase(e.target.value as BillingPhase)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">NOTICE</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  PRO features still active, but users see notice that billing will start after X days.
                </div>
              </div>
            </label>

            <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
              selectedPhase === 'PAID_LIVE'
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}>
              <input
                type="radio"
                name="billingPhase"
                value="PAID_LIVE"
                checked={selectedPhase === 'PAID_LIVE'}
                onChange={(e) => setSelectedPhase(e.target.value as BillingPhase)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">PAID_LIVE</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Only explicitly PRO users (via override/paid) keep PRO features. Others revert to FREE with ads.
                </div>
              </div>
            </label>
          </div>
        </div>

        {selectedPhase === 'NOTICE' && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notice Start Date
              </label>
              <input
                type="date"
                value={noticeStartDate}
                onChange={(e) => setNoticeStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                When the notice period begins
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notice Period (days)
              </label>
              <input
                type="number"
                min="1"
                max="90"
                value={noticeDays}
                onChange={(e) => setNoticeDays(parseInt(e.target.value) || 14)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Number of days before billing activates
              </p>
            </div>

            {noticeStartDate && noticeDays && (
              <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded p-3">
                <div className="flex items-start gap-2">
                  <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>Billing will activate on:</strong>
                    <br />
                    {new Date(new Date(noticeStartDate).getTime() + noticeDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {statusMessage && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            statusMessage.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{statusMessage.text}</span>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving || (selectedPhase === 'NOTICE' && !noticeStartDate)}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:shadow-lg"
        >
          {saving ? 'Saving...' : 'Update Billing Phase'}
        </button>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-2">
            ⚠️ Important Notes
          </h4>
          <ul className="text-xs text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
            <li>Phase changes affect all users immediately</li>
            <li>In BETA_FREE: Everyone has PRO features</li>
            <li>In NOTICE: Users see warning but keep PRO features</li>
            <li>In PAID_LIVE: Only admin-granted PRO users keep access</li>
            <li>User data is ALWAYS preserved regardless of plan changes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
