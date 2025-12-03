/**
 * Usage tracking service for monitoring plan limits
 */

import { supabase } from './supabaseClient';
import { PlanId, getLimitsForPlan, normalizePlanId, ALERT_THRESHOLDS } from '../config/planLimits';
import { createAdminAlert } from './adminAlerts';

export type UsageEventType =
  | 'project_created'
  | 'survey_created'
  | 'measurement_recorded'
  | 'speed_test_run'
  | 'ai_insight_generated'
  | 'heatmap_exported';

export interface TrackUsageEventParams {
  userId: string;
  eventType: UsageEventType;
  projectId?: string;
  surveyId?: string;
  count?: number;
  isTest?: boolean;
}

export interface UsageSummary {
  projectCount: number;
  surveysPerProject: Record<string, number>;
  measurementsPerSurvey: Record<string, number>;
  speedTestsToday: number;
  aiInsightsThisMonth: number;
  heatmapExportsThisMonth: number;
}

/**
 * Track a usage event
 */
export async function trackUsageEvent(params: TrackUsageEventParams): Promise<void> {
  const { userId, eventType, projectId, surveyId, count = 1, isTest = false } = params;

  try {
    const { error } = await supabase.from('usage_events').insert({
      user_id: userId,
      event_type: eventType,
      project_id: projectId || null,
      survey_id: surveyId || null,
      count,
      is_test: isTest,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to track usage event:', error);
  }
}

/**
 * Get usage summary for a user
 */
export async function getUsageSummary(params: {
  userId: string;
  planId: PlanId | string;
  now?: Date;
}): Promise<UsageSummary> {
  const { userId, planId, now = new Date() } = params;
  const limits = getLimitsForPlan(planId);

  try {
    // Get start of current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Get start of today (UTC)
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayStartISO = todayStart.toISOString();

    // Fetch all usage events for this user (exclude test events)
    const { data: events, error } = await supabase
      .from('usage_events')
      .select('*')
      .eq('user_id', userId)
      .eq('is_test', false);

    if (error) throw error;

    // Calculate project count (unique project_created events)
    const projectEvents = events?.filter((e) => e.event_type === 'project_created') || [];
    const projectCount = new Set(projectEvents.map((e) => e.project_id)).size;

    // Calculate surveys per project
    const surveysPerProject: Record<string, number> = {};
    const surveyEvents = events?.filter((e) => e.event_type === 'survey_created') || [];
    surveyEvents.forEach((event) => {
      if (event.project_id) {
        surveysPerProject[event.project_id] = (surveysPerProject[event.project_id] || 0) + 1;
      }
    });

    // Calculate measurements per survey
    const measurementsPerSurvey: Record<string, number> = {};
    const measurementEvents = events?.filter((e) => e.event_type === 'measurement_recorded') || [];
    measurementEvents.forEach((event) => {
      if (event.survey_id) {
        measurementsPerSurvey[event.survey_id] = (measurementsPerSurvey[event.survey_id] || 0) + (event.count || 1);
      }
    });

    // Calculate daily speed tests
    const speedTestsToday =
      events
        ?.filter((e) => e.event_type === 'speed_test_run' && new Date(e.created_at) >= new Date(todayStartISO))
        .reduce((sum, e) => sum + (e.count || 1), 0) || 0;

    // Calculate monthly AI insights
    const aiInsightsThisMonth =
      events
        ?.filter((e) => e.event_type === 'ai_insight_generated' && new Date(e.created_at) >= new Date(monthStart))
        .reduce((sum, e) => sum + (e.count || 1), 0) || 0;

    // Calculate monthly heatmap exports
    const heatmapExportsThisMonth =
      events
        ?.filter((e) => e.event_type === 'heatmap_exported' && new Date(e.created_at) >= new Date(monthStart))
        .reduce((sum, e) => sum + (e.count || 1), 0) || 0;

    return {
      projectCount,
      surveysPerProject,
      measurementsPerSurvey,
      speedTestsToday,
      aiInsightsThisMonth,
      heatmapExportsThisMonth,
    };
  } catch (error) {
    console.error('Failed to get usage summary:', error);
    return {
      projectCount: 0,
      surveysPerProject: {},
      measurementsPerSurvey: {},
      speedTestsToday: 0,
      aiInsightsThisMonth: 0,
      heatmapExportsThisMonth: 0,
    };
  }
}

/**
 * Get usage summary for test events only (for self-tests)
 */
export async function getTestUsageSummary(params: {
  userId: string;
  planId: PlanId | string;
  now?: Date;
}): Promise<UsageSummary> {
  const { userId, planId, now = new Date() } = params;
  const limits = getLimitsForPlan(planId);

  try {
    console.log('[getTestUsageSummary] Starting query for user:', userId);

    // Get start of current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Get start of today (UTC)
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayStartISO = todayStart.toISOString();

    // Fetch ONLY test usage events for this user with timeout protection
    console.log('[getTestUsageSummary] Executing query...');
    const startTime = Date.now();

    const queryPromise = supabase
      .from('usage_events')
      .select('*')
      .eq('user_id', userId)
      .eq('is_test', true);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout after 10 seconds')), 10000)
    );

    const { data: events, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

    const queryTime = Date.now() - startTime;
    console.log(`[getTestUsageSummary] Query completed in ${queryTime}ms, found ${events?.length || 0} events`);

    if (error) {
      console.error('[getTestUsageSummary] Query error:', error);
      throw error;
    }

    // Calculate project count (unique project_created events)
    const projectEvents = events?.filter((e) => e.event_type === 'project_created') || [];
    const projectCount = new Set(projectEvents.map((e) => e.project_id)).size;

    // Calculate surveys per project
    const surveysPerProject: Record<string, number> = {};
    const surveyEvents = events?.filter((e) => e.event_type === 'survey_created') || [];
    surveyEvents.forEach((event) => {
      if (event.project_id) {
        surveysPerProject[event.project_id] = (surveysPerProject[event.project_id] || 0) + 1;
      }
    });

    // Calculate measurements per survey
    const measurementsPerSurvey: Record<string, number> = {};
    const measurementEvents = events?.filter((e) => e.event_type === 'measurement_recorded') || [];
    measurementEvents.forEach((event) => {
      if (event.survey_id) {
        measurementsPerSurvey[event.survey_id] = (measurementsPerSurvey[event.survey_id] || 0) + (event.count || 1);
      }
    });

    // Calculate daily speed tests
    const speedTestsToday =
      events
        ?.filter((e) => e.event_type === 'speed_test_run' && new Date(e.created_at) >= new Date(todayStartISO))
        .reduce((sum, e) => sum + (e.count || 1), 0) || 0;

    // Calculate monthly AI insights
    const aiInsightsThisMonth =
      events
        ?.filter((e) => e.event_type === 'ai_insight_generated' && new Date(e.created_at) >= new Date(monthStart))
        .reduce((sum, e) => sum + (e.count || 1), 0) || 0;

    // Calculate monthly heatmap exports
    const heatmapExportsThisMonth =
      events
        ?.filter((e) => e.event_type === 'heatmap_exported' && new Date(e.created_at) >= new Date(monthStart))
        .reduce((sum, e) => sum + (e.count || 1), 0) || 0;

    return {
      projectCount,
      surveysPerProject,
      measurementsPerSurvey,
      speedTestsToday,
      aiInsightsThisMonth,
      heatmapExportsThisMonth,
    };
  } catch (error) {
    console.error('Failed to get test usage summary:', error);
    return {
      projectCount: 0,
      surveysPerProject: {},
      measurementsPerSurvey: {},
      speedTestsToday: 0,
      aiInsightsThisMonth: 0,
      heatmapExportsThisMonth: 0,
    };
  }
}

/**
 * Check if a usage limit would be exceeded
 */
export async function checkUsageLimit(params: {
  userId: string;
  planId: PlanId | string;
  limitType: 'projects' | 'surveys' | 'measurements' | 'speed_tests' | 'ai_insights' | 'heatmap_exports';
  projectId?: string;
  surveyId?: string;
  additionalCount?: number;
}): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> {
  const { userId, planId, limitType, projectId, surveyId, additionalCount = 1 } = params;
  const limits = getLimitsForPlan(planId);
  const normalizedPlan = normalizePlanId(planId);

  // PRO users always allowed
  if (normalizedPlan === 'pro') {
    return { allowed: true, current: 0, limit: Infinity };
  }

  const summary = await getUsageSummary({ userId, planId });

  switch (limitType) {
    case 'projects': {
      const current = summary.projectCount;
      const limit = limits.maxProjects;
      const allowed = current + additionalCount <= limit;
      return {
        allowed,
        current,
        limit,
        message: allowed
          ? undefined
          : `You've reached the maximum number of projects (${limit}) allowed on GoFlexConnect Free. Archive an existing project or upgrade to Pro for unlimited projects.`,
      };
    }

    case 'surveys': {
      if (!projectId) throw new Error('projectId required for surveys limit check');
      const current = summary.surveysPerProject[projectId] || 0;
      const limit = limits.maxSurveysPerProject;
      const allowed = current + additionalCount <= limit;
      return {
        allowed,
        current,
        limit,
        message: allowed
          ? undefined
          : `You've reached the survey limit (${limit}) for this site on GoFlexConnect Free. Upgrade to Pro to run unlimited surveys for this site.`,
      };
    }

    case 'measurements': {
      if (!surveyId) throw new Error('surveyId required for measurements limit check');
      const current = summary.measurementsPerSurvey[surveyId] || 0;
      const limit = limits.maxMeasurementsPerSurvey;
      const allowed = current + additionalCount <= limit;
      return {
        allowed,
        current,
        limit,
        message: allowed
          ? undefined
          : `This survey already has the maximum number of measurements (${limit}) for GoFlexConnect Free. Start a new survey or upgrade to Pro for deeper data collection.`,
      };
    }

    case 'speed_tests': {
      const current = summary.speedTestsToday;
      const limit = limits.maxSpeedTestsPerDay;
      const allowed = current + additionalCount <= limit;
      return {
        allowed,
        current,
        limit,
        message: allowed
          ? undefined
          : `You've used all your speed tests for today (${limit}) on GoFlexConnect Free. Upgrade to Pro for unlimited speed tests.`,
      };
    }

    case 'ai_insights': {
      const current = summary.aiInsightsThisMonth;
      const limit = limits.maxAiInsightsPerMonth;
      const allowed = current + additionalCount <= limit;
      return {
        allowed,
        current,
        limit,
        message: allowed
          ? undefined
          : `You've used all AI Insights for this month (${limit}) on GoFlexConnect Free. Upgrade to Pro for unlimited AI-powered analysis.`,
      };
    }

    case 'heatmap_exports': {
      const current = summary.heatmapExportsThisMonth;
      const limit = limits.maxHeatmapExportsPerMonth;
      const allowed = current + additionalCount <= limit;
      return {
        allowed,
        current,
        limit,
        message: allowed
          ? undefined
          : `You've used all heatmap exports for this month (${limit}) on GoFlexConnect Free. Upgrade to Pro to export unlimited heatmaps.`,
      };
    }

    default:
      return { allowed: true, current: 0, limit: Infinity };
  }
}

/**
 * Check if a usage limit would be exceeded (TEST MODE - only checks test events)
 */
export async function checkTestUsageLimit(params: {
  userId: string;
  planId: PlanId | string;
  limitType: 'projects' | 'surveys' | 'measurements' | 'speed_tests' | 'ai_insights' | 'heatmap_exports';
  projectId?: string;
  surveyId?: string;
  additionalCount?: number;
}): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> {
  const { userId, planId, limitType, projectId, surveyId, additionalCount = 1 } = params;
  const limits = getLimitsForPlan(planId);
  const normalizedPlan = normalizePlanId(planId);

  // PRO users always allowed
  if (normalizedPlan === 'pro') {
    return { allowed: true, current: 0, limit: Infinity };
  }

  const summary = await getTestUsageSummary({ userId, planId });

  switch (limitType) {
    case 'projects': {
      const current = summary.projectCount;
      const limit = limits.maxProjects;
      const allowed = current + additionalCount <= limit;
      return {
        allowed,
        current,
        limit,
        message: allowed
          ? undefined
          : `You've reached the maximum number of projects (${limit}) allowed on GoFlexConnect Free. Archive an existing project or upgrade to Pro for unlimited projects.`,
      };
    }

    case 'surveys': {
      if (!projectId) throw new Error('projectId required for surveys limit check');
      const current = summary.surveysPerProject[projectId] || 0;
      const limit = limits.maxSurveysPerProject;
      const allowed = current + additionalCount <= limit;
      return {
        allowed,
        current,
        limit,
        message: allowed
          ? undefined
          : `You've reached the survey limit (${limit}) for this site on GoFlexConnect Free. Upgrade to Pro to run unlimited surveys for this site.`,
      };
    }

    case 'measurements': {
      if (!surveyId) throw new Error('surveyId required for measurements limit check');
      const current = summary.measurementsPerSurvey[surveyId] || 0;
      const limit = limits.maxMeasurementsPerSurvey;
      const allowed = current + additionalCount <= limit;
      return {
        allowed,
        current,
        limit,
        message: allowed
          ? undefined
          : `This survey already has the maximum number of measurements (${limit}) for GoFlexConnect Free. Start a new survey or upgrade to Pro for deeper data collection.`,
      };
    }

    case 'speed_tests': {
      const current = summary.speedTestsToday;
      const limit = limits.maxSpeedTestsPerDay;
      const allowed = current + additionalCount <= limit;
      return {
        allowed,
        current,
        limit,
        message: allowed
          ? undefined
          : `You've used all your speed tests for today (${limit}) on GoFlexConnect Free. Upgrade to Pro for unlimited speed tests.`,
      };
    }

    case 'ai_insights': {
      const current = summary.aiInsightsThisMonth;
      const limit = limits.maxAiInsightsPerMonth;
      const allowed = current + additionalCount <= limit;
      return {
        allowed,
        current,
        limit,
        message: allowed
          ? undefined
          : `You've used all AI Insights for this month (${limit}) on GoFlexConnect Free. Upgrade to Pro for unlimited AI-powered analysis.`,
      };
    }

    case 'heatmap_exports': {
      const current = summary.heatmapExportsThisMonth;
      const limit = limits.maxHeatmapExportsPerMonth;
      const allowed = current + additionalCount <= limit;
      return {
        allowed,
        current,
        limit,
        message: allowed
          ? undefined
          : `You've used all heatmap exports for this month (${limit}) on GoFlexConnect Free. Upgrade to Pro to export unlimited heatmaps.`,
      };
    }

    default:
      return { allowed: true, current: 0, limit: Infinity };
  }
}

/**
 * Check if user should receive usage threshold alert (80% or 100%)
 */
export async function checkAndAlertUsageThreshold(params: {
  userId: string;
  userEmail: string;
  planId: PlanId | string;
  limitType: 'projects' | 'surveys' | 'measurements' | 'speed_tests' | 'ai_insights' | 'heatmap_exports';
  projectId?: string;
  surveyId?: string;
}): Promise<void> {
  const { userId, userEmail, planId, limitType, projectId, surveyId } = params;
  const normalizedPlan = normalizePlanId(planId);

  // Only alert for FREE users
  if (normalizedPlan === 'pro') return;

  const limitCheck = await checkUsageLimit({ userId, planId, limitType, projectId, surveyId });
  const percentage = limitCheck.current / limitCheck.limit;

  // Alert at 80% and 100%
  if (percentage >= ALERT_THRESHOLDS.usage_warning) {
    const thresholdType = percentage >= ALERT_THRESHOLDS.usage_critical ? 'critical' : 'warning';
    const limitName = limitType.replace('_', ' ');

    await createAdminAlert({
      type: 'usage_threshold',
      userId,
      title: `Usage ${thresholdType}: ${limitName}`,
      message: `${userEmail} has reached ${Math.round(percentage * 100)}% of their ${limitName} limit (${limitCheck.current}/${limitCheck.limit}).`,
      metadata: {
        email: userEmail,
        limitType,
        current: limitCheck.current,
        limit: limitCheck.limit,
        percentage,
        projectId,
        surveyId,
      },
    });
  }
}
