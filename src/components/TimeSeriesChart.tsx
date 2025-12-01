import { useState, useMemo } from 'react';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Measurement } from '../types';

interface TimeSeriesChartProps {
  projectId?: string;
  floorId?: string;
  onBack: () => void;
}

type MetricType = 'rsrp' | 'rsrq' | 'sinr' | 'rssi';
type TimeRange = '1h' | '6h' | '24h' | '7d' | 'all';

export default function TimeSeriesChart({ projectId, floorId, onBack }: TimeSeriesChartProps) {
  const allMeasurements = useStore((state) => state.measurements);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('rsrp');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  const measurements = useMemo(() => {
    let filtered = allMeasurements;
    if (floorId) {
      filtered = filtered.filter((m) => m.floorId === floorId);
    } else if (projectId) {
      filtered = filtered.filter((m) => m.projectId === projectId && !m.floorId);
    }
    return filtered.sort((a, b) => a.timestamp - b.timestamp);
  }, [allMeasurements, projectId, floorId]);

  const filteredData = useMemo(() => {
    const now = Date.now();
    const ranges: Record<TimeRange, number> = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      'all': Infinity,
    };
    const cutoff = now - ranges[timeRange];
    return measurements.filter((m) => m.timestamp >= cutoff);
  }, [measurements, timeRange]);

  const chartData = useMemo(() => {
    if (filteredData.length === 0) return { points: [], min: 0, max: 0, avg: 0 };

    const values = filteredData.map((m) => m[selectedMetric]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

    const minTime = Math.min(...filteredData.map((m) => m.timestamp));
    const maxTime = Math.max(...filteredData.map((m) => m.timestamp));
    const timeSpan = maxTime - minTime || 1;

    const points = filteredData.map((m, i) => {
      const x = ((m.timestamp - minTime) / timeSpan) * 100;
      const valueRange = max - min || 1;
      const y = 100 - ((m[selectedMetric] - min) / valueRange) * 100;
      return { x, y, value: m[selectedMetric], timestamp: m.timestamp, index: i };
    });

    return { points, min, max, avg };
  }, [filteredData, selectedMetric]);

  const getMetricColor = (metric: MetricType) => {
    const colors = {
      rsrp: 'rgb(59, 130, 246)',
      rsrq: 'rgb(16, 185, 129)',
      sinr: 'rgb(245, 158, 11)',
      rssi: 'rgb(139, 92, 246)',
    };
    return colors[metric];
  };

  const getMetricUnit = (metric: MetricType) => {
    if (metric === 'rsrq' || metric === 'sinr') return 'dB';
    return 'dBm';
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    if (timeRange === '1h' || timeRange === '6h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeRange === '24h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const pathData = chartData.points.length > 0
    ? `M ${chartData.points.map((p) => `${p.x},${p.y}`).join(' L ')}`
    : '';

  const areaPathData = chartData.points.length > 0
    ? `${pathData} L ${chartData.points[chartData.points.length - 1].x},100 L ${chartData.points[0].x},100 Z`
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-goflex-blue mr-3" />
            <h1 className="text-3xl font-bold text-white">Time Series Analysis</h1>
          </div>
          <div className="w-24"></div>
        </div>

        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 mb-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Metric</label>
              <div className="flex gap-2">
                {(['rsrp', 'rsrq', 'sinr', 'rssi'] as MetricType[]).map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setSelectedMetric(metric)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      selectedMetric === metric
                        ? 'bg-goflex-blue text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {metric.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Time Range</label>
              <div className="flex gap-2">
                {(['1h', '6h', '24h', '7d', 'all'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                      timeRange === range
                        ? 'bg-goflex-blue text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {range === 'all' ? 'All' : range.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {filteredData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No data available for the selected time range</p>
              <p className="text-gray-500 text-sm mt-2">
                Try selecting a longer time range or collect more measurements
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Displaying <span className="text-white font-semibold">{filteredData.length}</span> measurement{filteredData.length !== 1 ? 's' : ''}
                  <span className="ml-2">({timeRange === 'all' ? 'all time' : `last ${timeRange}`})</span>
                </div>
                {filteredData.length < measurements.length && (
                  <div className="text-xs text-amber-400">
                    {measurements.length - filteredData.length} measurement{measurements.length - filteredData.length !== 1 ? 's' : ''} filtered out
                  </div>
                )}
              </div>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Current</div>
                  <div className="text-2xl font-bold text-white">
                    {chartData.points[chartData.points.length - 1]?.value.toFixed(1)} {getMetricUnit(selectedMetric)}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Average</div>
                  <div className="text-2xl font-bold text-white">
                    {chartData.avg.toFixed(1)} {getMetricUnit(selectedMetric)}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Minimum</div>
                  <div className="text-2xl font-bold text-red-400">
                    {chartData.min.toFixed(1)} {getMetricUnit(selectedMetric)}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">Maximum</div>
                  <div className="text-2xl font-bold text-green-400">
                    {chartData.max.toFixed(1)} {getMetricUnit(selectedMetric)}
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/30 rounded-xl p-6">
                <svg
                  key={`${timeRange}-${selectedMetric}`}
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="w-full h-64"
                  style={{ overflow: 'visible' }}
                >
                  <defs>
                    <linearGradient id={`areaGradient-${selectedMetric}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={getMetricColor(selectedMetric)} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={getMetricColor(selectedMetric)} stopOpacity="0.05" />
                    </linearGradient>
                  </defs>

                  <path
                    d={areaPathData}
                    fill={`url(#areaGradient-${selectedMetric})`}
                  />

                  <path
                    d={pathData}
                    fill="none"
                    stroke={getMetricColor(selectedMetric)}
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                  />

                  {chartData.points.map((point, i) => (
                    <g key={i}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="1"
                        fill={getMetricColor(selectedMetric)}
                        vectorEffect="non-scaling-stroke"
                      />
                    </g>
                  ))}
                </svg>

                <div className="flex justify-between mt-4 text-xs text-gray-500">
                  {chartData.points.length > 0 && (
                    <>
                      <span>{formatTimestamp(chartData.points[0].timestamp)}</span>
                      <span>{formatTimestamp(chartData.points[chartData.points.length - 1].timestamp)}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Data Points ({filteredData.length})</h3>
                  <div className="text-sm text-gray-400">
                    Showing {timeRange === 'all' ? 'all time' : `last ${timeRange}`}
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">Time</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">RSRP</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">RSRQ</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">SINR</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">RSSI</th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((m, i) => (
                        <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/30">
                          <td className="px-4 py-2 text-sm text-gray-300">
                            {new Date(m.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-sm text-white font-mono">{m.rsrp.toFixed(1)}</td>
                          <td className="px-4 py-2 text-sm text-white font-mono">{m.rsrq.toFixed(1)}</td>
                          <td className="px-4 py-2 text-sm text-white font-mono">{m.sinr.toFixed(1)}</td>
                          <td className="px-4 py-2 text-sm text-white font-mono">{m.rssi.toFixed(1)}</td>
                          <td className="px-4 py-2 text-sm text-gray-400">#{m.locationNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
