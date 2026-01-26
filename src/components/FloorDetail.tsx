import { useState } from 'react';
import { ArrowLeft, Upload, Radio, BarChart3, FileDown, TrendingUp, Target, Navigation } from 'lucide-react';
import { useStore } from '../store/useStore';
import { calculateProjectStats, exportToCSV, exportToJSON, downloadFile } from '../utils/calculations';
import UsageNoticeBar from './UsageNoticeBar';
import UpgradeProModal from './UpgradeProModal';

interface FloorDetailProps {
  floorId: string;
  onBack: () => void;
  onStartSurvey: () => void;
  onViewHeatmap: () => void;
  onUploadFloorPlan: () => void;
  onViewTimeSeries: () => void;
  onBenchmarkTest: () => void;
  onGenerateReport: () => void;
  onDriveTest: () => void;
}

export default function FloorDetail({
  floorId,
  onBack,
  onStartSurvey,
  onViewHeatmap,
  onUploadFloorPlan,
  onViewTimeSeries,
  onBenchmarkTest,
  onGenerateReport,
  onDriveTest,
}: FloorDetailProps) {
  const floors = useStore((state) => state.floors);
  const allMeasurements = useStore((state) => state.measurements);
  const settings = useStore((state) => state.settings);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const floor = floors.find((f) => f.id === floorId);
  const measurements = allMeasurements.filter((m) => m.floorId === floorId);

  if (!floor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Floor not found</p>
      </div>
    );
  }

  const stats = calculateProjectStats(measurements, settings.thresholds);

  const handleExportCSV = () => {
    const csv = exportToCSV(measurements);
    downloadFile(csv, `${floor.name}-measurements.csv`, 'text/csv');
  };

  const handleExportJSON = () => {
    const json = exportToJSON(measurements);
    downloadFile(json, `${floor.name}-measurements.json`, 'application/json');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-blue-50/30">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <button
          onClick={onBack}
          className="group flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Floors</span>
        </button>

        {/* Usage Notices */}
        <div className="mb-6">
          <UsageNoticeBar
            context={{ type: 'survey', surveyId: floorId }}
            onUpgrade={() => setShowUpgradeModal(true)}
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{floor.name}</h1>
          <div className="space-y-2">
            <p className="text-gray-600 text-lg">
              <span className="font-semibold">Level:</span> {floor.level}
            </p>
          </div>
          {floor.notes && (
            <p className="text-gray-600 text-base mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
              {floor.notes}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Floor Plan</h2>
            <button
              onClick={onUploadFloorPlan}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-goflex-blue/10 text-goflex-blue hover:bg-goflex-blue hover:text-white text-sm font-semibold transition-all"
            >
              <Upload className="w-4 h-4" />
              {floor.floorPlanImage ? 'Change' : 'Upload'}
            </button>
          </div>
          {floor.floorPlanImage ? (
            <img
              src={floor.floorPlanImage}
              alt="Floor plan"
              className="w-full h-64 object-contain bg-gray-50 rounded-xl border border-gray-100"
            />
          ) : (
            <div className="w-full h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
              <p className="text-gray-500 font-medium">No floor plan uploaded</p>
            </div>
          )}
        </div>

        {measurements.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Floor Summary</h2>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-gradient-to-br from-goflex-blue/10 to-goflex-blue/5 rounded-xl p-5 border border-goflex-blue/20">
                <p className="text-sm font-semibold text-gray-600 mb-2">Total Measurements</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalMeasurements}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <p className="text-sm font-semibold text-gray-600 mb-2">Last Updated</p>
                <p className="text-base font-semibold text-gray-900">
                  {new Date(floor.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-5 mb-8">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex justify-between text-base mb-2">
                  <span className="font-semibold text-gray-700">RSRP</span>
                  <span className="font-bold text-gray-900">
                    {stats.rsrp.avg.toFixed(1)} dBm
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Range: {stats.rsrp.min.toFixed(1)} to {stats.rsrp.max.toFixed(1)} dBm
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex justify-between text-base mb-2">
                  <span className="font-semibold text-gray-700">SINR</span>
                  <span className="font-bold text-gray-900">
                    {stats.sinr.avg.toFixed(1)} dB
                  </span>
                </div>
                <div className="text-sm text-gray-500">
                  Range: {stats.sinr.min.toFixed(1)} to {stats.sinr.max.toFixed(1)} dB
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <p className="text-base font-bold text-gray-900 mb-5">Signal Quality Distribution</p>
              <div className="flex gap-4 text-center">
                <div className="flex-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/25">
                    <span className="text-xl font-bold text-white">{stats.quality.good}%</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Good</p>
                </div>
                <div className="flex-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-yellow-500/25">
                    <span className="text-xl font-bold text-white">{stats.quality.fair}%</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Fair</p>
                </div>
                <div className="flex-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-500/25">
                    <span className="text-xl font-bold text-white">{stats.quality.poor}%</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Poor</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleExportCSV}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:border-goflex-blue hover:bg-goflex-blue/5 hover:text-goflex-blue transition-all"
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

        <div className="grid gap-4">
          <button
            onClick={onStartSurvey}
            className="bg-gradient-to-r from-goflex-blue to-goflex-blue-dark text-white rounded-2xl py-5 text-lg font-semibold hover:shadow-xl hover:shadow-goflex-blue/25 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-3"
          >
            <div className="p-2 bg-[#27AAE1]/10 rounded-xl border border-[#27AAE1]/20 shadow-[0_0_10px_rgba(39,170,225,0.4)]"><Radio className="w-6 h-6 text-[#27AAE1] drop-shadow-[0_0_8px_rgba(39,170,225,0.8)]" /></div>
            Start Survey Mode
          </button>

          <button
            onClick={onDriveTest}
            className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-2xl py-5 text-lg font-semibold hover:shadow-xl hover:shadow-cyan-600/25 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-3"
          >
            <Navigation className="w-6 h-6" />
            Drive Test Mode
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
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeProModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}
