/**
 * Report data structures for the Reports page
 * These interfaces define the shape of data for each report section
 * and will be populated by Supabase queries in the future
 */

export interface DailySignupsStats {
  newUsersToday: number;
  newUsersLast7Days: number;
  newProjectsCreated: number;
  activeUsersLast24h: number;
}

export interface SurveyVolumeStats {
  surveysToday: number;
  surveysLast7Days: number;
  surveysLast30Days: number;
  avgRsrp: number | null;
  avgSinr: number | null;
  qualityDistribution: {
    good: number;
    fair: number;
    poor: number;
    noService: number;
  };
}

export interface SiteAttentionRow {
  id: string;
  siteName: string;
  avgRsrp: number;
  poorNoServicePercentage: number;
}
