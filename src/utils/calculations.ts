import { Measurement, ProjectStats, ThresholdConfig, MetricType } from '../types';

export function calculateProjectStats(
  measurements: Measurement[],
  thresholds: ThresholdConfig
): ProjectStats {
  if (measurements.length === 0) {
    return {
      totalMeasurements: 0,
      rsrp: { min: 0, max: 0, avg: 0 },
      rsrq: { min: 0, max: 0, avg: 0 },
      sinr: { min: 0, max: 0, avg: 0 },
      rssi: { min: 0, max: 0, avg: 0 },
      quality: { good: 0, fair: 0, poor: 0 },
    };
  }

  const rsrpValues = measurements.map((m) => m.rsrp);
  const rsrqValues = measurements.map((m) => m.rsrq);
  const sinrValues = measurements.map((m) => m.sinr);
  const rssiValues = measurements.map((m) => m.rssi);

  let good = 0;
  let fair = 0;
  let poor = 0;

  measurements.forEach((m) => {
    if (m.rsrp >= thresholds.rsrp.good && m.sinr >= thresholds.sinr.good) {
      good++;
    } else if (m.rsrp >= thresholds.rsrp.fair && m.sinr >= thresholds.sinr.fair) {
      fair++;
    } else {
      poor++;
    }
  });

  return {
    totalMeasurements: measurements.length,
    rsrp: {
      min: Math.min(...rsrpValues),
      max: Math.max(...rsrpValues),
      avg: rsrpValues.reduce((a, b) => a + b, 0) / rsrpValues.length,
    },
    rsrq: {
      min: Math.min(...rsrqValues),
      max: Math.max(...rsrqValues),
      avg: rsrqValues.reduce((a, b) => a + b, 0) / rsrqValues.length,
    },
    sinr: {
      min: Math.min(...sinrValues),
      max: Math.max(...sinrValues),
      avg: sinrValues.reduce((a, b) => a + b, 0) / sinrValues.length,
    },
    rssi: {
      min: Math.min(...rssiValues),
      max: Math.max(...rssiValues),
      avg: rssiValues.reduce((a, b) => a + b, 0) / rssiValues.length,
    },
    quality: {
      good: Math.round((good / measurements.length) * 100),
      fair: Math.round((fair / measurements.length) * 100),
      poor: Math.round((poor / measurements.length) * 100),
    },
  };
}

export function getMetricValue(measurement: Measurement, metric: MetricType): number {
  return measurement[metric];
}

export function getColorForValue(
  value: number,
  metric: MetricType,
  thresholds: ThresholdConfig
): string {
  if (metric === 'rsrp') {
    if (value >= thresholds.rsrp.good) return '#22c55e';
    if (value >= thresholds.rsrp.fair) return '#eab308';
    return '#ef4444';
  }

  if (metric === 'sinr') {
    if (value >= thresholds.sinr.good) return '#22c55e';
    if (value >= thresholds.sinr.fair) return '#eab308';
    return '#ef4444';
  }

  if (metric === 'rsrq') {
    if (value >= -10) return '#22c55e';
    if (value >= -15) return '#eab308';
    return '#ef4444';
  }

  if (value >= -70) return '#22c55e';
  if (value >= -90) return '#eab308';
  return '#ef4444';
}

export function exportToCSV(measurements: Measurement[]): string {
  const headers = ['Location', 'timestamp', 'rsrp', 'rsrq', 'sinr', 'rssi', 'cellId', 'techType'];
  const rows = measurements.map((m) => [
    m.locationNumber,
    new Date(m.timestamp).toISOString(),
    m.rsrp,
    m.rsrq,
    m.sinr,
    m.rssi,
    m.cellId,
    m.techType,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function exportToJSON(measurements: Measurement[]): string {
  return JSON.stringify(measurements, null, 2);
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
