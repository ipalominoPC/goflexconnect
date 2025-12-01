export type SignalQuality = 'strong' | 'medium' | 'poor' | 'none';

export function getRsrpQuality(avgRsrp: number | null): SignalQuality {
  if (avgRsrp === null || avgRsrp === undefined) {
    return 'none';
  }

  if (avgRsrp >= -90) {
    return 'strong';
  } else if (avgRsrp >= -110) {
    return 'medium';
  } else {
    return 'poor';
  }
}

export function getRsrpColor(avgRsrp: number | null, isDark: boolean = true): string {
  const quality = getRsrpQuality(avgRsrp);

  const colorMap = {
    strong: isDark ? 'rgba(39, 170, 225, 0.7)' : 'rgba(39, 170, 225, 0.6)',
    medium: isDark ? 'rgba(251, 191, 36, 0.7)' : 'rgba(251, 191, 36, 0.6)',
    poor: isDark ? 'rgba(239, 68, 68, 0.7)' : 'rgba(239, 68, 68, 0.6)',
    none: isDark ? 'rgba(71, 85, 105, 0.2)' : 'rgba(203, 213, 225, 0.3)',
  };

  return colorMap[quality];
}

export function getRsrpBorderColor(avgRsrp: number | null, isDark: boolean = true): string {
  const quality = getRsrpQuality(avgRsrp);

  const borderMap = {
    strong: isDark ? 'rgba(39, 170, 225, 0.3)' : 'rgba(39, 170, 225, 0.4)',
    medium: isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 191, 36, 0.4)',
    poor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.4)',
    none: isDark ? 'rgba(71, 85, 105, 0.1)' : 'rgba(203, 213, 225, 0.2)',
  };

  return borderMap[quality];
}

export function getRsrpLabel(avgRsrp: number | null): string {
  if (avgRsrp === null || avgRsrp === undefined) {
    return 'No data';
  }

  const quality = getRsrpQuality(avgRsrp);
  const qualityLabels = {
    strong: 'Strong',
    medium: 'Medium',
    poor: 'Poor',
    none: 'No data',
  };

  return `${qualityLabels[quality]} (${avgRsrp.toFixed(1)} dBm)`;
}

export const HEATMAP_LEGEND = [
  {
    quality: 'strong' as SignalQuality,
    label: 'Strong',
    range: '≥ -90 dBm',
    color: '#27AAE1',
  },
  {
    quality: 'medium' as SignalQuality,
    label: 'Medium',
    range: '-90 to -110 dBm',
    color: '#FBBF24',
  },
  {
    quality: 'poor' as SignalQuality,
    label: 'Poor',
    range: '< -110 dBm',
    color: '#EF4444',
  },
  {
    quality: 'none' as SignalQuality,
    label: 'No data',
    range: 'No measurements',
    color: '#475569',
  },
];
