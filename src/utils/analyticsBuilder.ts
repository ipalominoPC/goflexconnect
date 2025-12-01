import { QualityBucket, getQualityBucket } from './qualityUtils';

export interface ZoneAnalytics {
  zoneId: string;
  avgRsrp: number | null;
  avgSinr: number | null;
  sampleCount: number;
  quality: QualityBucket;
}

export interface SurveyConfidence {
  level: 'High' | 'Medium' | 'Low';
  reasons: string[];
}

export interface SurveyAnalytics {
  surveyAverages: {
    avgRsrp: number | null;
    avgSinr: number | null;
    sampleCount: number;
    quality: QualityBucket;
  };

  zoneSummaries: ZoneAnalytics[];

  rankingOfWorstZones: ZoneAnalytics[];

  histograms: {
    rsrp: Record<string, number>;
    sinr: Record<string, number>;
  };

  scorecard: {
    signalQualityScore: number;
    consistencyScore: number;
    overallScore: number;
  };
}

export function buildAnalytics(measurements: any[]): SurveyAnalytics {
  if (!measurements.length) {
    return {
      surveyAverages: {
        avgRsrp: null,
        avgSinr: null,
        sampleCount: 0,
        quality: 'NoService',
      },
      zoneSummaries: [],
      rankingOfWorstZones: [],
      histograms: { rsrp: {}, sinr: {} },
      scorecard: {
        signalQualityScore: 0,
        consistencyScore: 0,
        overallScore: 0,
      },
    };
  }

  const zones: Record<string, any[]> = {};
  for (const m of measurements) {
    const zoneId = m.floor_id || 'default';
    if (!zones[zoneId]) zones[zoneId] = [];
    zones[zoneId].push(m);
  }

  const zoneSummaries: ZoneAnalytics[] = [];

  let totalRsrp = 0;
  let totalSinr = 0;
  let totalCount = 0;

  const rsrpHist: Record<string, number> = {};
  const sinrHist: Record<string, number> = {};

  const bucketCount = (hist: any, key: string) => {
    hist[key] = (hist[key] || 0) + 1;
  };

  for (const [zoneId, z] of Object.entries(zones)) {
    const count = z.length;

    const avgRsrp = z.reduce((a, b) => a + (b.rsrp ?? 0), 0) / count;
    const avgSinr = z.reduce((a, b) => a + (b.sinr ?? 0), 0) / count;

    totalRsrp += avgRsrp * count;
    totalSinr += avgSinr * count;
    totalCount += count;

    const quality = getQualityBucket({
      avgRsrp,
      avgSinr,
      sampleCount: count,
    });

    for (const m of z) {
      const rsrpKey = Math.round((m.rsrp ?? -140) / 5) * 5;
      const sinrKey = Math.round((m.sinr ?? -20) / 1) * 1;
      bucketCount(rsrpHist, String(rsrpKey));
      bucketCount(sinrHist, String(sinrKey));
    }

    zoneSummaries.push({
      zoneId,
      avgRsrp,
      avgSinr,
      sampleCount: count,
      quality,
    });
  }

  const avgRsrp = totalRsrp / totalCount;
  const avgSinr = totalSinr / totalCount;

  const surveyQuality = getQualityBucket({
    avgRsrp,
    avgSinr,
    sampleCount: totalCount,
  });

  const signalQualityScore = Math.max(
    0,
    Math.min(100, (avgSinr + 20) * 3 + (avgRsrp + 120) * 0.7)
  );

  const consistencyScore =
    100 -
    (zoneSummaries.filter((z) => z.quality === 'Poor' || z.quality === 'NoService').length /
      zoneSummaries.length) *
      100;

  const overallScore = Math.round(signalQualityScore * 0.6 + consistencyScore * 0.4);

  const rankingOfWorstZones = [...zoneSummaries].sort((a, b) => (a.avgRsrp ?? -140) - (b.avgRsrp ?? -140));

  return {
    surveyAverages: {
      avgRsrp,
      avgSinr,
      sampleCount: totalCount,
      quality: surveyQuality,
    },
    zoneSummaries,
    rankingOfWorstZones,
    histograms: {
      rsrp: rsrpHist,
      sinr: sinrHist,
    },
    scorecard: {
      signalQualityScore: Math.round(signalQualityScore),
      consistencyScore: Math.round(consistencyScore),
      overallScore,
    },
  };
}

export function calculateSurveyConfidence(measurements: any[]): SurveyConfidence {
  const total = measurements.length;

  if (total >= 150) {
    return {
      level: 'High',
      reasons: [
        'Large number of measurement points collected.',
        'Good spatial sampling provides reliable coverage analysis.',
      ],
    };
  } else if (total >= 60) {
    return {
      level: 'Medium',
      reasons: [
        'Moderate number of measurements collected.',
        'Consider adding more samples in critical or edge areas for better accuracy.',
      ],
    };
  } else {
    return {
      level: 'Low',
      reasons: [
        'Very few measurement samples collected.',
        'Heatmap and statistics may not reflect the entire coverage area.',
        'Recommended: Collect more points before finalizing design or reporting.',
      ],
    };
  }
}

export function getRecommendedNextAction(params: {
  coverageGrade: QualityBucket;
  confidenceLevel: 'High' | 'Medium' | 'Low';
  hasSevereDeadZones: boolean;
}): string {
  const { coverageGrade, confidenceLevel, hasSevereDeadZones } = params;

  if ((coverageGrade === 'Excellent' || coverageGrade === 'Good') && confidenceLevel === 'High') {
    return 'Generate a comprehensive report and share with the customer or AHJ. Your survey data is ready for presentation.';
  }

  if ((coverageGrade === 'Good' || coverageGrade === 'Fair') && confidenceLevel === 'Medium') {
    return 'Collect a few more measurements in weak or critical areas, then finalize your design. More data points will improve confidence.';
  }

  if ((coverageGrade === 'Fair' || coverageGrade === 'Poor') && hasSevereDeadZones) {
    return 'Plan additional donor and indoor antennas for low-signal zones, then re-survey after installation to verify improvements.';
  }

  if (coverageGrade === 'Poor' && confidenceLevel === 'Low') {
    return 'Perform a more detailed walk test and expand sampling coverage before proceeding with design or remediation work.';
  }

  return 'Review the heatmap and key metrics, then refine your survey methodology or design approach as needed.';
}

export function checkSevereDeadZones(measurements: any[]): boolean {
  if (measurements.length === 0) return false;

  const severeThreshold = -100;
  const severeCount = measurements.filter(m => (m.rsrp ?? -140) < severeThreshold).length;
  const severePercentage = (severeCount / measurements.length) * 100;

  return severePercentage > 20;
}
