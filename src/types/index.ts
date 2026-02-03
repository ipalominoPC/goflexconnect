export interface Project {
  id: string;
  name: string;
  location?: string;
  buildingLevel?: string;
  projectType?: 'SURVEY' | 'INSTALL' | 'UPGRADE';
  technicianName?: string;
  projectLocation?: string;
  dateCompleted?: number;
  notes?: string;
  floorPlanImage?: string;
  floorPlanFilename?: string;
  createdAt: number;
  updatedAt: number; 
  status?: "active" | "closed";
}

export interface DonorAlignment {
  id: string;
  projectId: string;
  carrier: string;
  azimuth: number;
  notes?: string;
  rfDeviceImages?: Array<{ url: string; width: number; height: number }>;
  createdAt: number;
}

export interface SpeedTestEntry {
  carrier: string;
  connectionType: 'cellular' | 'wifi' | 'unknown';
  download: number;
  upload: number;
  ping: number;
  locationLabel?: string;
  timestamp: string;
}

export interface SurveyData {
  id: string;
  projectId: string;
  ambientReading?: {
    carrier: string;
    rsrp: number;
    rsrq: number;
    sinr: number;
    cellId?: string;
    pci?: string;
    band?: string;
  };
  indoorSpeedtests?: SpeedTestEntry[];
  outdoorSpeedtests?: SpeedTestEntry[];
  sitePhotos?: Array<{ url: string; width: number; height: number; caption?: string }>;
  notes?: string;
  createdAt: number;
}

export interface Floor {
  id: string;
  projectId: string;
  name: string;
  level: string;
  floorPlanImage?: string;
  floorPlanFilename?: string;
  notes?: string;
  gridSize?: number;
  gridEnabled?: boolean;
  createdAt: number;
  updatedAt: number; 
  status?: "active" | "closed";
}

export interface GridPoint {
  x: number;
  y: number;
  gridX: number;
  gridY: number;
  hasMeasurement: boolean;
}

export interface Measurement {
  id: string;
  projectId: string;
  floorId: string;
  x: number;
  y: number;
  locationNumber: number;
  rsrp: number;
  rsrq: number;
  sinr: number;
  rssi: number;
  cellId: string;
  techType: 'LTE' | '5G' | '4G' | 'EDGE' | 'HSPA';
  latitude?: number;
  longitude?: number;
  band?: string;
  timestamp: number;
  photoId?: string;
  photoCaption?: string;
  gridX?: number;
  gridY?: number;
  connectionType?: 'cellular' | 'wifi' | 'ethernet' | 'unknown';
  effectiveType?: string;
  networkConnectionType?: string;
  networkEffectiveType?: string;
  networkDownlink?: number;
  networkRtt?: number;
  deviceSummary?: string;
  manualNetworkType?: string;
  carrierName?: string;
}

export interface ThresholdConfig {
  rsrp: {
    good: number;
    fair: number;
  };
  sinr: {
    good: number;
    fair: number;
  };
}

export interface Settings {
  thresholds: ThresholdConfig;
  defaultMetric: 'rsrp' | 'rsrq' | 'sinr' | 'rssi';
  plan?: 'free' | 'pro';
  autosaveEnabled?: boolean;
  sessionTimeoutMinutes?: number;
  benchmarkMode?: boolean;
  rsrpTarget?: number;
}

export type MetricType = 'rsrp' | 'rsrq' | 'sinr' | 'rssi';

export interface ProjectStats {
  totalMeasurements: number;
  rsrp: { min: number; max: number; avg: number };
  rsrq: { min: number; max: number; avg: number };
  sinr: { min: number; max: number; avg: number };
  rssi: { min: number; max: number; avg: number };
  quality: {
    good: number;
    fair: number;
    poor: number;
  };
}

export interface SpeedTestResult {
  id: string;
  timestamp: number;
  downloadSpeed: number;
  uploadSpeed: number;
  ping: number;
  jitter?: number;
  rsrp: number;
  rsrq: number;
  sinr: number;
  rssi: number;
  cellId: string;
  provider: string;
  frequency: number;
  band: string;
  connectionType: '3G' | '4G' | 'LTE' | '5G' | 'WiFi' | 'Ethernet';
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
  ipv6Address?: string;
  ipCity?: string;
  ipRegion?: string;
  ipCountry?: string;
  ipTimezone?: string;
  isp?: string;
  organization?: string;
  asn?: string;
  dnsServers?: string[];
  isVpn?: boolean;
  vpnConfidence?: number;
  gpsAccuracy?: number;
  networkConnectionType?: string;
  networkEffectiveType?: string;
  networkDownlink?: number;
  networkRtt?: number;
  deviceSummary?: string;
  manualNetworkType?: string;
  carrierName?: string;
}

export interface SurveyInsight {
  id: string;
  surveyId: string;
  summary: string;
  recommendations: string;
  problemZones?: any;
  improvementNotes?: any;
  createdAt: string;
}
