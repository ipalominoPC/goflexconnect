import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Crosshair, Radio as RadioIcon, Grid3x3, Camera, AlertTriangle, CheckCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getMockSignalSample } from '../services/mockData';
import { Measurement } from '../types';
import ZoomableFloorPlan from './ZoomableFloorPlan';
import RFGridSettings from './RFGridSettings';
import { generateGridPoints, snapToGridCenter, getGridCellFromPosition, getGridLabel } from '../utils/gridUtils';
import { getSignalQuality, getComplianceStatus } from '../utils/qualityUtils';
import { generateUUID } from '../utils/uuid';
import { offlineStorage } from '../services/offlineStorage';
import { getNetworkContext } from '../utils/networkUtils';
import { detectNetworkInfo } from '../utils/networkInfo';
import { assertCanRecordMeasurement, trackAndEnforceMeasurementRecording } from '../services/planService';

interface SurveyModeProps {
  projectId: string;
  floorId?: string;
  onBack: () => void;
}

export default function SurveyMode({ projectId, floorId, onBack }: SurveyModeProps) {
  const projects = useStore((state) => state.projects);
  const floors = useStore((state) => state.floors);
  const allMeasurements = useStore((state) => state.measurements);
  const addMeasurement = useStore((state) => state.addMeasurement);
  const updateProject = useStore((state) => state.updateProject);
  const updateFloor = useStore((state) => state.updateFloor);
  const settings = useStore((state) => state.settings);
  const user = useStore((state) => state.user);

  const project = projects.find((p) => p.id === projectId);
  const floor = floorId ? floors.find((f) => f.id === floorId) : undefined;
  const measurements = floorId
    ? allMeasurements.filter((m) => m.floorId === floorId)
    : allMeasurements.filter((m) => m.projectId === projectId && !m.floorId);

  const [cursorPosition, setCursorPosition] = useState({ x: 0.5, y: 0.5 });
  const [lastSample, setLastSample] = useState<Measurement | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showGridSettings, setShowGridSettings] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [limitError, setLimitError] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const gridEnabled = floor?.gridEnabled || false;
  const gridSize = floor?.gridSize || 5;
  const gridPoints = gridEnabled ? generateGridPoints(gridSize, measurements) : [];

  const handleCanvasClick = (x: number, y: number) => {
    if (gridEnabled && gridSize > 0) {
      const snapped = snapToGridCenter(x, y, gridSize);
      setCursorPosition(snapped);
    } else {
      setCursorPosition({ x, y });
    }
  };

  const handleCaptureSample = async () => {
    setLimitError(null);

    // Check measurement limit before capturing
    if (user && projectId) {
      const surveyId = floorId || projectId;
      const limitCheck = await assertCanRecordMeasurement(user.id, surveyId);

      if (!limitCheck.allowed) {
        setLimitError(limitCheck.message || 'Measurement limit reached');
        return;
      }
    }

    setIsCapturing(true);

    const mockData = getMockSignalSample();
    const { gridX, gridY } = gridEnabled
      ? getGridCellFromPosition(cursorPosition.x, cursorPosition.y, gridSize)
      : { gridX: undefined, gridY: undefined };

    const measurementId = generateUUID();
    const photoId = photoData ? generateUUID() : undefined;

    if (photoData && photoId) {
      await offlineStorage.savePhoto(photoId, photoData);
    }

    const networkContext = getNetworkContext();
    const detectedNetwork = detectNetworkInfo();

    const measurement: Measurement = {
      id: measurementId,
      projectId,
      floorId: floorId || '',
      x: cursorPosition.x,
      y: cursorPosition.y,
      locationNumber: measurements.length + 1,
      rsrp: mockData.rsrp,
      rsrq: mockData.rsrq,
      sinr: mockData.sinr,
      rssi: mockData.rssi,
      cellId: mockData.cellId,
      techType: mockData.techType,
      timestamp: Date.now(),
      photoId: photoId,
      photoCaption: photoCaption || undefined,
      gridX,
      gridY,
      connectionType: networkContext.connectionType,
      effectiveType: networkContext.effectiveType,
      networkConnectionType: detectedNetwork.connectionType,
      networkEffectiveType: detectedNetwork.effectiveType,
      networkDownlink: detectedNetwork.downlink,
      networkRtt: detectedNetwork.rtt,
      deviceSummary: detectedNetwork.deviceSummary,
    };

    addMeasurement(measurement);
    updateProject(projectId, { updatedAt: Date.now() });
    if (floorId) {
      updateFloor(floorId, { updatedAt: Date.now() });
    }
    setLastSample(measurement);
    setPhotoData(null);
    setPhotoCaption('');

    // Track usage after successful measurement
    if (user) {
      const surveyId = floorId || projectId;
      await trackAndEnforceMeasurementRecording(user.id, surveyId, 1);
    }

    setTimeout(() => setIsCapturing(false), 300);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setLastSample(null);
    }, 5000);
  };

  const handleSaveGridSettings = (newGridSize: number, enabled: boolean) => {
    if (floorId) {
      updateFloor(floorId, {
        gridSize: newGridSize,
        gridEnabled: enabled,
        updatedAt: Date.now(),
      });
    }
  };

  const handlePhotoCapture = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Project not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="bg-gradient-to-b from-gray-900 to-gray-900/95 backdrop-blur-sm px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBack}
            className="group flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="font-semibold">Exit Survey</span>
          </button>
          <div className="flex items-center gap-2">
            {floorId && (
              <button
                onClick={() => setShowGridSettings(true)}
                className={`p-2 rounded-lg transition-colors ${
                  gridEnabled
                    ? 'bg-goflex-blue/20 text-goflex-blue border border-goflex-blue/30'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2 px-4 py-2 bg-goflex-blue/20 rounded-xl border border-goflex-blue/30">
              <div className="w-2 h-2 rounded-full bg-goflex-blue animate-pulse" />
              <span className="text-white font-bold">{measurements.length}</span>
              <span className="text-gray-300 text-sm">samples</span>
            </div>
          </div>
        </div>
        {(floor?.floorPlanFilename || project.floorPlanFilename) && (
          <div className="text-gray-400 text-sm truncate">
            {floor ? `${floor.name}: ` : 'Floor Plan: '}
            <span className="text-white">{floor?.floorPlanFilename || project.floorPlanFilename}</span>
          </div>
        )}
      </div>

      <ZoomableFloorPlan
        floorPlanImage={floor?.floorPlanImage || project.floorPlanImage}
        allowClick={true}
        onCanvasClick={handleCanvasClick}
      >
        {gridEnabled && gridPoints.map((point, idx) => (
          <div
            key={idx}
            className="absolute pointer-events-none"
            style={{
              left: `${point.x * 100}%`,
              top: `${point.y * 100}%`,
              width: `${100 / gridSize}%`,
              height: `${100 / gridSize}%`,
              transform: 'translate(-50%, -50%)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
            }}
          >
            {point.hasMeasurement && (
              <div className="absolute inset-0 bg-green-500/20" />
            )}
            <div className="absolute top-1 left-1 text-xs text-blue-400 font-mono bg-black/50 px-1 rounded">
              {getGridLabel(point.gridX, point.gridY)}
            </div>
          </div>
        ))}

        {measurements.map((m) => {
          const isRecent = Date.now() - m.timestamp < 1000;
          return (
            <div
              key={m.id}
              className={`absolute w-3 h-3 rounded-full transition-all ${
                isRecent ? 'scale-150 bg-green-400' : 'bg-blue-500'
              }`}
              style={{
                left: `${m.x * 100}%`,
                top: `${m.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)',
              }}
            >
              {m.photoId && (
                <Camera className="w-2 h-2 text-white absolute -top-1 -right-1" />
              )}
            </div>
          );
        })}

        <div
          className="absolute pointer-events-none"
          style={{
            left: `${cursorPosition.x * 100}%`,
            top: `${cursorPosition.y * 100}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Crosshair className="w-8 h-8 text-yellow-400 drop-shadow-lg" />
        </div>
      </ZoomableFloorPlan>

      {lastSample && (() => {
        const quality = getSignalQuality(lastSample, settings.thresholds);
        const compliance = getComplianceStatus(lastSample.rsrp, lastSample.sinr);

        return (
          <div className="bg-gradient-to-t from-gray-900 to-gray-900/95 backdrop-blur-sm p-6 border-t border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400 font-bold uppercase tracking-wide">Last Measurement</p>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${quality.bgColor}`}>
                <span className={`${quality.color} font-bold text-sm`}>{quality.label}</span>
              </div>
            </div>

            {!compliance.passes && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-red-400 font-semibold text-sm">Compliance Issue</div>
                  <div className="text-red-300 text-xs mt-1">{compliance.message}</div>
                </div>
              </div>
            )}

            {compliance.passes && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div className="text-green-400 font-semibold text-sm">{compliance.message}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-gradient-to-br from-gray-800 to-gray-850 p-4 rounded-xl border border-gray-700">
                <div className="text-xs text-gray-400 mb-1 font-semibold">RSRP</div>
                <div className="text-3xl text-white font-bold">{lastSample.rsrp.toFixed(1)}</div>
                <div className="text-xs text-gray-500">dBm</div>
              </div>
              <div className="bg-gradient-to-br from-gray-800 to-gray-850 p-4 rounded-xl border border-gray-700">
                <div className="text-xs text-gray-400 mb-1 font-semibold">RSRQ</div>
                <div className="text-3xl text-white font-bold">{lastSample.rsrq.toFixed(1)}</div>
                <div className="text-xs text-gray-500">dB</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm pb-4 border-b border-gray-800">
              <div className="text-center p-2 bg-gray-800/50 rounded-lg">
                <div className="text-gray-400 text-xs mb-1">SINR</div>
                <div className="text-white font-bold">{lastSample.sinr.toFixed(1)} dB</div>
              </div>
              <div className="text-center p-2 bg-gray-800/50 rounded-lg">
                <div className="text-gray-400 text-xs mb-1">RSSI</div>
                <div className="text-white font-bold">{lastSample.rssi.toFixed(1)} dBm</div>
              </div>
              <div className="text-center p-2 bg-gray-800/50 rounded-lg">
                <div className="text-gray-400 text-xs mb-1">Cell</div>
                <div className="text-white font-bold">{lastSample.cellId}</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="text-gray-400 text-sm font-semibold">Tech:</span>
              <span className="text-white font-bold text-sm px-3 py-1.5 bg-gradient-to-r from-goflex-blue to-goflex-blue-dark rounded-lg shadow-lg shadow-goflex-blue/20">
                {lastSample.techType}
              </span>
            </div>
          </div>
        );
      })()}

      <div className="bg-gradient-to-t from-gray-900 to-gray-900/95 backdrop-blur-sm p-4 border-t border-gray-800">
        {limitError && (
          <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-red-400 font-semibold text-sm">Measurement Limit Reached</div>
              <div className="text-red-300 text-xs mt-1">{limitError}</div>
            </div>
          </div>
        )}
        <div className="flex gap-2 mb-3">
          <button
            onClick={handlePhotoCapture}
            className={`flex-1 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all ${
              photoData
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            <Camera className="w-5 h-5" />
            {photoData ? 'Photo Added' : 'Add Photo'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
        <button
          onClick={handleCaptureSample}
          disabled={isCapturing}
          className={`w-full py-3 rounded-xl font-semibold text-base text-white flex items-center justify-center gap-2 transition-all duration-200 ${
            isCapturing
              ? 'bg-gradient-to-r from-green-600 to-green-700 scale-95 shadow-lg shadow-green-600/25'
              : 'bg-gradient-to-r from-goflex-blue to-goflex-blue-dark hover:shadow-lg hover:shadow-goflex-blue/25 hover:scale-[1.01] active:scale-95'
          }`}
        >
          <RadioIcon className="w-5 h-5" />
          {isCapturing ? 'Capturing...' : 'Capture Sample'}
        </button>
        <p className="text-center text-gray-500 text-xs mt-3 font-medium">
          {gridEnabled
            ? 'Click grid cell to snap, then capture'
            : 'Click map to set position, then capture signal data'}
        </p>
      </div>

      {showGridSettings && (
        <RFGridSettings
          floor={floor}
          project={project}
          onSave={handleSaveGridSettings}
          onClose={() => setShowGridSettings(false)}
        />
      )}
    </div>
  );
}
