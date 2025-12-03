import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Activity, FolderOpen, BarChart3, Shield, Search, Eye, AlertTriangle, TrendingUp, Bell, UserPlus, Gauge, Play, Mail, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import {
  fetchAdminSummaryStats,
  fetchDailyTrends,
  fetchSitesNeedingAttention,
  AdminSummaryStats,
  DailyTrend,
  SiteHealthData,
} from '../services/adminMetrics';
import AdminTrendsChart from '../components/admin/AdminTrendsChart';
import UserManagement from '../components/admin/UserManagement';
import UserPlanManagement from '../components/admin/UserPlanManagement';
import AdminAnalyticsPanel from '../components/admin/AdminAnalyticsPanel';
import BillingPhaseManager from '../components/admin/BillingPhaseManager';
import AdminSupportInbox from '../components/admin/AdminSupportInbox';
import { getQualityBucketColor } from '../utils/qualityUtils';
import { getRecentAdminAlerts, markAlertsAsRead, AdminAlert, sendAdminTestEmail } from '../services/adminAlerts';

interface AdminDashboardProps {
  onBack: () => void;
  onSelfTest?: () => void;
}

interface SessionEvent {
  id: string;
  created_at: string;
  user_id: string;
  event_type: string;
  device_info: string | null;
  ip_address: string | null;
  metadata: any;
  user_email?: string;
}

type TimeFilter = '24h' | '7d' | '30d';

