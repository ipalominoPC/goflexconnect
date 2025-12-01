import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, Radio, BarChart3, Building2, FileDown, TrendingUp, Target, Navigation, Activity, Compass, ClipboardCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import { calculateProjectStats, exportToCSV, exportToJSON, downloadFile } from '../utils/calculations';
import SurveyInsightsPanel from './SurveyInsightsPanel';
import HouseAdBanner from './HouseAdBanner';
import UpgradeProModal from './UpgradeProModal';
import UsageNoticeBar from './UsageNoticeBar';
import { logSessionEvent } from '../services/sessionTracking';
import SurveyWorkflow from './projects/SurveyWorkflow';
import InstallWorkflow from './projects/InstallWorkflow';

interface ProjectDetailProps {
  projectId: string;
  onBack: () => void;
  onManageFloors: () => void;
  onStartSurvey: () => void;
  onViewHeatmap: () => void;
  onUploadFloorPlan: () => void;
  onViewTimeSeries: () => void;
  onBenchmarkTest: () => void;
  onGenerateReport: () => void;
  onDriveTest: () => void;
  onBackgroundLogging: () => void;
  onCommissioningChecklist: () => void;
  onGenerateSurveyReport?: () => void;
  onGenerateInstallReport?: () => void;
}

export default function ProjectDetail({
  projectId,
  onBack,
  onManageFloors,
  onStartSurvey,
  onViewHeatmap,
  onUploadFloorPlan,
  onViewTimeSeries,
  onBenchmarkTest,
  onGenerateReport,
  onDriveTest,
  onBackgroundLogging,
  onCommissioningChecklist,
  onGenerateSurveyReport,
  onGenerateInstallReport,
}: ProjectDetailProps) {
  const projects = useStore((state) => state.projects);
  const allMeasurements = useStore((state) => state.measurements);
  const allFloors = useStore((state) => state.floors);
  const settings = useStore((state) => state.settings);
  const user = useStore((state) => state.user);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const project = projects.find((p) => p.id === projectId);
  const measurements = allMeasurements.filter((m) => m.projectId === projectId);
  const floors = allFloors.filter((f) => f.projectId === projectId);

  useEffect(() => {
    if (project) {
      logSessionEvent({
        eventType: 'project_open',
        metadata: {
          projectId: project.id,
          projectName: project.name,
        },
      });
    }
  }, [project]);

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Project not found</p>
      </div>
    );
  }

  const stats = calculateProjectStats(measurements, settings.thresholds);

  const handleExportCSV = () => {
    const csv = exportToCSV(measurements);
    downloadFile(csv, `${project.name}-measurements.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const json = exportToJSON(measurements);
    downloadFile(json, `${project.name}-measurements.json`, 'application/json');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="group flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Projects</span>
        </button>

        {/* Usage Notices */}
        <div className="mb-6">
          <UsageNoticeBar
            context={{ type: 'project', projectId }}
            onUpgrade={() => setUpgradeModalOpen(true)}
          />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-4">{project.name}</h1>
          <div className="space-y-2">
            {project.location && (
              <p className="text-slate-600 dark:text-slate-400 text-lg"><span className="font-semibold">Location:</span> {project.location}</p>
            )}
            {project.buildingLevel && (
              <p className="text-slate-600 dark:text-slate-400 text-lg"><span className="font-semibold">Level:</span> {project.buildingLevel}</p>
            )}
            {project.projectType && (
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                <span className="font-semibold">Type:</span>{' '}
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                  {project.projectType}
                </span>
              </p>
            )}
          </div>
          {project.notes && (
            <p className="text-slate-600 dark:text-slate-400 text-base mt-5 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">{project.notes}</p>
          )}
        </div>

        {/* Project Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6 overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-4 font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Overview
            </button>
            {project.projectType === 'SURVEY' && (
              <button
                onClick={() => setActiveTab('survey')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'survey'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Survey Data
              </button>
            )}
            {(project.projectType === 'INSTALL' || project.projectType === 'UPGRADE') && (
              <button
                onClick={() => setActiveTab('donor')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'donor'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Donor Alignment
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'survey' && user && (
          <SurveyWorkflow
            projectId={projectId}
            userId={user.id}
            onGenerateReport={onGenerateSurveyReport}
          />
        )}

        {activeTab === 'donor' && user && (
          <InstallWorkflow
            projectId={projectId}
            userId={user.id}
            onGenerateReport={onGenerateInstallReport}
          />
        )}

        {activeTab === 'overview' && (<>


        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Floors</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Manage multiple floors for this building</p>
            </div>
            <button
              onClick={onManageFloors}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white text-sm font-semibold hover:shadow-lg hover:shadow-goflex-blue/25 transition-all"
            >
              <Building2 className="w-5 h-5" />
              {floors.length > 0 ? 'Manage Floors' : 'Add Floors'}
            </button>
          </div>
          {floors.length > 0 ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 className="w-4 h-4" />
              <span>{floors.length} floor{floors.length !== 1 ? 's' : ''} configured</span>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No floors added yet. Add floors to organize measurements by level.</p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Floor Plan (Legacy)</h2>
            <button
              onClick={onUploadFloorPlan}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-goflex-blue/10 text-goflex-blue hover:bg-goflex-blue hover:text-white text-sm font-semibold transition-all"
            >
              <Upload className="w-4 h-4" />
              {project.floorPlanImage ? 'Change' : 'Upload'}
            </button>
          </div>
          {project.floorPlanImage ? (
            <img
              src={project.floorPlanImage}
              alt="Floor plan"
              className="w-full h-64 object-contain bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
            />
          ) : (
            <div className="w-full h-64 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center">
              <p className="text-slate-500 dark:text-slate-400 font-medium">No floor plan uploaded</p>
            </div>
          )}
        </div>

        {measurements.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-6">Project Summary</h2>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-goflex-blue/10 to-goflex-blue/5 rounded-xl p-5 border border-goflex-blue/20">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Total Measurements</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{stats.totalMeasurements}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">Last Updated</p>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-5 mb-8">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between text-base mb-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">RSRP</span>
                  <span className="font-bold text-slate-900 dark:text-slate-50">
                    {stats.rsrp.avg.toFixed(1)} dBm
                  </span>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Range: {stats.rsrp.min.toFixed(1)} to {stats.rsrp.max.toFixed(1)} dBm
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between text-base mb-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">SINR</span>
                  <span className="font-bold text-slate-900 dark:text-slate-50">
                    {stats.sinr.avg.toFixed(1)} dB
                  </span>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Range: {stats.sinr.min.toFixed(1)} to {stats.sinr.max.toFixed(1)} dB
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
              <p className="text-base font-bold text-slate-900 dark:text-slate-50 mb-5">Signal Quality Distribution</p>
              <div className="flex gap-4 text-center">
                <div className="flex-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/25">
                    <span className="text-xl font-bold text-white">{stats.quality.good}%</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Good</p>
                </div>
                <div className="flex-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-yellow-500/25">
                    <span className="text-xl font-bold text-white">{stats.quality.fair}%</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Fair</p>
                </div>
                <div className="flex-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-500/25">
                    <span className="text-xl font-bold text-white">{stats.quality.poor}%</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Poor</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleExportCSV}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold hover:border-goflex-blue hover:bg-goflex-blue/5 hover:text-goflex-blue transition-all"
              >
                <FileDown className="w-5 h-5" />
                Export CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:border-goflex-blue hover:bg-goflex-blue/5 hover:text-goflex-blue transition-all"
              >
                <FileDown className="w-5 h-5" />
                Export JSON
              </button>
            </div>
          </div>
        )}

        {measurements.length > 0 && (
          <SurveyInsightsPanel surveyId={projectId} />
        )}

        <div className="grid gap-4">
          <button
            onClick={onStartSurvey}
            className="bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white rounded-2xl py-5 text-lg font-semibold hover:shadow-xl hover:shadow-goflex-blue/25 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-3"
          >
            <Radio className="w-6 h-6" />
            Start Survey Mode
          </button>

          {measurements.length > 0 && (
            <>
              <button
                onClick={onViewHeatmap}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl py-5 text-lg font-semibold hover:shadow-xl hover:shadow-green-600/25 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-3"
              >
                <BarChart3 className="w-6 h-6" />
                View Heatmap
              </button>
              <button
                onClick={onViewTimeSeries}
                className="bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-2xl py-5 text-lg font-semibold hover:shadow-xl hover:shadow-violet-600/25 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-3"
              >
                <TrendingUp className="w-6 h-6" />
                Time Series
              </button>
              <button
                onClick={onBenchmarkTest}
                className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-2xl py-5 text-lg font-semibold hover:shadow-xl hover:shadow-orange-600/25 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-3"
              >
                <Target className="w-6 h-6" />
                Benchmark Test
              </button>
              <button
                onClick={onGenerateReport}
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl py-5 text-lg font-semibold hover:shadow-xl hover:shadow-indigo-600/25 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-3"
              >
                <FileDown className="w-6 h-6" />
                Generate Report
              </button>
            </>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Field Tools</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <button
                onClick={onDriveTest}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl py-4 text-base font-semibold hover:shadow-lg hover:shadow-orange-500/25 hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Navigation className="w-5 h-5" />
                Drive/Walk Test
              </button>
              <button
                onClick={onBackgroundLogging}
                className="bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl py-4 text-base font-semibold hover:shadow-lg hover:shadow-teal-500/25 hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Activity className="w-5 h-5" />
                Background Logging
              </button>
              <button
                onClick={onCommissioningChecklist}
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl py-4 text-base font-semibold hover:shadow-lg hover:shadow-indigo-500/25 hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ClipboardCheck className="w-5 h-5" />
                Commissioning
              </button>
            </div>
          </div>

          {settings.plan !== 'pro' && (
            <div className="mt-6">
              <HouseAdBanner onUpgradeClick={() => setUpgradeModalOpen(true)} variant="compact" />
            </div>
          )}
        </div>

        </>)}
      </div>

      <UpgradeProModal isOpen={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
    </div>
  );
}
