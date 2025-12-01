import { useState, useEffect } from 'react';
import { ArrowLeft, Target, Play, Pause, StopCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Measurement } from '../types';
import { getSignalQuality } from '../utils/qualityUtils';
import { getCellularNetworkInfo } from '../utils/networkUtils';
import { generateUUID } from '../utils/uuid';

interface BenchmarkTestProps {
  projectId: string;
  floorId?: string;
  onBack: () => void;
}

interface BenchmarkConfig {
  targetCount: number;
  interval: number;
  autoCapture: boolean;
}

export default function BenchmarkTest({ projectId, floorId, onBack }: BenchmarkTestProps) {
  const addMeasurement = useStore((state) => state.addMeasurement);
  const settings = useStore((state) => state.settings);
  const allMeasurements = useStore((state) => state.measurements);

  const measurements = floorId
    ? allMeasurements.filter((m) => m.floorId === floorId)
    : allMeasurements.filter((m) => m.projectId === projectId && !m.floorId);

  const [config, setConfig] = useState<BenchmarkConfig>({
    targetCount: 10,
    interval: 5,
    autoCapture: true,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentCount, setCurrentCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [benchmarkMeasurements, setBenchmarkMeasurements] = useState<Measurement[]>([]);
  const [currentSample, setCurrentSample] = useState<any>(null);

  useEffect(() => {
    if (!isRunning || isPaused) return;

    const captureInterval = setInterval(async () => {
      if (currentCount >= config.targetCount) {
        setIsRunning(false);
        return;
      }

      const networkInfo = await getCellularNetworkInfo();
      setCurrentSample(networkInfo);

      if (config.autoCapture) {
        const measurement: Measurement = {
          id: generateUUID(),
          projectId,
          floorId: floorId || '',
          x: 0.5,
          y: 0.5,
          locationNumber: measurements.length + benchmarkMeasurements.length + 1,
          rsrp: networkInfo.rsrp,
          rsrq: networkInfo.rsrq,
          sinr: networkInfo.sinr,
          rssi: networkInfo.rssi,
          cellId: networkInfo.cellId,
          techType: networkInfo.connectionType === '5G' ? '5G' : networkInfo.connectionType === 'LTE' ? 'LTE' : '4G',
          timestamp: Date.now(),
        };

        addMeasurement(measurement);
        setBenchmarkMeasurements((prev) => [...prev, measurement]);
        setCurrentCount((prev) => prev + 1);
      }
    }, config.interval * 1000);

    return () => clearInterval(captureInterval);
  }, [isRunning, isPaused, currentCount, config, projectId, floorId, addMeasurement, measurements.length, benchmarkMeasurements.length]);

  useEffect(() => {
    if (!isRunning || isPaused) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          return config.interval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, isPaused, config.interval]);

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
    setCurrentCount(0);
    setBenchmarkMeasurements([]);
    setTimeRemaining(config.interval);
  };

  const handlePause = () => {
    setIsPaused(!isPaused);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentCount(0);
    setTimeRemaining(0);
  };

  const stats = benchmarkMeasurements.length > 0 ? {
    avgRsrp: benchmarkMeasurements.reduce((sum, m) => sum + m.rsrp, 0) / benchmarkMeasurements.length,
    avgRsrq: benchmarkMeasurements.reduce((sum, m) => sum + m.rsrq, 0) / benchmarkMeasurements.length,
    avgSinr: benchmarkMeasurements.reduce((sum, m) => sum + m.sinr, 0) / benchmarkMeasurements.length,
    avgRssi: benchmarkMeasurements.reduce((sum, m) => sum + m.rssi, 0) / benchmarkMeasurements.length,
    minRsrp: Math.min(...benchmarkMeasurements.map((m) => m.rsrp)),
    maxRsrp: Math.max(...benchmarkMeasurements.map((m) => m.rsrp)),
  } : null;

  const progress = (currentCount / config.targetCount) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <div className="flex items-center">
            <Target className="w-8 h-8 text-goflex-blue mr-3" />
            <h1 className="text-3xl font-bold text-white">Benchmark Testing</h1>
          </div>
          <div className="w-24"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Configuration</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Target Sample Count
                </label>
                <input
                  type="number"
                  value={config.targetCount}
                  onChange={(e) => setConfig({ ...config, targetCount: parseInt(e.target.value) })}
                  disabled={isRunning}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-goflex-blue focus:border-transparent disabled:opacity-50"
                  min="1"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Interval (seconds)
                </label>
                <input
                  type="number"
                  value={config.interval}
                  onChange={(e) => setConfig({ ...config, interval: parseInt(e.target.value) })}
                  disabled={isRunning}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-goflex-blue focus:border-transparent disabled:opacity-50"
                  min="1"
                  max="60"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoCapture"
                  checked={config.autoCapture}
                  onChange={(e) => setConfig({ ...config, autoCapture: e.target.checked })}
                  disabled={isRunning}
                  className="w-5 h-5 rounded bg-gray-800 border-gray-700 text-goflex-blue focus:ring-2 focus:ring-goflex-blue disabled:opacity-50"
                />
                <label htmlFor="autoCapture" className="ml-3 text-sm font-medium text-gray-300">
                  Auto-capture samples
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="flex-1 bg-gradient-to-r from-goflex-blue to-blue-600 text-white rounded-lg py-3 font-semibold hover:shadow-lg hover:shadow-goflex-blue/25 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Start Test
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePause}
                    className="flex-1 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-lg py-3 font-semibold hover:shadow-lg hover:shadow-yellow-600/25 transition-all flex items-center justify-center gap-2"
                  >
                    <Pause className="w-5 h-5" />
                    {isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button
                    onClick={handleStop}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg py-3 font-semibold hover:shadow-lg hover:shadow-red-600/25 transition-all flex items-center justify-center gap-2"
                  >
                    <StopCircle className="w-5 h-5" />
                    Stop
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Progress</h2>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Samples Collected</span>
                  <span>{currentCount} / {config.targetCount}</span>
                </div>
                <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-goflex-blue to-blue-600 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {isRunning && !isPaused && (
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">{timeRemaining}</div>
                  <div className="text-sm text-gray-400">seconds until next sample</div>
                </div>
              )}

              {isPaused && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400 mb-2">PAUSED</div>
                  <div className="text-sm text-gray-400">Click Resume to continue</div>
                </div>
              )}

              {currentSample && (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">Current Reading</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-500">RSRP</div>
                      <div className="text-lg font-bold text-white">{currentSample.rsrp.toFixed(1)} dBm</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">SINR</div>
                      <div className="text-lg font-bold text-white">{currentSample.sinr.toFixed(1)} dB</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">RSRQ</div>
                      <div className="text-lg font-bold text-white">{currentSample.rsrq.toFixed(1)} dB</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">RSSI</div>
                      <div className="text-lg font-bold text-white">{currentSample.rssi.toFixed(1)} dBm</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {stats && (
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Statistics</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Avg RSRP</div>
                <div className="text-2xl font-bold text-white">{stats.avgRsrp.toFixed(1)} dBm</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Avg SINR</div>
                <div className="text-2xl font-bold text-white">{stats.avgSinr.toFixed(1)} dB</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Min RSRP</div>
                <div className="text-2xl font-bold text-red-400">{stats.minRsrp.toFixed(1)} dBm</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Max RSRP</div>
                <div className="text-2xl font-bold text-green-400">{stats.maxRsrp.toFixed(1)} dBm</div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-bold text-white mb-4">Sample Data</h3>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">#</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">Time</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">RSRP</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">RSRQ</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">SINR</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-400">RSSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmarkMeasurements.map((m, i) => {
                      const quality = getSignalQuality(m, settings.thresholds);
                      return (
                        <tr key={i} className="border-b border-gray-800 hover:bg-gray-800/30">
                          <td className="px-4 py-2 text-sm text-gray-400">{i + 1}</td>
                          <td className="px-4 py-2 text-sm text-gray-300">
                            {new Date(m.timestamp).toLocaleTimeString()}
                          </td>
                          <td className={`px-4 py-2 text-sm font-mono font-bold ${quality.rsrpColor}`}>
                            {m.rsrp.toFixed(1)}
                          </td>
                          <td className="px-4 py-2 text-sm text-white font-mono">{m.rsrq.toFixed(1)}</td>
                          <td className={`px-4 py-2 text-sm font-mono font-bold ${quality.sinrColor}`}>
                            {m.sinr.toFixed(1)}
                          </td>
                          <td className="px-4 py-2 text-sm text-white font-mono">{m.rssi.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
