import { ArrowLeft, Users, TrendingUp, AlertTriangle, Eye } from 'lucide-react';
import { DailySignupsStats, SurveyVolumeStats, SiteAttentionRow } from '../types/reports';

interface ReportsProps {
  onBack: () => void;
}

export default function Reports({ onBack }: ReportsProps) {
  // TODO: Replace with Supabase query to auth.users table
  // Query: SELECT COUNT(*) FROM auth.users WHERE created_at >= CURRENT_DATE
  // Also: WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  const dailySignupsData: DailySignupsStats = {
    newUsersToday: 12,
    newUsersLast7Days: 89,
    newProjectsCreated: 34,
    activeUsersLast24h: 56,
  };

  // TODO: Replace with Supabase query to projects and measurements tables
  // Query projects table for counts with date filters
  // Query measurements table for AVG(rsrp), AVG(sinr)
  // Calculate quality distribution based on thresholds
  const surveyVolumeData: SurveyVolumeStats = {
    surveysToday: 8,
    surveysLast7Days: 67,
    surveysLast30Days: 234,
    avgRsrp: -92.4,
    avgSinr: 12.8,
    qualityDistribution: {
      good: 142,
      fair: 68,
      poor: 19,
      noService: 5,
    },
  };

  // TODO: Replace with Supabase query
  // Query: SELECT projects.name, AVG(measurements.rsrp),
  //        COUNT(*) FILTER (WHERE quality = 'poor' OR quality = 'no_service') * 100.0 / COUNT(*)
  // FROM projects JOIN measurements ON projects.id = measurements.project_id
  // GROUP BY projects.id, projects.name
  // HAVING (poor/no service %) > 20
  // ORDER BY (poor/no service %) DESC
  const sitesNeedingAttention: SiteAttentionRow[] = [
    { id: '1', siteName: 'Downtown Office Complex', avgRsrp: -108.2, poorNoServicePercentage: 42 },
    { id: '2', siteName: 'Warehouse District B', avgRsrp: -112.5, poorNoServicePercentage: 38 },
    { id: '3', siteName: 'Suburban Mall - Level 2', avgRsrp: -105.8, poorNoServicePercentage: 31 },
  ];

  const totalQuality = surveyVolumeData.qualityDistribution.good +
    surveyVolumeData.qualityDistribution.fair +
    surveyVolumeData.qualityDistribution.poor +
    surveyVolumeData.qualityDistribution.noService;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="group flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold">Back to Menu</span>
          </button>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Reports Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Overview of user activity, survey quality, and sites needing attention
          </p>
        </div>

        <div className="space-y-6">
          {/* Section A: Daily Signups & Projects */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#27AAE1]/10 dark:bg-[#27AAE1]/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-[#27AAE1]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Daily Signups & Projects
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">User growth and project creation metrics</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">New Users Today</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{dailySignupsData.newUsersToday}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Last 7 Days</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{dailySignupsData.newUsersLast7Days}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">New Projects</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{dailySignupsData.newProjectsCreated}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Active (24h)</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{dailySignupsData.activeUsersLast24h}</p>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              Data powered by Supabase (auth + projects tables).
            </p>
          </div>

          {/* Section B: Survey Volume & Quality */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#27AAE1]/10 dark:bg-[#27AAE1]/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#27AAE1]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Survey Volume & Quality
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">RF measurement statistics and coverage quality</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Surveys Today</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{surveyVolumeData.surveysToday}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Last 7 Days</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{surveyVolumeData.surveysLast7Days}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Last 30 Days</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{surveyVolumeData.surveysLast30Days}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg RSRP</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {surveyVolumeData.avgRsrp?.toFixed(1)} dBm
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg SINR</span>
                  <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {surveyVolumeData.avgSinr?.toFixed(1)} dB
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Quality Distribution</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                      Good: {surveyVolumeData.qualityDistribution.good} ({Math.round(surveyVolumeData.qualityDistribution.good / totalQuality * 100)}%)
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                      Fair: {surveyVolumeData.qualityDistribution.fair} ({Math.round(surveyVolumeData.qualityDistribution.fair / totalQuality * 100)}%)
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                      Poor: {surveyVolumeData.qualityDistribution.poor} ({Math.round(surveyVolumeData.qualityDistribution.poor / totalQuality * 100)}%)
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                      No Service: {surveyVolumeData.qualityDistribution.noService} ({Math.round(surveyVolumeData.qualityDistribution.noService / totalQuality * 100)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              Later we'll connect this to the measurements table used by Analytics Overview.
            </p>
          </div>

          {/* Section C: Sites Needing Attention */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-500/10 dark:bg-red-500/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Sites Needing Attention
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Projects with poor coverage or service issues</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Site / Project Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Avg RSRP</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">% Poor/No Service</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 dark:text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sitesNeedingAttention.map((site) => (
                    <tr key={site.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                        {site.siteName}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-400">
                        <span className={`font-semibold ${site.avgRsrp < -110 ? 'text-red-600 dark:text-red-400' : site.avgRsrp < -95 ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {site.avgRsrp.toFixed(1)} dBm
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          site.poorNoServicePercentage > 35
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'
                        }`}>
                          {site.poorNoServicePercentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#27AAE1] hover:bg-[#0178B7] text-white text-xs font-semibold rounded-lg transition-all">
                          <Eye className="w-4 h-4" />
                          View Insights
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {sitesNeedingAttention.length === 0 && (
              <div className="text-center py-8">
                <p className="text-slate-500 dark:text-slate-400">
                  No sites currently need attention. All surveys show acceptable coverage!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
