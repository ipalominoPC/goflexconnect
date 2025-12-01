/**
 * Central configuration for plan limits and usage thresholds
 *
 * TUNING: Adjust these values to change FREE plan limits without code changes
 */

export type PlanId = 'free' | 'pro';

export const PLAN_LIMITS = {
  free: {
    maxProjects: 5,
    maxSurveysPerProject: 10,
    maxMeasurementsPerSurvey: 500,
    maxSpeedTestsPerDay: 20,
    maxAiInsightsPerMonth: 20,
    maxHeatmapExportsPerMonth: 20,
  },
  pro: {
    maxProjects: Infinity,
    maxSurveysPerProject: Infinity,
    maxMeasurementsPerSurvey: Infinity,
    maxSpeedTestsPerDay: Infinity,
    maxAiInsightsPerMonth: Infinity,
    maxHeatmapExportsPerMonth: Infinity,
  },
} as const;

/**
 * Thresholds for triggering admin alerts (percentage of limit)
 */
export const ALERT_THRESHOLDS = {
  usage_warning: 0.8, // 80% of limit
  usage_critical: 1.0, // 100% of limit
} as const;

/**
 * Abuse detection thresholds (absolute numbers for FREE users)
 * If a FREE user exceeds these in 24h, trigger an abuse alert
 */
export const ABUSE_THRESHOLDS = {
  measurementsPerDay: 2000,
  speedTestsPerDay: 100,
  aiInsightsPerDay: 50,
  heatmapExportsPerDay: 50,
} as const;

/**
 * Check if a plan is PRO
 */
export function isPro(planId: PlanId | string | undefined): boolean {
  if (!planId) return false;
  return planId.toLowerCase() === 'pro';
}

/**
 * Get limits for a specific plan
 */
export function getLimitsForPlan(planId: PlanId | string | undefined) {
  const normalizedPlan = (planId?.toLowerCase() || 'free') as PlanId;
  return PLAN_LIMITS[normalizedPlan] || PLAN_LIMITS.free;
}

/**
 * Normalize plan ID to standard format
 */
export function normalizePlanId(planId: string | undefined): PlanId {
  if (!planId) return 'free';
  return planId.toLowerCase() === 'pro' ? 'pro' : 'free';
}
