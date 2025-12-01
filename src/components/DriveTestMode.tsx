import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, MapPin, Radio, Navigation, Clock } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useStore } from '../store/useStore';

interface DriveTestModeProps {
  projectId: string;
  floorId?: string;
  onBack: () => void;
}

interface MeasurementLog {
  id: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  rsrp: number;
  rsrq: number;
  sinr: number;
  rssi: number;
  cellId: string;
  speed: number;
}

export default function DriveTestMode({ projectId, floorId, onBack }: DriveTestModeProps) {
  const [isLogging, setIsLogging] = useState(false);
  const [logs, setLogs] = useState<MeasurementLog[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [interval, setInterval] = useState(5);
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastPositionRef = useRef<{ lat: number; lon: number } | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const user = useStore((state) => state.user);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const logMeasurement = async (position: GeolocationPosition) => {
    const { latitude, longitude, speed } = position.coords;

    if (lastPositionRef.current) {
      const dist = calculateDistance(
        lastPositionRef.current.lat,
        lastPositionRef.current.lon,
        latitude,
        longitude
      );
      setDistance(prev => prev + dist);
    }
    lastPositionRef.current = { lat: latitude, lon: longitude };

    const mockSignals = {
      rsrp: -70 - Math.random() * 30,
      rsrq: -10 - Math.random() * 10,
      sinr: 10 + Math.random() * 20,
      rssi: -60 - Math.random() * 40,
      cellId: `CELL${Math.floor(Math.random() * 1000)}`,
    };

    const measurement = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      latitude,
      longitude,
      ...mockSignals,
      speed: speed || 0,
    };

    setLogs(prev => [measurement, ...prev]);
    setCurrentLocation({ lat: latitude, lon: longitude });

    if (user) {
      await supabase.from('measurements').insert({
        project_id: projectId,
        floor_id: floorId,
        user_id: user.id,
        x: longitude,
        y: latitude,
        location_number: logs.length + 1,
        rsrp: mockSignals.rsrp,
        rsrq: mockSignals.rsrq,
        sinr: mockSignals.sinr,
        rssi: mockSignals.rssi,
        cell_id: mockSignals.cellId,
        tech_type: '5G',
      });
    }
  };

  const startLogging = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLogging(true);
    setLogs([]);
    setDistance(0);
    setDuration(0);
    startTimeRef.current = Date.now();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        logMeasurement(position);
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
  };

  const stopLogging = () => {
    setIsLogging(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopLogging();
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getSignalQuality = (rsrp: number) => {
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Drive/Walk Test Mode</h1>
                <p className="text-gray-600">Continuously log measurements as you move</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Navigation className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                <div className="flex items-center text-blue-600 mb-2">
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Duration</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{formatDuration(duration)}</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                <div className="flex items-center text-green-600 mb-2">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Distance</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{(distance / 1000).toFixed(2)} km</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
                <div className="flex items-center text-orange-600 mb-2">
                  <Radio className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">Measurements</span>
                </div>
                <p className="text-2xl font-bold text-orange-900">{logs.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logging Interval (seconds)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={interval}
                  onChange={(e) => setInterval(Number(e.target.value))}
                  disabled={isLogging}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>
            </div>

            <button
              onClick={isLogging ? stopLogging : startLogging}
              className={`w-full py-4 rounded-xl font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
                isLogging
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
              }`}
            >
              {isLogging ? (
                <>
                  <Pause className="w-5 h-5" />
                  Stop Logging
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Start Logging
                </>
              )}
            </button>

            {currentLocation && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Current Location: {currentLocation.lat.toFixed(6)}, {currentLocation.lon.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Measurement Log</h2>
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <Radio className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No measurements logged yet</p>
                <p className="text-gray-400 text-sm mt-2">Start logging to begin collecting data</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {logs.map((log) => {
                  const quality = getSignalQuality(log.rsrp);
                  return (
                    <div key={log.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <span className={`text-sm font-semibold ${quality.color}`}>
                          {quality.label}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">RSRP:</span>
                          <span className="ml-2 font-medium">{log.rsrp.toFixed(1)} dBm</span>
                        </div>
                        <div>
                          <span className="text-gray-500">RSRQ:</span>
                          <span className="ml-2 font-medium">{log.rsrq.toFixed(1)} dB</span>
                        </div>
                        <div>
                          <span className="text-gray-500">SINR:</span>
                          <span className="ml-2 font-medium">{log.sinr.toFixed(1)} dB</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Speed:</span>
                          <span className="ml-2 font-medium">{(log.speed * 3.6).toFixed(1)} km/h</span>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        {log.latitude.toFixed(6)}, {log.longitude.toFixed(6)} • Cell: {log.cellId}
                      </div>
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
