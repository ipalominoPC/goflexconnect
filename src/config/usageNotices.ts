/**
 * Usage Notification Configuration
 *
 * Defines when and how to show usage notices to FREE users
 * as they approach or exceed plan limits.
 *
 * Thresholds are percentages: 0.8 = 80%, 1.0 = 100% (at limit)
 */

import { PLAN_LIMITS } from './planLimits';

export interface UsageNoticeRule {
  id: string;
  limitType: 'projects' | 'surveys' | 'measurements' | 'ai_insights' | 'heatmap_exports';
  threshold: number; // Percentage (0.8 = 80%)
  severity: 'info' | 'warning' | 'error';
  message: string;
  ctaLabel?: string;
  ctaAction?: 'upgrade-modal' | 'contact-support';
}

/**
 * Notice rules for FREE users approaching limits
 *
 * Rules are evaluated in order - first matching rule wins
 */
export const USAGE_NOTICE_RULES: UsageNoticeRule[] = [
  // PROJECTS - At limit
  {
    id: 'projects-at-limit',
    limitType: 'projects',
    threshold: 1.0,
    severity: 'error',
    message: `You've reached the FREE project limit (${PLAN_LIMITS.free.maxProjects}). Delete old projects or upgrade to GoFlexConnect Pro for unlimited projects.`,
    ctaLabel: 'Upgrade to Pro',
    ctaAction: 'upgrade-modal',
  },
  // PROJECTS - Near limit
  {
    id: 'projects-near-limit',
    limitType: 'projects',
    threshold: 0.8,
    severity: 'warning',
    message: `You're nearing the FREE project limit ({{current}}/{{limit}}). Archive old projects or upgrade to GoFlexConnect Pro to create more.`,
    ctaLabel: 'Upgrade to Pro',
    ctaAction: 'upgrade-modal',
  },

  // SURVEYS - At limit
  {
    id: 'surveys-at-limit',
    limitType: 'surveys',
    threshold: 1.0,
    severity: 'error',
    message: `You've reached the FREE survey limit (${PLAN_LIMITS.free.maxSurveysPerProject}) for this project. Delete old surveys or upgrade to GoFlexConnect Pro for unlimited surveys.`,
    ctaLabel: 'Upgrade to Pro',
    ctaAction: 'upgrade-modal',
  },
  // SURVEYS - Near limit
  {
    id: 'surveys-near-limit',
    limitType: 'surveys',
    threshold: 0.8,
    severity: 'warning',
    message: `You're approaching the FREE survey limit ({{current}}/{{limit}}) for this project. Consider upgrading to Pro for unlimited surveys.`,
    ctaLabel: 'Upgrade to Pro',
    ctaAction: 'upgrade-modal',
  },

  // MEASUREMENTS - At limit
  {
    id: 'measurements-at-limit',
    limitType: 'measurements',
    threshold: 1.0,
    severity: 'error',
    message: `You've reached the FREE measurement limit (${PLAN_LIMITS.free.maxMeasurementsPerSurvey}) for this survey. Start a new survey or upgrade to GoFlexConnect Pro for unlimited measurements.`,
    ctaLabel: 'Upgrade to Pro',
    ctaAction: 'upgrade-modal',
  },
  // MEASUREMENTS - Near limit
  {
    id: 'measurements-near-limit',
    limitType: 'measurements',
    threshold: 0.8,
    severity: 'warning',
    message: `You're close to the measurement limit ({{current}}/{{limit}}) for this survey. Upgrade to Pro for unlimited measurements.`,
    ctaLabel: 'Upgrade to Pro',
    ctaAction: 'upgrade-modal',
  },

  // AI INSIGHTS - At limit
  {
    id: 'ai-insights-at-limit',
    limitType: 'ai_insights',
    threshold: 1.0,
    severity: 'error',
    message: `You've used all ${PLAN_LIMITS.free.maxAiInsightsPerMonth} FREE AI insights this month. Upgrade to GoFlexConnect Pro for unlimited AI insights.`,
    ctaLabel: 'Upgrade to Pro',
    ctaAction: 'upgrade-modal',
  },
  // AI INSIGHTS - Near limit
  {
    id: 'ai-insights-near-limit',
    limitType: 'ai_insights',
    threshold: 0.9,
    severity: 'warning',
    message: `You're almost out of FREE AI insights ({{current}}/{{limit}}) for this month. Upgrade to Pro for unlimited insights.`,
    ctaLabel: 'Upgrade to Pro',
    ctaAction: 'upgrade-modal',
  },

  // HEATMAP EXPORTS - At limit
  {
    id: 'heatmap-exports-at-limit',
    limitType: 'heatmap_exports',
    threshold: 1.0,
    severity: 'error',
    message: `You've used all ${PLAN_LIMITS.free.maxHeatmapExportsPerMonth} FREE heatmap exports this month. Upgrade to GoFlexConnect Pro for unlimited exports.`,
    ctaLabel: 'Upgrade to Pro',
    ctaAction: 'upgrade-modal',
  },
  // HEATMAP EXPORTS - Near limit
  {
    id: 'heatmap-exports-near-limit',
    limitType: 'heatmap_exports',
    threshold: 0.9,
    severity: 'warning',
    message: `You've nearly used all FREE heatmap exports ({{current}}/{{limit}}) for this month. Upgrade to Pro for unlimited exports.`,
    ctaLabel: 'Upgrade to Pro',
    ctaAction: 'upgrade-modal',
  },
];

/**
 * Find applicable notice rule for given usage
 */
export function findApplicableNoticeRule(
  limitType: UsageNoticeRule['limitType'],
  current: number,
  limit: number
): UsageNoticeRule | null {
  if (limit === Infinity || current === 0) {
    return null;
  }

  const percentage = current / limit;

  // Find first matching rule (rules are ordered by threshold desc)
  const sortedRules = USAGE_NOTICE_RULES
    .filter((rule) => rule.limitType === limitType)
    .sort((a, b) => b.threshold - a.threshold);

  for (const rule of sortedRules) {
    if (percentage >= rule.threshold) {
      return rule;
    }
  }

  return null;
}

/**
 * Interpolate placeholders in message
 */
export function interpolateMessage(
  message: string,
  current: number,
  limit: number
): string {
  return message
    .replace('{{current}}', String(current))
    .replace('{{limit}}', String(limit));
}
