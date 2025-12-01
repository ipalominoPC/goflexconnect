import { useState, useEffect } from 'react';
import { Users, Activity, FolderOpen, Gauge, Sparkles, Image, MousePointerClick, Eye, TrendingUp, AlertCircle } from 'lucide-react';
import {
  fetchAdminAnalytics,
  AdminAnalytics,
  UserAnalyticsSummary,
  UsageAnalyticsSummary,
  AdAnalyticsSummary,
  TopUserUsage,
} from '../../services/adminAnalyticsService';

export default function AdminAnalyticsPanel() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAdminAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mb-3"></div>
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-red-800 dark:text-red-200 font-semibold">Error loading analytics</p>
          <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
          <button
            onClick={loadAnalytics}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-8">
      {/* USER METRICS */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-goflex-blue" />
          User Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Users"
            value={analytics.userSummary.totalUsers}
            subtitle="All time"
            icon={<Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />}
            bgColor="bg-blue-50 dark:bg-blue-900/20"
          />
          <MetricCard
            title="New Users"
            value={analytics.userSummary.newUsersLast7Days}
            subtitle="Last 7 days"
            icon={<TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />}
            bgColor="bg-green-50 dark:bg-green-900/20"
          />
          <MetricCard
            title="Active Users"
            value={analytics.userSummary.activeUsersLast7Days}
            subtitle={`24h: ${analytics.userSummary.activeUsersLast24h} · 7d: ${analytics.userSummary.activeUsersLast7Days}`}
            icon={<Activity className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />}
            bgColor="bg-emerald-50 dark:bg-emerald-900/20"
          />
          <MetricCard
            title="Plan Distribution"
            value={`${analytics.userSummary.freeUsersCount} / ${analytics.userSummary.proUsersCount}`}
            subtitle={`FREE / PRO (${analytics.userSummary.overriddenProCount} comped)`}
            icon={<Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />}
            bgColor="bg-purple-50 dark:bg-purple-900/20"
          />
        </div>
      </div>

      {/* USAGE METRICS */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-goflex-blue" />
          RF Activity & Usage
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard
            title="Projects Created"
            value={analytics.usageSummary.projectsLast7Days}
            subtitle="Last 7 days"
            icon={<FolderOpen className="w-6 h-6 text-orange-600 dark:text-orange-400" />}
            bgColor="bg-orange-50 dark:bg-orange-900/20"
          />
          <MetricCard
            title="Measurements"
            value={analytics.usageSummary.measurementsLast7Days.toLocaleString()}
            subtitle={`24h: ${analytics.usageSummary.measurementsLast24h.toLocaleString()} · 7d: ${analytics.usageSummary.measurementsLast7Days.toLocaleString()}`}
            icon={<Activity className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />}
            bgColor="bg-cyan-50 dark:bg-cyan-900/20"
          />
          <MetricCard
            title="Speed Tests"
            value={analytics.usageSummary.speedTestsLast7Days}
            subtitle={`24h: ${analytics.usageSummary.speedTestsLast24h} · 7d: ${analytics.usageSummary.speedTestsLast7Days}`}
            icon={<Gauge className="w-6 h-6 text-teal-600 dark:text-teal-400" />}
            bgColor="bg-teal-50 dark:bg-teal-900/20"
          />
          <MetricCard
            title="AI Insights"
            value={analytics.usageSummary.aiInsightsLast7Days}
            subtitle="Last 7 days"
            icon={<Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400" />}
            bgColor="bg-amber-50 dark:bg-amber-900/20"
          />
          <MetricCard
            title="Heatmap Exports"
            value={analytics.usageSummary.heatmapExportsLast7Days}
            subtitle="Last 7 days"
            icon={<Image className="w-6 h-6 text-pink-600 dark:text-pink-400" />}
            bgColor="bg-pink-50 dark:bg-pink-900/20"
          />
        </div>
      </div>

      {/* AD METRICS */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-goflex-blue" />
          Ad Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Ad Impressions"
            value={analytics.adSummary.impressionsLast7Days.toLocaleString()}
            subtitle="Last 7 days"
            icon={<Eye className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
            bgColor="bg-indigo-50 dark:bg-indigo-900/20"
          />
          <MetricCard
            title="Ad Clicks"
            value={analytics.adSummary.clicksLast7Days}
            subtitle="Last 7 days"
            icon={<MousePointerClick className="w-6 h-6 text-violet-600 dark:text-violet-400" />}
            bgColor="bg-violet-50 dark:bg-violet-900/20"
          />
          <MetricCard
            title="Click-Through Rate"
            value={analytics.adSummary.ctrLast7Days > 0 ? `${analytics.adSummary.ctrLast7Days}%` : '—'}
            subtitle={analytics.adSummary.impressionsLast7Days === 0 ? 'Not enough data yet' : 'Last 7 days'}
            icon={<TrendingUp className="w-6 h-6 text-fuchsia-600 dark:text-fuchsia-400" />}
            bgColor="bg-fuchsia-50 dark:bg-fuchsia-900/20"
          />
        </div>
      </div>

      {/* TOP HEAVY USERS */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-goflex-blue" />
          Top Heavy Users (Last 7 Days)
        </h3>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {analytics.topHeavyUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Measurements
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Speed Tests
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                      Total Projects
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {analytics.topHeavyUsers.map((user, index) => (
                    <tr key={user.userId} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                      <td className="px-4 py-3 text-sm text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-goflex-blue/10 text-goflex-blue text-xs font-bold">
                            {index + 1}
                          </span>
                          {user.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          user.plan === 'PRO'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {user.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white font-semibold">
                        {user.measurementsLast7Days.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white font-semibold">
                        {user.speedTestsLast7Days}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white font-semibold">
                        {user.projectsTotal}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Activity className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No user activity in the last 7 days</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  bgColor: string;
}

function MetricCard({ title, value, subtitle, icon, bgColor }: MetricCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{title}</p>
      <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
    </div>
  );
}
