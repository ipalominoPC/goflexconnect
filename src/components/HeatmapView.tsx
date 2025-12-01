import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Layers, Eye, Settings, MapPin } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getMetricValue, getColorForValue } from '../utils/calculations';
import { MetricType } from '../types';
import ZoomableFloorPlan from './ZoomableFloorPlan';
import FreeWatermark from './FreeWatermark';
import UsageNoticeBar from './UsageNoticeBar';
import UpgradeProModal from './UpgradeProModal';

interface HeatmapViewProps {
  projectId: string;
  floorId?: string;
  onBack: () => void;
}

export default function HeatmapView({ projectId, floorId, onBack }: HeatmapViewProps) {
  const projects = useStore((state) => state.projects);
  const floors = useStore((state) => state.floors);
  const allMeasurements = useStore((state) => state.measurements);
  const settings = useStore((state) => state.settings);

  const project = projects.find((p) => p.id === projectId);
  const floor = floorId ? floors.find((f) => f.id === floorId) : undefined;
  const measurements = floorId
    ? allMeasurements.filter((m) => m.floorId === floorId)
    : allMeasurements.filter((m) => m.projectId === projectId && !m.floorId);

  const [viewMode, setViewMode] = useState<'heatmap' | 'points'>('heatmap');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(settings.defaultMetric);
  const [interpolationRadius, setInterpolationRadius] = useState(80);
  const [showContours, setShowContours] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [opacity, setOpacity] = useState(0.8);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || viewMode !== 'heatmap') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    measurements.forEach((measurement) => {
      const x = measurement.x * width;
      const y = measurement.y * height;
      const value = getMetricValue(measurement, selectedMetric);
      const color = getColorForValue(value, selectedMetric, settings.thresholds);

      const opacityHex = Math.floor(opacity * 255).toString(16).padStart(2, '0');
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, interpolationRadius);
      gradient.addColorStop(0, color + opacityHex);
      gradient.addColorStop(0.5, color + Math.floor(opacity * 0.4 * 255).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, color + '00');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    });

    if (showContours) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;

      const contourLevels = selectedMetric === 'rsrp'
        ? [-120, -110, -100, -90, -80, -70]
        : selectedMetric === 'sinr'
        ? [-10, 0, 5, 10, 15, 20]
        : [-20, -15, -10, -5, 0];

      contourLevels.forEach((level) => {
        measurements.forEach((m, i) => {
          if (i === measurements.length - 1) return;
          const value = getMetricValue(m, selectedMetric);
          if (Math.abs(value - level) < 2) {
            ctx.beginPath();
            ctx.arc(m.x * width, m.y * height, 3, 0, Math.PI * 2);
            ctx.stroke();
          }
        });
      });
    }
  }, [measurements, viewMode, selectedMetric, settings.thresholds, interpolationRadius, showContours, opacity]);

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Project not found</p>
      </div>
    );
  }

  const metricOptions: { value: MetricType; label: string; unit: string }[] = [
    { value: 'rsrp', label: 'RSRP', unit: 'dBm' },
    { value: 'rsrq', label: 'RSRQ', unit: 'dB' },
    { value: 'sinr', label: 'SINR', unit: 'dB' },
    { value: 'rssi', label: 'RSSI', unit: 'dBm' },
  ];

  const getThresholdInfo = () => {
    if (selectedMetric === 'rsrp') {
      return {
        good: `≥ ${settings.thresholds.rsrp.good} dBm`,
        fair: `${settings.thresholds.rsrp.fair} to ${settings.thresholds.rsrp.good} dBm`,
        poor: `< ${settings.thresholds.rsrp.fair} dBm`,
      };
    }
    if (selectedMetric === 'sinr') {
      return {
        good: `≥ ${settings.thresholds.sinr.good} dB`,
        fair: `${settings.thresholds.sinr.fair} to ${settings.thresholds.sinr.good} dB`,
        poor: `< ${settings.thresholds.sinr.fair} dB`,
      };
    }
    if (selectedMetric === 'rsrq') {
      return {
        good: '≥ -10 dB',
        fair: '-10 to -15 dB',
        poor: '< -15 dB',
      };
    }
    return {
      good: '≥ -70 dBm',
      fair: '-70 to -90 dBm',
      poor: '< -90 dBm',
    };
  };

  const thresholdInfo = getThresholdInfo();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="bg-gradient-to-b from-gray-900 to-gray-900/95 backdrop-blur-sm px-6 py-5 border-b border-gray-800">
        {/* Usage Notice */}
        <div className="mb-4">
          <UsageNoticeBar
            context={{ type: 'heatmap' }}
            onUpgrade={() => setShowUpgradeModal(true)}
          />
        </div>

        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBack}
            className="group flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold">Back</span>
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                showSettings
                  ? 'bg-goflex-blue text-white shadow-lg shadow-goflex-blue/25'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                viewMode === 'heatmap'
                  ? 'bg-goflex-blue text-white shadow-lg shadow-goflex-blue/25'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              <Layers className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('points')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                viewMode === 'points'
                  ? 'bg-goflex-blue text-white shadow-lg shadow-goflex-blue/25'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>
        </div>

        {(floor?.floorPlanFilename || project.floorPlanFilename) && (
          <div className="text-gray-400 text-sm truncate mb-3">
            {floor ? `${floor.name}: ` : 'Floor Plan: '}
            <span className="text-white">{floor?.floorPlanFilename || project.floorPlanFilename}</span>
          </div>
        )}

        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
          className="w-full px-4 py-3 bg-gray-800 text-white rounded-xl border-2 border-gray-700 focus:border-goflex-blue focus:ring-2 focus:ring-goflex-blue/20 font-semibold transition-all"
        >
          {metricOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} ({option.unit})
            </option>
          ))}
        </select>

        {showSettings && (
          <div className="mt-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700 space-y-4">
            <div>
              <label className="text-white font-semibold text-sm mb-2 block">
                Interpolation Radius: {interpolationRadius}px
              </label>
              <input
                type="range"
                min="40"
                max="150"
                value={interpolationRadius}
                onChange={(e) => setInterpolationRadius(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-white font-semibold text-sm mb-2 block">
                Opacity: {Math.round(opacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={opacity * 100}
                onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <span className="text-white font-semibold text-sm">Show Contour Lines</span>
              <button
                onClick={() => setShowContours(!showContours)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  showContours ? 'bg-goflex-blue' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    showContours ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {measurements.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-gradient-to-br from-[#27AAE1] to-[#1d8bb8] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              No heatmap available yet
            </h3>
            <p className="text-gray-400 mb-6">
              Upload a floor plan and collect measurements to generate an indoor coverage heatmap.
            </p>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#27AAE1] to-[#1d8bb8] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#27AAE1]/25 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Project
            </button>
          </div>
        </div>
      ) : (
        <ZoomableFloorPlan floorPlanImage={floor?.floorPlanImage || project.floorPlanImage}>
        {viewMode === 'heatmap' && (
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ mixBlendMode: 'multiply', opacity: 0.8 }}
          />
        )}

        {measurements.map((m) => {
          const value = getMetricValue(m, selectedMetric);
          const color = getColorForValue(value, selectedMetric, settings.thresholds);

          return (
            <div
              key={m.id}
              className="absolute flex flex-col items-center pointer-events-none"
              style={{
                left: `${m.x * 100}%`,
                top: `${m.y * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {viewMode === 'points' && (
                <div
                  className="w-4 h-4 rounded-full border-2 border-white"
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 12px ${color}`,
                  }}
                />
              )}
              <div
                className="mt-1 px-2 py-0.5 bg-gray-900 text-white text-xs font-bold rounded border border-white"
                style={{
                  boxShadow: '0 0 8px rgba(0,0,0,0.5)',
                }}
              >
                {m.locationNumber}
              </div>
            </div>
          );
        })}

        {settings.plan !== 'pro' && <FreeWatermark position="bottom-right" />}
      </ZoomableFloorPlan>
      )}

      {measurements.length > 0 && (
      <div className="bg-gradient-to-t from-gray-900 to-gray-900/95 backdrop-blur-sm p-6 border-t border-gray-800">
        <p className="text-sm text-gray-400 mb-4 font-bold uppercase tracking-wide">Signal Quality Legend</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/25" />
              <span className="text-gray-200 font-semibold">Good</span>
            </div>
            <span className="text-gray-400 text-sm font-medium">{thresholdInfo.good}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/25" />
              <span className="text-gray-200 font-semibold">Fair</span>
            </div>
            <span className="text-gray-400 text-sm font-medium">{thresholdInfo.fair}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/25" />
              <span className="text-gray-200 font-semibold">Poor</span>
            </div>
            <span className="text-gray-400 text-sm font-medium">{thresholdInfo.poor}</span>
          </div>
        </div>
        <p className="text-center text-gray-500 text-sm mt-5 font-semibold">
          {measurements.length} measurement points
        </p>
      </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeProModal onClose={() => setShowUpgradeModal(false)} />
      )}
    </div>
  );
}
