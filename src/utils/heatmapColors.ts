export type SignalQuality = 'strong' | 'medium' | 'poor' | 'none';

export function getRsrpQuality(avgRsrp: number | null): SignalQuality {
  if (avgRsrp === null || avgRsrp === undefined) return 'none';

  // iBwave Design Standard Thresholds
  if (avgRsrp >= -90) {
    return 'strong'; // Green Zone
  } else if (avgRsrp >= -105) {
    return 'medium'; // Yellow Zone
  } else {
    return 'poor';   // Red Zone (Fail)
  }
}

export function getRsrpColor(avgRsrp: number | null, isDark: boolean = true): string {
  const quality = getRsrpQuality(avgRsrp);

  const colorMap = {
    // Professional RF Green, Yellow, Red with 70% opacity for map visibility
    strong: 'rgba(34, 197, 94, 0.7)',  // Green-500
    medium: 'rgba(234, 179, 8, 0.7)',  // Yellow-500
    poor: 'rgba(239, 68, 68, 0.7)',    // Red-500
    none: isDark ? 'rgba(71, 85, 105, 0.2)' : 'rgba(203, 213, 225, 0.3)',
  };

  return colorMap[quality];
}

export function getRsrpBorderColor(avgRsrp: number | null, isDark: boolean = true): string {
  const quality = getRsrpQuality(avgRsrp);
  const borderMap = {
    strong: 'rgba(34, 197, 94, 0.4)',
    medium: 'rgba(234, 179, 8, 0.4)',
    poor: 'rgba(239, 68, 68, 0.4)',
    none: isDark ? 'rgba(71, 85, 105, 0.1)' : 'rgba(203, 213, 225, 0.2)',
  };
  return borderMap[quality];
}

export function getRsrpLabel(avgRsrp: number | null): string {
  if (avgRsrp === null || avgRsrp === undefined) return 'No data';
  const quality = getRsrpQuality(avgRsrp);
  const labels = { strong: 'Excellent', medium: 'Marginal', poor: 'Poor', none: 'No data' };
  return \\ (\ dBm)\;
}

export const HEATMAP_LEGEND = [
  { quality: 'strong', label: 'Excellent', range: '≥ -90 dBm', color: '#22C55E' },
  { quality: 'medium', label: 'Marginal', range: '-91 to -105 dBm', color: '#EAB308' },
  { quality: 'poor', label: 'Poor', range: '< -105 dBm', color: '#EF4444' },
  { quality: 'none', label: 'No data', range: 'No measurements', color: '#475569' },
];
