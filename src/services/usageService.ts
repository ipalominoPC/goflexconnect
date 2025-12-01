/**
 * Usage Service - Centralized usage limit enforcement
 *
 * This service provides a single entry point for recording usage
 * and checking limits before allowing critical actions.
 */

import { supabase } from './supabaseClient';
import { PlanId, normalizePlanId, ABUSE_THRESHOLDS } from '../config/planLimits';
import {
  UsageEventType,
  trackUsageEvent,
  checkUsageLimit,
  checkAndAlertUsageThreshold,
  getUsageSummary,
} from './usageTracking';
import { createAdminAlert } from './adminAlerts';

export interface UsageCheckResult {
  allowed: boolean;
  reason?: string;
  softWarning?: boolean;
  current?: number;
  limit?: number;
}

export interface RecordUsageParams {
  userId: string;
  userEmail?: string;
  planId: PlanId | string;
  eventType: UsageEventType;
  context?: {
    projectId?: string;
    surveyId?: string;
    count?: number;
  };
  isTest?: boolean;
}

/**
 * Record usage and check if limit allows this action
 *
 * This is the primary function to use before any billable action.
 * It will:
 * 1. Check if user is within limits
 * 2. Record the usage event (if allowed or blocked)
 * 3. Check for soft warnings (80-90% of limit)
 * 4. Check for abuse patterns (if applicable)
 * 5. Return whether the action should proceed
 */
export async function recordUsageAndCheckLimit(
  params: RecordUsageParams
): Promise<UsageCheckResult> {
  const { userId, userEmail, planId, eventType, context = {}, isTest = false } = params;
  const normalizedPlan = normalizePlanId(planId);

  // PRO users always allowed (no limits)
  if (normalizedPlan === 'pro') {
    await trackUsageEvent({
      userId,
      eventType,
      projectId: context.projectId,
      surveyId: context.surveyId,
      count: context.count,
      isTest,
    });

    return { allowed: true };
  }

  // Map event type to limit type
  const limitTypeMap: Record<string, 'projects' | 'surveys' | 'measurements' | 'speed_tests' | 'ai_insights' | 'heatmap_exports'> = {
    'project_created': 'projects',
    'survey_created': 'surveys',
    'measurement_recorded': 'measurements',
    'speed_test_run': 'speed_tests',
    'ai_insight_generated': 'ai_insights',
    'heatmap_exported': 'heatmap_exports',
  };

  const limitType = limitTypeMap[eventType];
  if (!limitType) {
    console.error(`Unknown event type: ${eventType}`);
    return { allowed: true }; // Fail open
  }

  // Check limit
  const limitCheck = await checkUsageLimit({
    userId,
    planId: normalizedPlan,
    limitType: limitType as any,
    projectId: context.projectId,
    surveyId: context.surveyId,
    additionalCount: context.count || 1,
  });

  // Record the usage event (even if blocked, for analytics)
  await trackUsageEvent({
    userId,
    eventType,
    projectId: context.projectId,
    surveyId: context.surveyId,
    count: context.count,
    isTest,
  });

  // If blocked, return with message
  if (!limitCheck.allowed) {
    // Optional: Alert admin if user is repeatedly hitting limits
    if (userEmail) {
      await checkAndAlertUsageThreshold({
        userId,
        userEmail,
        planId: normalizedPlan,
        limitType: limitType as any,
        projectId: context.projectId,
        surveyId: context.surveyId,
      });
    }

    return {
      allowed: false,
      reason: limitCheck.message,
      current: limitCheck.current,
      limit: limitCheck.limit,
    };
  }

  // Check for soft warning (80-90% of limit)
  const percentage = limitCheck.current / limitCheck.limit;
  const softWarning = percentage >= 0.8 && percentage < 1.0;

  // Alert admin if warning threshold reached
  if (softWarning && userEmail) {
    await checkAndAlertUsageThreshold({
      userId,
      userEmail,
      planId: normalizedPlan,
      limitType: limitType as any,
      projectId: context.projectId,
      surveyId: context.surveyId,
    });
  }

  // Check for abuse patterns (FREE users only)
  if (!isTest) {
    await checkForAbusePatterns({
      userId,
      userEmail: userEmail || 'unknown',
      planId: normalizedPlan,
    });
  }

  return {
    allowed: true,
    softWarning,
    current: limitCheck.current,
    limit: limitCheck.limit,
  };
}

/**
 * Check for abuse patterns (e.g., excessive daily usage)
 */
async function checkForAbusePatterns(params: {
  userId: string;
  userEmail: string;
  planId: PlanId;
}): Promise<void> {
  const { userId, userEmail, planId } = params;

  // Only check FREE users
  if (planId === 'pro') return;

  try {
    // Get today's usage summary
    const summary = await getUsageSummary({ userId, planId });

    // Check each abuse threshold
    const abuses: string[] = [];

    // Measurements per day
    const totalMeasurementsToday = Object.values(summary.measurementsPerSurvey).reduce((sum, count) => sum + count, 0);
    if (totalMeasurementsToday > ABUSE_THRESHOLDS.measurementsPerDay) {
      abuses.push(`${totalMeasurementsToday} measurements today (threshold: ${ABUSE_THRESHOLDS.measurementsPerDay})`);
    }

    // Speed tests per day
    if (summary.speedTestsToday > ABUSE_THRESHOLDS.speedTestsPerDay) {
      abuses.push(`${summary.speedTestsToday} speed tests today (threshold: ${ABUSE_THRESHOLDS.speedTestsPerDay})`);
    }

    // AI insights per day (approximation based on monthly)
    if (summary.aiInsightsThisMonth > ABUSE_THRESHOLDS.aiInsightsPerDay * 7) {
      abuses.push(`${summary.aiInsightsThisMonth} AI insights this month (weekly threshold: ${ABUSE_THRESHOLDS.aiInsightsPerDay * 7})`);
    }

    // Heatmap exports per day
    if (summary.heatmapExportsThisMonth > ABUSE_THRESHOLDS.heatmapExportsPerDay * 7) {
      abuses.push(`${summary.heatmapExportsThisMonth} heatmap exports this month (weekly threshold: ${ABUSE_THRESHOLDS.heatmapExportsPerDay * 7})`);
    }

    // If any abuses detected, create admin alert
    if (abuses.length > 0) {
      await createAdminAlert({
        type: 'abuse_suspected',
        userId,
        title: 'Potential abuse detected',
        message: `FREE user ${userEmail} has exceeded abuse thresholds:\n${abuses.join('\n')}`,
        metadata: {
          email: userEmail,
          abuses,
          summary,
        },
      });
    }
  } catch (error) {
    console.error('Error checking abuse patterns:', error);
    // Fail silently - don't block user action
  }
}
