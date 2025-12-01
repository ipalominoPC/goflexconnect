import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, BarChart3, Activity, Eye } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useStore } from '../store/useStore';
import { getQualityBucket, getQualityBucketColor, QualityBucket } from '../utils/qualityUtils';

interface AnalyticsProps {
  onBack: () => void;
  onViewProject: (projectId: string) => void;
}

interface ProjectSummary {
  id: string;
  name: string;
  location: string | null;
  created_at: string;
  measurement_count: number;
  avg_rsrp: number | null;
  avg_sinr: number | null;
  quality_bucket: QualityBucket;
}

export default function Analytics({ onBack, onViewProject }: AnalyticsProps) {
  const [loading, setLoading] = useState(true);
  const [totalSurveys, setTotalSurveys] = useState(0);
  const [last30Days, setLast30Days] = useState(0);
  const [avgRsrp, setAvgRsrp] = useState<number | null>(null);
  const [avgSinr, setAvgSinr] = useState<number | null>(null);
  const [recentProjects, setRecentProjects] = useState<ProjectSummary[]>([]);
  const settings = useStore((state) => state.settings);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, location, created_at, analytics')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const totalCount = projects?.length || 0;
      setTotalSurveys(totalCount);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentCount = projects?.filter((p) => new Date(p.created_at) > thirtyDaysAgo).length || 0;
      setLast30Days(recentCount);

      const { data: allMeasurements } = await supabase
        .from('measurements')
        .select('rsrp, sinr, project_id');

      if (allMeasurements && allMeasurements.length > 0) {
        const totalRsrp = allMeasurements.reduce((sum, m) => sum + Number(m.rsrp), 0);
        const totalSinr = allMeasurements.reduce((sum, m) => sum + Number(m.sinr), 0);
        setAvgRsrp(totalRsrp / allMeasurements.length);
        setAvgSinr(totalSinr / allMeasurements.length);
      }

      const projectSummaries: ProjectSummary[] = await Promise.all(
        (projects || []).slice(0, 10).map(async (project) => {
          const { data: measurements } = await supabase
            .from('measurements')
            .select('rsrp, sinr')
            .eq('project_id', project.id);

          const count = measurements?.length || 0;
          let avgProjectRsrp: number | null = null;
          let avgProjectSinr: number | null = null;

          if (measurements && measurements.length > 0) {
            avgProjectRsrp =
              measurements.reduce((sum, m) => sum + Number(m.rsrp), 0) / measurements.length;
            avgProjectSinr =
              measurements.reduce((sum, m) => sum + Number(m.sinr), 0) / measurements.length;
          }

          const qualityBucket = getQualityBucket({
            avgRsrp: avgProjectRsrp,
            avgSinr: avgProjectSinr,
            sampleCount: count,
          });

          return {
            id: project.id,
            name: project.name,
            location: project.location,
            created_at: project.created_at,
            measurement_count: count,
            avg_rsrp: avgProjectRsrp,
            avg_sinr: avgProjectSinr,
            quality_bucket: qualityBucket,
          };
        })
      );

      setRecentProjects(projectSummaries);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-goflex-blue mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="group flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Menu</span>
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">Analytics & Coverage Overview</h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Get a high-level view of your GoFlexConnect surveys and spot problem sites at a glance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-goflex-blue/10 to-goflex-blue/5 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-goflex-blue" />
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Total Surveys</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{totalSurveys}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Surveys (Last 30 Days)</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{last30Days}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Average RSRP (All Surveys)</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              {avgRsrp !== null ? `${avgRsrp.toFixed(1)}` : 'N/A'}
            </p>
            {avgRsrp !== null && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">dBm</p>}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500/10 to-violet-500/5 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-violet-600" />
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Average SINR (All Surveys)</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              {avgSinr !== null ? `${avgSinr.toFixed(1)}` : 'N/A'}
            </p>
            {avgSinr !== null && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">dB</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Recent Surveys</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Open a survey to see detailed heatmaps and AI-driven insights.
            </p>
          </div>

          {recentProjects.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No surveys found yet.</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Run your first survey to see analytics here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Site</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Date</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Measurements</th>
                    <th className="text-left py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Quality</th>
                    <th className="text-right py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProjects.map((project) => (
                    <tr key={project.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-4 px-4">
                        <p className="font-semibold text-slate-900 dark:text-slate-50">{project.name}</p>
                        {project.location && (
                          <p className="text-sm text-slate-500 dark:text-slate-400">{project.location}</p>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                        {new Date(project.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {project.measurement_count}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getQualityBucketColor(
                            project.quality_bucket
                          )}`}
                        >
                          {project.quality_bucket}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => onViewProject(project.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white text-sm font-semibold hover:shadow-lg hover:shadow-goflex-blue/25 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                          View Insights
                        </button>
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
