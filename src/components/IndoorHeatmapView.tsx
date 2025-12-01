import { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Measurement, MetricType, Settings } from '../types';
import { applyLogoWatermark, getUserPlan } from '../utils/watermark';

interface IndoorHeatmapViewProps {
  measurements: Measurement[];
  floorName?: string;
  onBack?: () => void;
  settings?: Settings;
}

interface HeatmapPoint {
  x: number;
  y: number;
  value: number;
  measurement: Measurement;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const GRID_SIZE = 20;

export default function IndoorHeatmapView({ measurements, floorName, settings }: IndoorHeatmapViewProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('rsrp');
  const [selectedCarrier, setSelectedCarrier] = useState<string>('all');
  const [hoveredPoint, setHoveredPoint] = useState<HeatmapPoint | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [exporting, setExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get unique carriers from measurements
  const carriers = ['all', ...new Set(measurements.map(m => m.carrierName).filter(Boolean))];

  // Filter measurements based on selected carrier
  const filteredMeasurements = selectedCarrier === 'all'
    ? measurements
    : measurements.filter(m => m.carrierName === selectedCarrier);

  // TODO: Replace with real indoor positions (x,y) captured during survey
  // For now, generate positions based on measurement order if x,y are 0
  const getHeatmapPoints = (): HeatmapPoint[] => {
    return filteredMeasurements.map((m, idx) => {
      let x = m.x;
      let y = m.y;

      // If no position data, create a simple grid layout
      if (x === 0 && y === 0) {
        const cols = Math.ceil(Math.sqrt(filteredMeasurements.length));
        x = (idx % cols) * (CANVAS_WIDTH / cols) + (CANVAS_WIDTH / cols) / 2;
        y = Math.floor(idx / cols) * (CANVAS_HEIGHT / cols) + (CANVAS_HEIGHT / cols) / 2;
      }

      return {
        x,
        y,
        value: m[selectedMetric],
        measurement: m,
      };
    });
  };

  // Color mapping for signal strength
  const getColorForValue = (value: number, metric: MetricType): string => {
    if (metric === 'rsrp') {
      // RSRP scale (dBm)
      if (value >= -70) return '#27AAE1'; // Excellent - GoFlexConnect blue
      if (value >= -85) return '#10B981'; // Good - green
      if (value >= -95) return '#F59E0B'; // Fair - yellow/orange
      if (value >= -105) return '#EF4444'; // Poor - red
      return '#991B1B'; // Very poor - dark red
    } else if (metric === 'sinr') {
      // SINR scale (dB)
      if (value >= 20) return '#27AAE1'; // Excellent
      if (value >= 13) return '#10B981'; // Good
      if (value >= 0) return '#F59E0B'; // Fair
      return '#EF4444'; // Poor
    } else if (metric === 'rsrq') {
      // RSRQ scale (dB)
      if (value >= -10) return '#27AAE1'; // Excellent
      if (value >= -15) return '#10B981'; // Good
      if (value >= -20) return '#F59E0B'; // Fair
      return '#EF4444'; // Poor
    }
    return '#6B7280'; // Default gray
  };

  // Draw the heatmap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1F2937'; // Dark background
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      const x = (i / GRID_SIZE) * CANVAS_WIDTH;
      const y = (i / GRID_SIZE) * CANVAS_HEIGHT;

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Draw measurement points
    const points = getHeatmapPoints();
    points.forEach((point) => {
      const color = getColorForValue(point.value, selectedMetric);

      // Draw glow effect
      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, 30);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.5, color + '80'); // 50% opacity
      gradient.addColorStop(1, color + '00'); // transparent

      ctx.fillStyle = gradient;
      ctx.fillRect(point.x - 30, point.y - 30, 60, 60);

      // Draw point marker
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Add white border to point
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [filteredMeasurements, selectedMetric]);

  // Handle mouse move for tooltips
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    setMousePos({ x: e.clientX, y: e.clientY });

    // Check if hovering over any point
    const points = getHeatmapPoints();
    const hoveredPoint = points.find(p => {
      const distance = Math.sqrt(Math.pow(p.x - mouseX, 2) + Math.pow(p.y - mouseY, 2));
      return distance < 10;
    });

    setHoveredPoint(hoveredPoint || null);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  // Export heatmap as image with watermark
  const handleExportImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setExporting(true);
    try {
      // Clone the canvas to avoid modifying the display
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      const exportCtx = exportCanvas.getContext('2d');

      if (exportCtx) {
        // Copy current canvas content
        exportCtx.drawImage(canvas, 0, 0);

        // Apply watermark if on free plan
        const userPlan = getUserPlan(settings);
        await applyLogoWatermark(exportCanvas, userPlan);

        // Download the image
        const dataUrl = exportCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `heatmap-${selectedMetric}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error('Failed to export heatmap:', error);
    } finally {
      setExporting(false);
    }
  };

  // Legend data based on selected metric
  const getLegendData = () => {
    if (selectedMetric === 'rsrp') {
      return [
        { label: 'Excellent', range: '≥ -70 dBm', color: '#27AAE1' },
        { label: 'Good', range: '-70 to -85 dBm', color: '#10B981' },
        { label: 'Fair', range: '-85 to -95 dBm', color: '#F59E0B' },
        { label: 'Poor', range: '-95 to -105 dBm', color: '#EF4444' },
        { label: 'Very Poor', range: '< -105 dBm', color: '#991B1B' },
      ];
    } else if (selectedMetric === 'sinr') {
      return [
        { label: 'Excellent', range: '≥ 20 dB', color: '#27AAE1' },
        { label: 'Good', range: '13 to 20 dB', color: '#10B981' },
        { label: 'Fair', range: '0 to 13 dB', color: '#F59E0B' },
        { label: 'Poor', range: '< 0 dB', color: '#EF4444' },
      ];
    } else if (selectedMetric === 'rsrq') {
      return [
        { label: 'Excellent', range: '≥ -10 dB', color: '#27AAE1' },
        { label: 'Good', range: '-10 to -15 dB', color: '#10B981' },
        { label: 'Fair', range: '-15 to -20 dB', color: '#F59E0B' },
        { label: 'Poor', range: '< -20 dB', color: '#EF4444' },
      ];
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-goflex-bg dark:bg-goflex-bg">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white dark:text-white mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Indoor Coverage Heatmap
            </h1>
            {floorName && (
              <p className="text-gray-400">
                {floorName} · {filteredMeasurements.length} measurement{filteredMeasurements.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={handleExportImage}
            disabled={exporting || filteredMeasurements.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-goflex-blue hover:bg-goflex-blue-dark text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            {exporting ? 'Exporting...' : 'Export Image'}
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-goflex-card border border-gray-800 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Metric Selector */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Signal Metric
              </label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-goflex-blue transition-colors"
              >
                <option value="rsrp">RSRP (Reference Signal Received Power)</option>
                <option value="rsrq">RSRQ (Reference Signal Received Quality)</option>
                <option value="sinr">SINR (Signal-to-Interference-plus-Noise Ratio)</option>
                <option value="rssi">RSSI (Received Signal Strength Indicator)</option>
              </select>
            </div>

            {/* Carrier Filter */}
            {carriers.length > 1 && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Carrier
                </label>
                <select
                  value={selectedCarrier}
                  onChange={(e) => setSelectedCarrier(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-goflex-blue transition-colors"
                >
                  {carriers.map(carrier => (
                    <option key={carrier} value={carrier}>
                      {carrier === 'all' ? 'All Carriers' : carrier}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Canvas Area */}
          <div className="lg:col-span-3">
            <div className="bg-goflex-card border border-gray-800 rounded-2xl p-6 shadow-lg">
              <div ref={containerRef} className="relative">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  className="w-full h-auto rounded-xl cursor-crosshair"
                  style={{ maxHeight: '600px' }}
                />

                {/* Tooltip */}
                {hoveredPoint && (
                  <div
                    className="fixed z-50 bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-2xl pointer-events-none"
                    style={{
                      left: mousePos.x + 15,
                      top: mousePos.y + 15,
                      minWidth: '250px',
                    }}
                  >
                    <div className="space-y-2">
                      <div className="text-white font-semibold border-b border-gray-700 pb-2">
                        Measurement Details
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">RSRP:</span>
                          <span className="text-white font-medium">{hoveredPoint.measurement.rsrp} dBm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">RSRQ:</span>
                          <span className="text-white font-medium">{hoveredPoint.measurement.rsrq} dB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">SINR:</span>
                          <span className="text-white font-medium">{hoveredPoint.measurement.sinr} dB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Network:</span>
                          <span className="text-white font-medium">{hoveredPoint.measurement.techType}</span>
                        </div>
                        {hoveredPoint.measurement.carrierName && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Carrier:</span>
                            <span className="text-white font-medium">{hoveredPoint.measurement.carrierName}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400">Time:</span>
                          <span className="text-white font-medium">
                            {new Date(hoveredPoint.measurement.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* TODO: Future enhancement - Add real floorplan image as background layer */}
              {/* <img src={floorPlanUrl} className="absolute inset-0 opacity-30" /> */}

              <div className="mt-4 text-center text-sm text-gray-500">
                {filteredMeasurements.length === 0 ? (
                  <p>No measurements available. Start a survey to collect data.</p>
                ) : (
                  <p>Hover over points to view detailed metrics</p>
                )}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="lg:col-span-1">
            <div className="bg-goflex-card border border-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-semibold text-white mb-4">Signal Quality</h3>
              <div className="space-y-3">
                {getLegendData().map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1">
                      <div className="text-white text-sm font-medium">{item.label}</div>
                      <div className="text-gray-400 text-xs">{item.range}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-700">
                <h4 className="text-sm font-semibold text-white mb-2">Coverage Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Points:</span>
                    <span className="text-white">{filteredMeasurements.length}</span>
                  </div>
                  {filteredMeasurements.length > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Avg {selectedMetric.toUpperCase()}:</span>
                        <span className="text-white">
                          {(filteredMeasurements.reduce((sum, m) => sum + m[selectedMetric], 0) / filteredMeasurements.length).toFixed(1)}
                          {selectedMetric === 'rsrp' ? ' dBm' : ' dB'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
