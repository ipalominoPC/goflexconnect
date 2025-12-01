import { Plus, MapPin, Calendar, Radio, ArrowLeft } from 'lucide-react';
import { useStore } from '../store/useStore';
import { createSampleProjects, createSampleMeasurements } from '../services/mockData';
import AdSlot from './AdSlot';
import UsageNoticeBar from './UsageNoticeBar';
import { useState } from 'react';
import UpgradeProModal from './UpgradeProModal';

interface ProjectListProps {
  onCreateProject: () => void;
  onSelectProject: (projectId: string) => void;
  onBack: () => void;
}

export default function ProjectList({ onCreateProject, onSelectProject, onBack }: ProjectListProps) {
  const projects = useStore((state) => state.projects);
  const measurements = useStore((state) => state.measurements);
  const addProject = useStore((state) => state.addProject);
  const addMeasurement = useStore((state) => state.addMeasurement);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const loadSampleData = () => {
    const sampleProjects = createSampleProjects();
    sampleProjects.forEach((project) => {
      addProject(project);
      const sampleMeasurements = createSampleMeasurements(project.id);
      sampleMeasurements.forEach(addMeasurement);
    });
  };

  const getProjectMeasurementCount = (projectId: string) => {
    return measurements.filter((m) => m.projectId === projectId).length;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-goflex-bg dark:bg-goflex-bg">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <button
          onClick={onBack}
          className="mb-6 flex items-center text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Menu
        </button>
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <img
              src="/icons/logo-128.png"
              alt="GoFlexConnect logo"
              className="h-12 w-12 rounded-2xl"
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                GoFlexConnect
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Signal survey platform
              </p>
            </div>
          </div>
        </div>

        {/* Usage Notices */}
        <div className="mb-6">
          <UsageNoticeBar
            context={{ type: 'dashboard' }}
            onUpgrade={() => setShowUpgradeModal(true)}
          />
        </div>

        {projects.length === 0 && (
          <div className="bg-white dark:bg-goflex-card rounded-2xl p-12 text-center mb-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="w-20 h-20 bg-gradient-to-br from-goflex-blue to-goflex-blue-dark rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-goflex-blue/20">
              <MapPin className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              You don't have any projects yet
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-base max-w-md mx-auto">
              Start by creating a site or building to survey. You can add floors, run speed tests, and collect RF measurements.
            </p>
            <button
              onClick={onCreateProject}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-goflex-blue/25 transition-all duration-200 mb-4"
            >
              <Plus className="w-5 h-5" />
              Create your first project
            </button>
            <div className="mt-4">
              <button
                onClick={loadSampleData}
                className="text-goflex-blue hover:text-goflex-blue-dark text-sm font-semibold transition-colors"
              >
                Load sample data for testing
              </button>
            </div>
          </div>
        )}

        <div className="grid gap-5 mb-8">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="group bg-white dark:bg-goflex-card rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-goflex-blue/30 hover:shadow-lg hover:shadow-goflex-blue/5 transition-all duration-200 text-left"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-goflex-blue transition-colors">{project.name}</h3>
                  {project.location && (
                    <div className="flex items-center text-base text-slate-600 dark:text-slate-400">
                      <MapPin className="w-4 h-4 mr-2" />
                      {project.location}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-lg">
                  <Radio className="w-4 h-4 mr-2 text-goflex-blue" />
                  <span className="font-semibold">{getProjectMeasurementCount(project.id)}</span>
                  <span className="ml-1.5">measurements</span>
                </div>
                <div className="flex items-center text-slate-500 dark:text-slate-400">
                  <Calendar className="w-4 h-4 mr-2" />
                  {formatDate(project.updatedAt)}
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onCreateProject}
          className="w-full bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white rounded-2xl py-5 text-lg font-semibold hover:shadow-xl hover:shadow-goflex-blue/25 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-3"
        >
          <Plus className="w-6 h-6" />
          New Project
        </button>

        <AdSlot placement="dashboard-footer" />
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeProModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}
