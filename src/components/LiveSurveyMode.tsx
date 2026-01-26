import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Activity, MapPin, Wifi, AlertCircle, CheckCircle } from 'lucide-react';
import {
  getCurrentLocation,
  watchLocation,
  clearLocationWatch,
  requestLocationPermissions,
  isNativeApp,
  type LocationData
} from '../services/deviceService';
import {
  getCellularSignal,
  watchCellularSignal,
  clearSignalWatch,
  formatSignalForDisplay,
  type SignalStrength
} from '../services/cellularSignalService';

/**
 * LiveSurveyMode Component
 * 
 * Real-time signal surveying with GPS tracking
 * Shows live signal strength as user moves around
 * Tap to record measurement at current location
 */

interface LiveSurveyModeProps {
  projectId: string;
  floorId?: string;
  onBack, onMeasurementSaved?: (measurement: any) => void; onBack: () => void;
}

export default function LiveSurveyMode({ 
  projectId, 
  floorId,
  onBack, onMeasurementSaved 
}: LiveSurveyModeProps) {
  // State
  const [isActive, setIsActive] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [currentSignal, setCurrentSignal] = useState<SignalStrength | null>(null);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  // Refs for watch IDs
  const locationWatchId = useRef<string | null>(null);
  const signalWatchId = useRef<number | null>(null);
  
  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSurvey();
    };
  }, []);
  
  /**
   * Check and request location permissions
   */
  async function checkPermissions() {
    try {
      const granted = await requestLocationPermissions();
      setPermissionGranted(granted);
      
      if (!granted) {
        setError('Location permission is required for surveys. Please enable in Settings.');
      }
    } catch (err) {
      console.error('Permission check error:', err);
      setError('Failed to check permissions');
    }
  }
  
  /**
   * Start live survey mode
   */
  async function startSurvey() {
    try {
      setError(null);
      
      // Check permissions first
      if (!permissionGranted) {
        await checkPermissions();
        return;
      }
      
      // Get initial location
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      
      // Get initial signal
      const signal = await getCellularSignal();
      setCurrentSignal(signal);
      
      // Start watching location
      const locWatchId = watchLocation(
        (loc) => {
          setCurrentLocation(loc);
        },
        (err) => {
          console.error('Location watch error:', err);
          setError(err.message);
        }
      );
      locationWatchId.current = locWatchId;
      
      // Start watching signal
      const sigWatchId = watchCellularSignal(
        (sig) => {
          setCurrentSignal(sig);
        },
        2000 // Update every 2 seconds
      );
      signalWatchId.current = sigWatchId;
      
      setIsActive(true);
      
    } catch (err: any) {
      console.error('Start survey error:', err);
      setError(err.message || 'Failed to start survey');
    }
  }
  
  /**
   * Stop live survey mode
   */
  function stopSurvey() {
    if (locationWatchId.current) {
      clearLocationWatch(locationWatchId.current);
      locationWatchId.current = null;
    }
    
    if (signalWatchId.current) {
      clearSignalWatch(signalWatchId.current);
      signalWatchId.current = null;
    }
    
    setIsActive(false);
  }
  
  /**
   * Record measurement at current location
   */
  async function recordMeasurement() {
    if (!currentLocation || !currentSignal) {
      setError('Waiting for location and signal data...');
      return;
    }
    
    try {
      // Create measurement object
      const measurement = {
        project_id: projectId,
        floor_id: floorId || null,
        
        // Location
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy,
        altitude: currentLocation.altitude,
        
        // Signal
        rssi: currentSignal.rssi,
        rsrp: currentSignal.rsrp,
        rsrq: currentSignal.rsrq,
        sinr: currentSignal.sinr,
        signal_bars: currentSignal.bars,
        signal_level: currentSignal.level,
        network_type: currentSignal.networkType,
        carrier: currentSignal.carrier,
        
        // Metadata
        measured_at: new Date().toISOString(),
        source: isNativeApp() ? 'mobile_app' : 'web_app'
      };
      
      // TODO: Save to Supabase
      // const { data, error } = await supabase
      //   .from('measurements')
      //   .insert(measurement)
      //   .select()
      //   .single();
      
      // For now, just add to local state
      setMeasurements(prev => [...prev, measurement]);
      
      if (onBack, onMeasurementSaved) {
        onBack, onMeasurementSaved(measurement);
      }
      
      // Visual feedback
      // TODO: Add haptic feedback on mobile
      
    } catch (err: any) {
      console.error('Record measurement error:', err);
      setError(err.message || 'Failed to save measurement');
    }
  }
  
  // Format signal for display
  const signalDisplay = currentSignal ? formatSignalForDisplay(currentSignal) : null;
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3"><button onClick={onBack} className="p-1 -ml-1 text-gray-600 hover:text-gray-900 transition-colors"><ArrowLeft className="w-6 h-6" /></button><h2 className="text-lg font-semibold">Live Survey</h2></div>
        <div className="flex items-center gap-2">
          {isActive && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Activity className="w-4 h-4 animate-pulse" />
              Active
            </span>
          )}
        </div>
      </div>
      
      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Signal Display */}
        <div className="bg-white border-b p-6">
          <div className="flex items-center gap-3 mb-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: signalDisplay?.color || '#9ca3af' }}
            >
              <Wifi className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold">
                {signalDisplay?.primary || 'No Signal'}
              </div>
              <div className="text-sm text-gray-600">
                {signalDisplay?.secondary || 'Waiting for signal...'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{currentSignal?.bars || 0}</div>
              <div className="text-xs text-gray-500">bars</div>
            </div>
          </div>
          
          {/* Signal Details */}
          {currentSignal && (
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
              <div className="text-sm">
                <div className="text-gray-500">RSSI</div>
                <div className="font-semibold">{currentSignal.rssi} dBm</div>
              </div>
              <div className="text-sm">
                <div className="text-gray-500">RSRP</div>
                <div className="font-semibold">{currentSignal.rsrp} dBm</div>
              </div>
              <div className="text-sm">
                <div className="text-gray-500">RSRQ</div>
                <div className="font-semibold">{currentSignal.rsrq} dB</div>
              </div>
              <div className="text-sm">
                <div className="text-gray-500">Network</div>
                <div className="font-semibold">{currentSignal.networkType || 'Unknown'}</div>
              </div>
            </div>
          )}
        </div>
        
        {/* Location Display */}
        <div className="bg-white border-b p-4">
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              {currentLocation ? (
                <>
                  <div className="text-sm font-medium">Location Acquired</div>
                  <div className="text-xs text-gray-600 mt-1 font-mono">
                    {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Accuracy: ±{currentLocation.accuracy.toFixed(1)}m
                    {currentLocation.altitude && ` • Altitude: ${currentLocation.altitude.toFixed(1)}m`}
                  </div>
                </>
              ) : (
                <div className="text-sm text-gray-500">Waiting for GPS...</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Measurements List */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Measurements</h3>
            <span className="text-sm text-gray-500">{measurements.length} recorded</span>
          </div>
          
          {measurements.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No measurements yet. Tap "Record" to start.
            </div>
          ) : (
            <div className="space-y-2">
              {measurements.map((m, index) => (
                <div key={index} className="bg-white rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{m.rssi} dBm</div>
                      <div className="text-xs text-gray-500">
                        {new Date(m.measured_at).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm">{m.signal_bars} bars</div>
                      <div className="text-xs text-gray-500">{m.network_type}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Controls */}
      <div className="bg-white border-t p-4 space-y-3">
        {!isActive ? (
          <button
            onClick={startSurvey}
            disabled={!permissionGranted}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {permissionGranted ? 'Start Survey' : 'Grant Location Permission'}
          </button>
        ) : (
          <>
            <button
              onClick={recordMeasurement}
              disabled={!currentLocation || !currentSignal}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Record Measurement
            </button>
            
            <button
              onClick={stopSurvey}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold"
            >
              Stop Survey
            </button>
          </>
        )}
      </div>
    </div>
  );
}
