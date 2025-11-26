import { Measurement, ThresholdConfig } from '../types';

export type QualityLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

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
