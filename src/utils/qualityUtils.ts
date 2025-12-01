import { Measurement, ThresholdConfig } from '../types';

export type QualityLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

export type QualityBucket = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'NoService';

export interface QualityInput {
  avgRsrp?: number | null;
  avgSinr?: number | null;
  sampleCount?: number | null;
}

export function getQualityBucket({
  avgRsrp,
  avgSinr,
  sampleCount,
}: QualityInput): QualityBucket {
  if (!sampleCount || sampleCount <= 0 || avgRsrp == null || avgSinr == null) {
    return 'NoService';
  }

  if (avgRsrp <= -120) {
    return 'NoService';
  }

  if (avgRsrp >= -90 && avgSinr >= 10) {
    return 'Excellent';
  }

  if (avgRsrp >= -100 && avgSinr >= 5) {
    return 'Good';
  }

  if (avgRsrp >= -110 && avgSinr >= 0) {
    return 'Fair';
  }

  return 'Poor';
}

export function getQualityBucketColor(bucket: QualityBucket): string {
  switch (bucket) {
    case 'Excellent':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Good':
      return 'bg-sky-100 text-sky-800 border-sky-200';
    case 'Fair':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'Poor':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'NoService':
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

export interface QualityResult {
  level: QualityLevel;
  color: string;
  bgColor: string;
  label: string;
  icon: string;
}

export function getSignalQuality(
  measurement: Measurement,
  thresholds: ThresholdConfig
): QualityResult {
  const { rsrp, sinr } = measurement;

  if (rsrp >= thresholds.rsrp.good && sinr >= thresholds.sinr.good) {
    return {
      level: 'excellent',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      label: 'Excellent',
      icon: '🟢',
    };
  }

  if (rsrp >= thresholds.rsrp.good || sinr >= thresholds.sinr.good) {
    return {
      level: 'good',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      label: 'Good',
      icon: '🔵',
    };
  }

  if (rsrp >= thresholds.rsrp.fair || sinr >= thresholds.sinr.fair) {
    return {
      level: 'fair',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      label: 'Fair',
      icon: '🟡',
    };
  }

  if (rsrp < -110 || sinr < -5) {
    return {
      level: 'critical',
      color: 'text-red-600',
      bgColor: 'bg-red-600/20',
      label: 'Critical',
      icon: '🔴',
    };
  }

  return {
    level: 'poor',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    label: 'Poor',
    icon: '🟠',
  };
}

export function getRSRPQuality(rsrp: number, thresholds: ThresholdConfig): QualityResult {
  if (rsrp >= thresholds.rsrp.good) {
    return {
      level: 'excellent',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      label: 'Excellent',
      icon: '🟢',
    };
  }
  if (rsrp >= thresholds.rsrp.fair) {
    return {
      level: 'fair',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      label: 'Fair',
      icon: '🟡',
    };
  }
  if (rsrp < -110) {
    return {
      level: 'critical',
      color: 'text-red-600',
      bgColor: 'bg-red-600/20',
      label: 'Critical',
      icon: '🔴',
    };
  }
  return {
    level: 'poor',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    label: 'Poor',
    icon: '🟠',
  };
}

export function getSINRQuality(sinr: number, thresholds: ThresholdConfig): QualityResult {
  if (sinr >= thresholds.sinr.good) {
    return {
      level: 'excellent',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      label: 'Excellent',
      icon: '🟢',
    };
  }
  if (sinr >= thresholds.sinr.fair) {
    return {
      level: 'fair',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      label: 'Fair',
      icon: '🟡',
    };
  }
  if (sinr < -5) {
    return {
      level: 'critical',
      color: 'text-red-600',
      bgColor: 'bg-red-600/20',
      label: 'Critical',
      icon: '🔴',
    };
  }
  return {
    level: 'poor',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    label: 'Poor',
    icon: '🟠',
  };
}

export function getComplianceStatus(
  rsrp: number,
  sinr: number
): { passes: boolean; message: string } {
  const rsrpPasses = rsrp >= -95;
  const sinrPasses = sinr >= 0;

  if (rsrpPasses && sinrPasses) {
    return {
      passes: true,
      message: 'Meets NFPA 1221 requirements',
    };
  }

  const issues: string[] = [];
  if (!rsrpPasses) issues.push(`RSRP ${rsrp.toFixed(1)} dBm (needs ≥ -95)`);
  if (!sinrPasses) issues.push(`SINR ${sinr.toFixed(1)} dB (needs ≥ 0)`);

  return {
    passes: false,
    message: `Fails: ${issues.join(', ')}`,
  };
}