export default function AdminDashboard({ onBack, onSelfTest }: AdminDashboardProps) {
  // Real data states
  const [summaryStats, setSummaryStats] = useState<AdminSummaryStats | null>(null);
  const [trendsData, setTrendsData] = useState<DailyTrend[]>([]);
  const [sitesData, setSitesData] = useState<SiteHealthData[]>([]);

  // Session events states
  const [sessionEvents, setSessionEvents] = useState<SessionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [trendsLoading, setTrendsLoading] = useState(true);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d');
  const [searchEmail, setSearchEmail] = useState('');

  // Admin alerts states
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertTimeFilter, setAlertTimeFilter] = useState<7 | 30>(7);

  // Email test states
  const [emailTestLoading, setEmailTestLoading] = useState(false);
  const [emailTestStatus, setEmailTestStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Plan override stats
  const [planOverrideStats, setPlanOverrideStats] = useState<{ proCount: number; freeCount: number } | null>(null);

  // Load all admin metrics on mount
  useEffect(() => {
    loadAdminMetrics();
    loadAlerts();
    loadPlanOverrideStats();
  }, []);

  // Reload alerts when filter changes
  useEffect(() => {
    loadAlerts();
  }, [alertTimeFilter]);

  // Load session events when time filter changes
  useEffect(() => {
    loadSessionEvents();
  }, [timeFilter]);

  const loadAdminMetrics = async () => {
    // Load summary stats
    setMetricsLoading(true);
    const stats = await fetchAdminSummaryStats();
    setSummaryStats(stats);
    setMetricsLoading(false);

    // Load trends data
    setTrendsLoading(true);
    const trends = await fetchDailyTrends();
    setTrendsData(trends);
    setTrendsLoading(false);

    // Load sites needing attention
    setSitesLoading(true);
    const sites = await fetchSitesNeedingAttention();
    setSitesData(sites);
    setSitesLoading(false);
  };

  const loadPlanOverrideStats = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('plan_override')
        .not('plan_override', 'is', null);

      const proCount = profiles?.filter(p => p.plan_override === 'PRO').length || 0;
      const freeCount = profiles?.filter(p => p.plan_override === 'FREE').length || 0;

      setPlanOverrideStats({ proCount, freeCount });
    } catch (error) {
      console.error('Failed to load plan override stats:', error);
    }
  };

  const handleSendTestEmail = async () => {
    // Prevent double-clicks
    if (emailTestLoading) {
      console.log('[handleSendTestEmail] Already sending, ignoring click');
      return;
    }

    console.log('[handleSendTestEmail] Starting test email...');
    setEmailTestLoading(true);
    setEmailTestStatus(null);

    // Absolute safety timeout - force stop spinner after 15 seconds no matter what
    const safetyTimeout = setTimeout(() => {
      console.error('[handleSendTestEmail] Safety timeout triggered after 15s');
      setEmailTestLoading(false);
      setEmailTestStatus({
        type: 'error',
        message: 'Request timed out after 15 seconds. The email test may still be processing.',
      });
    }, 15000);

    try {
      console.log('[handleSendTestEmail] Calling sendAdminTestEmail...');
      const result = await sendAdminTestEmail({
        triggeredBy: 'Admin Dashboard',
      });

      console.log('[handleSendTestEmail] Result:', result);

      // Clear safety timeout since we got a response
      clearTimeout(safetyTimeout);

      const message = result.details
        ? `${result.message} (${result.details})`
        : result.message;

      setEmailTestStatus({
        type: result.success ? 'success' : 'error',
        message,
      });

      // Reload alerts to show the new test_email entry
      try {
        await loadAlerts();
      } catch (alertError) {
        console.error('[handleSendTestEmail] Failed to reload alerts:', alertError);
      }

      // Clear status after 8 seconds
      setTimeout(() => {
        setEmailTestStatus(null);
      }, 8000);
    } catch (error) {
      console.error('[handleSendTestEmail] Caught error:', error);

      // Clear safety timeout
      clearTimeout(safetyTimeout);

      // Catch any unexpected errors not handled by service
      setEmailTestStatus({
        type: 'error',
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });

      setTimeout(() => {
        setEmailTestStatus(null);
      }, 8000);
    } finally {
      // ALWAYS clear loading state
      console.log('[handleSendTestEmail] Finally block - clearing loading state');
      clearTimeout(safetyTimeout);
      setEmailTestLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      setAlertsLoading(true);
      const alertsData = await getRecentAdminAlerts({
        limit: 20,
        sinceDays: alertTimeFilter,
      });
      setAlerts(alertsData);

      // Mark all alerts as read when viewing admin dashboard
      const unreadIds = alertsData.filter((a) => !a.is_read).map((a) => a.id);
      if (unreadIds.length > 0) {
        await markAlertsAsRead(unreadIds);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setAlertsLoading(false);
    }
  };

  const loadSessionEvents = async () => {
    try {
      setLoading(true);

      // Calculate date filter
      const now = new Date();
      let fromDate = new Date();
      if (timeFilter === '24h') {
        fromDate.setHours(now.getHours() - 24);
      } else if (timeFilter === '7d') {
        fromDate.setDate(now.getDate() - 7);
      } else if (timeFilter === '30d') {
        fromDate.setDate(now.getDate() - 30);
      }

      // Query session_events using RPC function that includes user emails
      const { data, error } = await supabase
        .rpc('admin_get_session_events', {
          from_timestamp: fromDate.toISOString(),
          result_limit: 50
        });

      if (error) throw error;

      setSessionEvents((data || []) as SessionEvent[]);
    } catch (error) {
      console.error('Failed to load session events:', error);
      setSessionEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = sessionEvents.filter((event) => {
    if (!searchEmail) return true;
    return event.user_email?.toLowerCase().includes(searchEmail.toLowerCase());
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const truncateDevice = (device: string | null) => {
    if (!device) return 'Unknown';
    return device.length > 50 ? device.substring(0, 50) + '...' : device;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="group flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold">Back to Menu</span>
          </button>
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-3">
              <Shield className="w-10 h-10 text-[#27AAE1]" />
              <div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                  Admin Dashboard
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Real-time analytics, session logs, and signal health monitoring
                </p>
              </div>
            </div>
            {onSelfTest && (
              <button
                onClick={onSelfTest}
                className="px-4 py-2 bg-[#27AAE1] hover:bg-[#0178B7] text-white font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <Play className="w-4 h-4" />
                Self-Test
              </button>
            )}
          </div>
        </div>

        {/* ANALYTICS PANEL */}
        <div className="mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-goflex-blue" />
                Analytics Overview
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                Real-time metrics, user activity, and RF performance
              </p>
            </div>
            <AdminAnalyticsPanel />
          </div>
        </div>

        {/* SECTION 0: User Management */}
        <div className="mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <UserManagement />
          </div>
        </div>

        {/* SECTION 0.5: User Plan Management */}
        <div id="user-plan-management" className="mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <UserPlanManagement />
          </div>
        </div>

        {/* SECTION 0.6: Billing Phase Management */}
        <div id="billing-phase-management" className="mb-8">
          <BillingPhaseManager />
        </div>

        {/* SECTION 0.7: Support Inbox */}
        <div id="support-inbox" className="mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <AdminSupportInbox />
          </div>
        </div>

        {/* Plan Overrides Summary Card */}
        <div className="mb-8">
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800 shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-amber-500/20 dark:bg-amber-500/30 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-amber-700 dark:text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">Plan Overrides</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-400">Manual PRO/FREE grants (Beta & Internal users)</p>
                  </div>
                </div>
                {planOverrideStats ? (
                  <div className="flex items-center gap-6 ml-15">
                    <div>
                      <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">{planOverrideStats.proCount}</p>
                      <p className="text-sm text-amber-700 dark:text-amber-400">PRO overrides</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">{planOverrideStats.freeCount}</p>
                      <p className="text-sm text-amber-700 dark:text-amber-400">FREE overrides</p>
                    </div>
                  </div>
                ) : (
                  <div className="animate-pulse h-16 bg-amber-200 dark:bg-amber-800 rounded"></div>
                )}
              </div>
              <a
                href="#user-plan-management"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('user-plan-management')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Manage Plans
              </a>
            </div>
          </div>
        </div>

        {/* SECTION 1: Top Summary Cards - REAL DATA */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-[#27AAE1]/10 dark:bg-[#27AAE1]/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-[#27AAE1]" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">New Users</p>
                <p className="text-xs text-slate-500 dark:text-slate-500">Last 7 Days</p>
              </div>
            </div>
            {metricsLoading ? (
              <div className="animate-pulse h-10 bg-slate-200 dark:bg-slate-800 rounded"></div>
            ) : (
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {summaryStats?.newUsersLast7Days || 0}
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-500/10 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Users</p>
                <p className="text-xs text-slate-500 dark:text-slate-500">Last 7 Days</p>
              </div>
            </div>
            {metricsLoading ? (
              <div className="animate-pulse h-10 bg-slate-200 dark:bg-slate-800 rounded"></div>
            ) : (
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {summaryStats?.activeUsersLast7Days || 0}
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-500/10 dark:bg-purple-500/20 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-purple-600 dark:text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">New Projects</p>
                <p className="text-xs text-slate-500 dark:text-slate-500">Last 7 Days</p>
              </div>
            </div>
            {metricsLoading ? (
              <div className="animate-pulse h-10 bg-slate-200 dark:bg-slate-800 rounded"></div>
            ) : (
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {summaryStats?.newProjectsLast7Days || 0}
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-orange-500/10 dark:bg-orange-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Surveys Run</p>
                <p className="text-xs text-slate-500 dark:text-slate-500">Last 7 Days</p>
              </div>
            </div>
            {metricsLoading ? (
              <div className="animate-pulse h-10 bg-slate-200 dark:bg-slate-800 rounded"></div>
            ) : (
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                {summaryStats?.surveysLast7Days || 0}
              </p>
            )}
          </div>
        </div>

        {/* SECTION 2: Trends (Last 30 Days) - REAL DATA */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#27AAE1]/10 dark:bg-[#27AAE1]/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#27AAE1]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Trends (Last 30 Days)
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Daily activity metrics</p>
            </div>
          </div>

          {trendsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-[#27AAE1] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400">Loading trends...</p>
            </div>
          ) : (
            <AdminTrendsChart data={trendsData} />
          )}
        </div>

        {/* SECTION 3: Sites Needing Attention - REAL DATA */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-500/10 dark:bg-red-500/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Sites Needing Attention
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Sites with borderline or poor RF performance based on RSRP/SINR thresholds
              </p>
            </div>
          </div>

          {sitesLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-[#27AAE1] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400">Analyzing site health...</p>
            </div>
          ) : sitesData.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                All sites looking good!
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                No sites with poor RF performance detected in the last 30 days.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Site / Project</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Measurements</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Avg RSRP</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Avg SINR</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Quality</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Poor %</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {sitesData.map((site) => (
                    <tr key={site.projectId} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{site.projectName}</p>
                          {site.location && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">{site.location}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                        {site.measurementCount}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`font-semibold ${
                          site.avgRsrp < -110
                            ? 'text-red-600 dark:text-red-400'
                            : site.avgRsrp < -100
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}>
                          {site.avgRsrp.toFixed(1)} dBm
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`font-semibold ${
                          site.avgSinr < 0
                            ? 'text-red-600 dark:text-red-400'
                            : site.avgSinr < 5
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}>
                          {site.avgSinr.toFixed(1)} dB
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getQualityBucketColor(site.qualityBucket).replace('bg-', 'bg-').replace('text-', 'text-').replace('border-', 'border-')} dark:bg-opacity-20`}>
                          {site.qualityBucket}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          site.poorPercentage > 40
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                            : site.poorPercentage > 20
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                        }`}>
                          {site.poorPercentage.toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                        {formatDateShort(site.lastUpdated)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 4: Admin Alerts */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#27AAE1]/10 dark:bg-[#27AAE1]/20 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-[#27AAE1]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Admin Alerts
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">System events that may need your attention</p>
              </div>
            </div>

            <select
              value={alertTimeFilter}
              onChange={(e) => setAlertTimeFilter(Number(e.target.value) as 7 | 30)}
              className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#27AAE1]/50 focus:border-[#27AAE1] transition-all"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
          </div>

          {alertsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-[#27AAE1] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400">Loading alerts...</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No alerts in the selected time period.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const alertIcon = alert.type === 'new_user'
                  ? <UserPlus className="w-5 h-5 text-green-600 dark:text-green-500" />
                  : alert.type === 'usage_threshold'
                  ? <Gauge className="w-5 h-5 text-yellow-600 dark:text-yellow-500" />
                  : alert.type === 'test_email'
                  ? <Mail className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                  : <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />;

                const alertBgColor = alert.type === 'new_user'
                  ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                  : alert.type === 'usage_threshold'
                  ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                  : alert.type === 'test_email'
                  ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                  : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800';

                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${alertBgColor} hover:shadow-sm transition-shadow`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{alertIcon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-1">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                            {alert.title}
                          </h3>
                          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {formatDate(alert.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          {alert.message}
                        </p>
                        {alert.metadata && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {alert.metadata.email && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {alert.metadata.email}
                              </span>
                            )}
                            {alert.metadata.limitType && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {alert.metadata.limitType}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 4.5: Admin Email Test */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Mail className="w-6 h-6 text-blue-600 dark:text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Admin Email Test
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Send a test notification email to verify SMTP and alert routing
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 mb-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              This will send a test email to the configured admin distribution list and log an event in Admin Alerts.
            </p>
            <ul className="text-xs text-slate-500 dark:text-slate-500 space-y-1 mb-3">
              <li>• ipalominopc@gmail.com</li>
              <li>• isaac@goflexconnect.com</li>
              <li>• isaac@goflexcloud.com</li>
              <li>• dev@goflexconnect.com</li>
            </ul>
            <div className="flex items-start gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-500">
                <strong>What's tested:</strong> SMTP connection, authentication, and email delivery to all recipients.
                Timeout: 15 seconds. All attempts (success/failure) are logged with duration and error details.
              </div>
            </div>
          </div>

          {/* Last test status */}
          {alerts.length > 0 && (() => {
            const lastTest = alerts.find(a => a.type === 'test_email');
            if (lastTest) {
              const testSuccess = lastTest.metadata?.success === true;
              const testDuration = lastTest.metadata?.duration;
              const timeAgo = new Date(lastTest.created_at).toLocaleString();

              return (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    {testSuccess ? (
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                    <span className="text-slate-700 dark:text-slate-300">
                      <strong>Last test:</strong> {testSuccess ? 'Success' : 'Failure'} · {timeAgo}
                      {testDuration && ` · ${testDuration}ms`}
                    </span>
                  </div>
                  {!testSuccess && lastTest.metadata?.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 ml-6">
                      Error: {lastTest.metadata.error}
                    </p>
                  )}
                </div>
              );
            }
            return null;
          })()}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSendTestEmail}
              disabled={emailTestLoading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed flex items-center gap-2"
            >
              {emailTestLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Send Test Admin Email
                </>
              )}
            </button>

            {emailTestStatus && (
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                  emailTestStatus.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                }`}
              >
                {emailTestStatus.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">{emailTestStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 5: Recent Activity (Session Events) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#27AAE1]/10 dark:bg-[#27AAE1]/20 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#27AAE1]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Recent Activity (Session Events)
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Live user activity from session_events table</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by email..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-[#27AAE1]/50 focus:border-[#27AAE1] transition-all"
                />
              </div>

              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-[#27AAE1]/50 focus:border-[#27AAE1] transition-all"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-4 border-[#27AAE1] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400">Loading session events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No session events found for the selected time period.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Time</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">User Email</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Event Type</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Device</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(event.created_at)}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {event.user_email}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          event.event_type === 'sign_in'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                            : event.event_type === 'sign_out'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                        }`}>
                          {event.event_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                        {truncateDevice(event.device_info)}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                        {event.ip_address || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
