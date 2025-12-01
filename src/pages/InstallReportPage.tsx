import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase } from '../services/supabaseClient';
import { resolveUserPlan } from '../services/planService';
import { Project, DonorAlignment } from '../types';
import ReportLayout from '../components/reports/ReportLayout';
import { isAdminEmail } from '../config/admin';

interface InstallReportPageProps {
  projectId: string;
  onBack: () => void;
}

export default function InstallReportPage({ projectId, onBack }: InstallReportPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [donorAlignments, setDonorAlignments] = useState<DonorAlignment[]>([]);
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

      // Fetch project from database
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
      if (projectData.project_type !== 'INSTALL' && projectData.project_type !== 'UPGRADE') {
        setError('This report is only available for Installation and Upgrade projects.');
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

      // Fetch donor alignments
      const { data: donorData, error: donorError } = await supabase
        .from('donor_alignments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (donorError) throw donorError;

      if (donorData) {
        const mappedDonors: DonorAlignment[] = donorData.map((row) => ({
          id: row.id,
          projectId: row.project_id,
          carrier: row.carrier,
          azimuth: row.azimuth || 0,
          notes: row.notes || undefined,
          rfDeviceImages: row.rf_device_images || [],
          createdAt: new Date(row.created_at).getTime(),
        }));
        setDonorAlignments(mappedDonors);
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

  const reportTitle =
    project.projectType === 'INSTALL'
      ? 'GoFlexConnect – Installation Report'
      : 'GoFlexConnect – Upgrade Report';

  return (
    <ReportLayout
      title={reportTitle}
      projectName={project.name}
      projectLocation={project.projectLocation || project.location}
      technicianName={project.technicianName}
      dateCompleted={project.dateCompleted ? new Date(project.dateCompleted).toISOString() : undefined}
      reportType="Installation"
      isPro={isPro}
      onBack={onBack}
    >
      <div className="space-y-8">
        {/* Project Type */}
        <section className="report-section">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-sm text-slate-600 font-medium mb-1">Project Type</p>
            <p className="text-lg font-semibold text-slate-900">
              {project.projectType === 'INSTALL' ? 'Installation' : 'Upgrade'}
            </p>
          </div>
        </section>

        {/* Donor Alignments Summary */}
        <section className="report-section">
          <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            Donor Antenna Alignments
          </h2>
          {donorAlignments.length > 0 ? (
            <div className="space-y-6">
              {donorAlignments.map((donor, index) => (
                <div
                  key={donor.id}
                  className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                >
                  <h3 className="font-semibold text-slate-900 mb-3">
                    Donor #{index + 1}
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Carrier</p>
                      <p className="text-base font-semibold text-slate-900">{donor.carrier}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Azimuth</p>
                      <p className="text-base font-semibold text-slate-900">{donor.azimuth}°</p>
                    </div>
                    {donor.notes && (
                      <div className="col-span-2 md:col-span-3">
                        <p className="text-sm text-slate-600 font-medium mb-1">Notes</p>
                        <p className="text-sm text-slate-700">{donor.notes}</p>
                      </div>
                    )}
                  </div>

                  {donor.rfDeviceImages && donor.rfDeviceImages.length > 0 && (
                    <div>
                      <p className="text-sm text-slate-600 font-medium mb-2">
                        RF Survey Device Screenshots
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {donor.rfDeviceImages.map((img, imgIdx) => (
                          <div
                            key={imgIdx}
                            className="border border-slate-200 rounded overflow-hidden"
                          >
                            <img
                              src={img.url}
                              alt={`RF Device ${imgIdx + 1}`}
                              className="w-full h-24 object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 italic">No donor alignments recorded.</p>
          )}
        </section>

        {/* Installation Notes */}
        {project.notes && (
          <section className="report-section">
            <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
              Installation Notes
            </h2>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-slate-700 whitespace-pre-wrap">{project.notes}</p>
            </div>
          </section>
        )}

        {/* Summary Statistics */}
        <section className="report-section">
          <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            Summary
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm text-slate-600 font-medium mb-1">Total Donors</p>
              <p className="text-2xl font-bold text-goflex-blue">{donorAlignments.length}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm text-slate-600 font-medium mb-1">Total Screenshots</p>
              <p className="text-2xl font-bold text-goflex-blue">
                {donorAlignments.reduce(
                  (sum, donor) => sum + (donor.rfDeviceImages?.length || 0),
                  0
                )}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
              <p className="text-sm text-slate-600 font-medium mb-1">Carriers</p>
              <p className="text-2xl font-bold text-goflex-blue">
                {new Set(donorAlignments.map((d) => d.carrier)).size}
              </p>
            </div>
          </div>
        </section>
      </div>
    </ReportLayout>
  );
}
