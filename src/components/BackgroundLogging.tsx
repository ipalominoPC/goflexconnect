import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Pause, Radio, Clock, MapPin, Activity } from 'lucide-react';
import { backgroundLogger } from '../services/backgroundLogger';
import { useStore } from '../store/useStore';

interface BackgroundLoggingProps {
  projectId: string;
  floorId?: string;
  onBack: () => void;
}

interface LogEvent {
  timestamp: number;
  status: string;
  measurement?: {
    rsrp: number;
    rsrq: number;
    sinr: number;
    latitude: number;
    longitude: number;
  };
}

export default function BackgroundLogging({ projectId, floorId, onBack }: BackgroundLoggingProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [interval, setInterval] = useState(30);
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const user = useStore((state) => state.user);

  useEffect(() => {
    const status = backgroundLogger.getStatus();
    setIsRunning(status.isRunning);

    const unsubscribe = backgroundLogger.subscribe((data: any) => {
      const event: LogEvent = {
        timestamp: data.timestamp,
        status: data.status,
        measurement: data.measurement,
      };

      setEvents(prev => [event, ...prev].slice(0, 50));

      if (data.status === 'logged') {
        setTotalLogs(prev => prev + 1);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && startTime) {
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, startTime]);

  const handleStart = () => {
    if (!user) {
      alert('Please log in to use background logging');
      return;
    }

    backgroundLogger.start({
      projectId,
      floorId,
      userId: user.id,
      interval,
      enabled: true,
    });

    setIsRunning(true);
    setStartTime(Date.now());
    setTotalLogs(0);
    setEvents([]);
  };

  const handleStop = () => {
    backgroundLogger.stop();
    setIsRunning(false);
    setStartTime(null);
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getSignalQuality = (rsrp?: number) => {
    if (!rsrp) return { label: 'Unknown', color: 'text-gray-600' };
    if (rsrp >= -80) return { label: 'Excellent', color: 'text-green-600' };
    if (rsrp >= -90) return { label: 'Good', color: 'text-blue-600' };
    if (rsrp >= -100) return { label: 'Fair', color: 'text-yellow-600' };
    return { label: 'Poor', color: 'text-red-600' };
  };

  return (
    <div className="min-h-screen bg-goflex-bg">
      <div className="container mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Background Logging</h1>
                <p className="text-gray-600">Continuous measurement logging in the background</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Activity className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                <div className="flex items-center text-blue-600 mb-2">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Running Time</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{formatDuration(elapsedTime)}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                <div className="flex items-center text-green-600 mb-2">
                  <Radio className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Total Logs</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{totalLogs}</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
                <div className="flex items-center text-orange-600 mb-2">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <p className="text-2xl font-bold text-orange-900">
                  {isRunning ? 'Active' : 'Stopped'}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Logging Interval (seconds)
              </label>
              <input
                type="number"
                min="5"
                max="300"
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                disabled={isRunning}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Measurements will be logged every {interval} seconds
              </p>
            </div>

            <button
              onClick={isRunning ? handleStop : handleStart}
              className={`w-full py-4 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
                isRunning
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5" />
                  Stop Background Logging
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start Background Logging
                </>
              )}
            </button>

            {isRunning && (
              <div className="mt-4 p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-lg border border-teal-200">
                <p className="text-sm text-teal-800 font-medium">
                  Background logging is active. Measurements are being collected automatically.
                </p>
                <p className="text-xs text-teal-600 mt-1">
                  You can minimize this window and the logging will continue.
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Events</h2>
            {events.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No events yet</p>
                <p className="text-gray-400 text-sm mt-2">Start logging to see events</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {events.map((event, index) => {
                  const time = new Date(event.timestamp).toLocaleTimeString();
                  const quality = getSignalQuality(event.measurement?.rsrp);

                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">{time}</span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          event.status === 'logged' ? 'bg-green-100 text-green-700' :
                          event.status === 'started' ? 'bg-blue-100 text-blue-700' :
                          event.status === 'stopped' ? 'bg-gray-100 text-gray-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {event.status.toUpperCase()}
                        </span>
                      </div>

                      {event.measurement && (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-2">
                            <div>
                              <span className="text-gray-500">RSRP:</span>
                              <span className="ml-2 font-medium">{event.measurement.rsrp.toFixed(1)} dBm</span>
                            </div>
                            <div>
                              <span className="text-gray-500">RSRQ:</span>
                              <span className="ml-2 font-medium">{event.measurement.rsrq.toFixed(1)} dB</span>
                            </div>
                            <div>
                              <span className="text-gray-500">SINR:</span>
                              <span className="ml-2 font-medium">{event.measurement.sinr.toFixed(1)} dB</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {event.measurement.latitude.toFixed(6)}, {event.measurement.longitude.toFixed(6)}
                            </span>
                            <span className={`text-xs font-semibold ${quality.color}`}>
                              {quality.label}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
