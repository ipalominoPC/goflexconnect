import { Measurement, Thresholds } from '../types';

export type QualityBucket = 'excellent' | 'good' | 'fair' | 'poor';

export function getQualityBucket(m: Measurement, thresholds: Thresholds): QualityBucket {
  const rsrp = m.rsrp;
  const rsrq = m.rsrq;
  const sinr = m.sinr || 0;

  // Senior RF Engineer Thresholds (Prioritizing DAS Requirements)
  // Excellent: Strong Power AND High Quality
  if (rsrp >= -90 && rsrq >= -10 && sinr >= 15) return 'excellent';
  
  // Good: Acceptable Power AND Quality
  if (rsrp >= -95 && rsrq >= -13 && sinr >= 10) return 'good';
  
  // Fair: Marginal Power (Yellow Zone)
  if (rsrp >= -105 && rsrq >= -18 && sinr >= 5) return 'fair';
  
  // Poor: Anything below -105 RSRP or -18 RSRQ (Red Zone)
  return 'poor';
}

export function getQualityBucketColor(bucket: QualityBucket): string {
  const colors = {
    excellent: 'text-white', // Changed to white for better visibility on blue
    good: 'text-white',
    fair: 'text-white',
    poor: 'text-white'
  };
  return colors[bucket];
}

export function getSignalQuality(m: Measurement, thresholds: Thresholds) {
  const bucket = getQualityBucket(m, thresholds);
  const styles = {
    excellent: { label: 'EXCELLENT', color: 'text-white', bgColor: 'bg-green-500', border: 'border-green-400' },
    good: { label: 'GOOD', color: 'text-white', bgColor: 'bg-emerald-500', border: 'border-emerald-400' },
    fair: { label: 'MARGINAL', color: 'text-white', bgColor: 'bg-yellow-500', border: 'border-yellow-400' },
    poor: { label: 'POOR', color: 'text-white', bgColor: 'bg-red-500', border: 'border-red-400' }
  };
  return styles[bucket];
}

export function getComplianceStatus(rsrp: number, sinr: number) {
  if (rsrp >= -95 && (sinr || 0) >= 10) return { passes: true, message: 'Meets FCC/Carrier Specs' };
  return { passes: false, message: 'Below Carrier Minimums' };
}
