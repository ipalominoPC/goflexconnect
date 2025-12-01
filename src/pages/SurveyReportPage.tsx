import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase } from '../services/supabaseClient';
import { resolveUserPlan } from '../services/planService';
import { Project, SurveyData } from '../types';
import ReportLayout from '../components/reports/ReportLayout';
import { isAdminEmail } from '../config/admin';

interface SurveyReportPageProps {
  projectId: string;
  onBack: () => void;
}

export default function SurveyReportPage({ projectId, onBack }: SurveyReportPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [isPro, setIsPro] = useState(false);

  const user = useStore((state) => state.user);
  const projects = useStore((state) => state.projects);

  useEffect(() => {
    loadReportData();
  }, [projectId, user]);

  const loadReportData = async () => {
    if (!user) {
      setError('You must be logged in to view this report.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Get project from store first
      const projectFromStore = projects.find((p) => p.id === projectId);

      // Fetch from database to ensure fresh data
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .maybeSingle();

      if (projectError) throw projectError;
      if (!projectData) {
        setError('Project not found.');
        setLoading(false);
        return;
      }

      // Check authorization
      const userIsAdmin = isAdminEmail(user.email || '');
      if (projectData.user_id !== user.id && !userIsAdmin) {
        setError('You are not authorized to view this report.');
        setLoading(false);
        return;
      }

      // Check project type
      if (projectData.project_type !== 'SURVEY') {
        setError('This report is only available for Survey projects.');
        setLoading(false);
        return;
      }

      // Map database project to Project type
      const mappedProject: Project = {
        id: projectData.id,
        name: projectData.name,
        location: projectData.location || undefined,
        buildingLevel: projectData.building_level || undefined,
        projectType: projectData.project_type as 'SURVEY' | 'INSTALL' | 'UPGRADE',
        technicianName: projectData.technician_name || undefined,
        projectLocation: projectData.project_location || undefined,
        dateCompleted: projectData.date_completed ? new Date(projectData.date_completed).getTime() : undefined,
        notes: projectData.notes || undefined,
        floorPlanImage: projectData.floor_plan_image || undefined,
        floorPlanFilename: projectData.floor_plan_filename || undefined,
        createdAt: new Date(projectData.created_at).getTime(),
        updatedAt: new Date(projectData.updated_at).getTime(),
      };

      setProject(mappedProject);

      // Fetch survey data
      const { data: surveyDataRaw, error: surveyError } = await supabase
        .from('survey_data')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (surveyError && surveyError.code !== 'PGRST116') {
        console.error('Error fetching survey data:', surveyError);
      }

      if (surveyDataRaw) {
        const mappedSurveyData: SurveyData = {
          id: surveyDataRaw.id,
          projectId: surveyDataRaw.project_id,
          ambientReading: surveyDataRaw.ambient_reading || undefined,
          indoorSpeedtests: surveyDataRaw.indoor_speedtests || [],
          outdoorSpeedtests: surveyDataRaw.outdoor_speedtests || [],
          sitePhotos: surveyDataRaw.site_photos || [],
          notes: surveyDataRaw.notes || '',
          createdAt: new Date(surveyDataRaw.created_at).getTime(),
        };
        setSurveyData(mappedSurveyData);
      }

      // Resolve user plan
      const planResult = await resolveUserPlan(user.id);
      setIsPro(planResult.effectivePlan === 'pro');
    } catch (err) {
      console.error('Error loading report data:', err);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-goflex-blue animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <p className="text-red-700 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <ReportLayout
      title="GoFlexConnect – RF Survey Report"
      projectName={project.name}
      projectLocation={project.projectLocation || project.location}
      technicianName={project.technicianName}
      dateCompleted={project.dateCompleted ? new Date(project.dateCompleted).toISOString() : undefined}
      reportType="Survey"
      isPro={isPro}
      onBack={onBack}
    >
      <div className="space-y-8">
        {/* Ambient RF Summary */}
        <section className="report-section">
          <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            Ambient RF Summary
          </h2>
          {surveyData?.ambientReading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {surveyData.ambientReading.carrier && (
                <div>
                  <p className="text-sm text-slate-600 font-medium">Carrier</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {surveyData.ambientReading.carrier}
                  </p>
                </div>
              )}
              {surveyData.ambientReading.rsrp !== undefined && (
                <div>
                  <p className="text-sm text-slate-600 font-medium">RSRP</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {surveyData.ambientReading.rsrp} dBm
                  </p>
                </div>
              )}
              {surveyData.ambientReading.rsrq !== undefined && (
                <div>
                  <p className="text-sm text-slate-600 font-medium">RSRQ</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {surveyData.ambientReading.rsrq} dB
                  </p>
                </div>
              )}
              {surveyData.ambientReading.sinr !== undefined && (
                <div>
                  <p className="text-sm text-slate-600 font-medium">SINR</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {surveyData.ambientReading.sinr} dB
                  </p>
                </div>
              )}
              {surveyData.ambientReading.cellId && (
                <div>
                  <p className="text-sm text-slate-600 font-medium">Cell ID / PCI</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {surveyData.ambientReading.cellId}
                  </p>
                </div>
              )}
              {surveyData.ambientReading.band && (
                <div>
                  <p className="text-sm text-slate-600 font-medium">Band</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {surveyData.ambientReading.band}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-600 italic">No ambient reading recorded.</p>
          )}
        </section>

        {/* Indoor Speedtests */}
        <section className="report-section">
          <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            Indoor Speedtests
          </h2>
          {surveyData?.indoorSpeedtests && surveyData.indoorSpeedtests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300">
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Carrier</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Connection</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Download (Mbps)</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Upload (Mbps)</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Ping (ms)</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {surveyData.indoorSpeedtests.map((test, index) => (
                    <tr key={index} className="border-b border-slate-200">
                      <td className="py-2 px-3">{test.carrier || 'N/A'}</td>
                      <td className="py-2 px-3 capitalize">{test.connectionType}</td>
                      <td className="py-2 px-3">{test.download.toFixed(2)}</td>
                      <td className="py-2 px-3">{test.upload.toFixed(2)}</td>
                      <td className="py-2 px-3">{test.ping.toFixed(0)}</td>
                      <td className="py-2 px-3">{test.locationLabel || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-600 italic">No indoor speedtests recorded.</p>
          )}
        </section>

        {/* Outdoor Speedtests */}
        <section className="report-section">
          <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            Outdoor / Rooftop Speedtests
          </h2>
          {surveyData?.outdoorSpeedtests && surveyData.outdoorSpeedtests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300">
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Carrier</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Connection</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Download (Mbps)</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Upload (Mbps)</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Ping (ms)</th>
                    <th className="text-left py-2 px-3 font-semibold text-slate-700">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {surveyData.outdoorSpeedtests.map((test, index) => (
                    <tr key={index} className="border-b border-slate-200">
                      <td className="py-2 px-3">{test.carrier || 'N/A'}</td>
                      <td className="py-2 px-3 capitalize">{test.connectionType}</td>
                      <td className="py-2 px-3">{test.download.toFixed(2)}</td>
                      <td className="py-2 px-3">{test.upload.toFixed(2)}</td>
                      <td className="py-2 px-3">{test.ping.toFixed(0)}</td>
                      <td className="py-2 px-3">{test.locationLabel || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-600 italic">No outdoor speedtests recorded.</p>
          )}
        </section>

        {/* Site Photos */}
        <section className="report-section">
          <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            Site Photos
          </h2>
          {surveyData?.sitePhotos && surveyData.sitePhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {surveyData.sitePhotos.map((photo, index) => (
                <div key={index} className="border border-slate-200 rounded-lg overflow-hidden">
                  <img
                    src={photo.url}
                    alt={photo.caption || `Site photo ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  {photo.caption && (
                    <p className="p-2 text-xs text-slate-600 bg-slate-50">{photo.caption}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 italic">No site photos uploaded.</p>
          )}
        </section>

        {/* Notes */}
        {surveyData?.notes && (
          <section className="report-section">
            <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
              Survey Notes
            </h2>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-slate-700 whitespace-pre-wrap">{surveyData.notes}</p>
            </div>
          </section>
        )}
      </div>
    </ReportLayout>
  );
}
