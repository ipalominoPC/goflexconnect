/**
 * Usage Notice Service
 *
 * Provides contextual usage notifications for FREE users
 * Reuses existing usage tracking and plan resolution logic
 */

import { supabase } from './supabaseClient';
import { resolveUserPlan } from './planService';
import { getLimitsForPlan } from '../config/planLimits';
import { findApplicableNoticeRule, interpolateMessage } from '../config/usageNotices';
import { isAdminEmail } from '../config/admin';
import { fetchBillingPhase } from './billingPhaseService';

export type UsageNoticeContext =
  | { type: 'dashboard' }
  | { type: 'project'; projectId: string }
  | { type: 'survey'; surveyId: string }
  | { type: 'ai_insights' }
  | { type: 'heatmap' };

export interface UsageNotice {
  id: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  cta?: {
    label: string;
    action: 'upgrade-modal' | 'contact-support';
  };
}

/**
 * Get usage notices for the current user and context
 */
export async function getUsageNotices(
  userId: string,
  context: UsageNoticeContext
): Promise<UsageNotice[]> {
  // 1. Check billing phase - don't show notices during BETA_FREE
  const billingPhase = await fetchBillingPhase();
  if (billingPhase.phase === 'BETA_FREE') {
    return [];
  }

  // 2. Check if user is an admin - admins don't get usage notices
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email && isAdminEmail(user.email)) {
    return [];
  }

  // 3. Check if user is PRO - PRO users don't get usage notices
  const resolved = await resolveUserPlan(userId);
  if (resolved.plan === 'pro') {
    return [];
  }

  const notices: UsageNotice[] = [];
  const limits = getLimitsForPlan('free');

  try {
    // 4. Check context-specific usage
    switch (context.type) {
      case 'dashboard':
        // Check project count
        const projectNotice = await checkProjectUsage(userId, limits.maxProjects);
        if (projectNotice) notices.push(projectNotice);
        break;

      case 'project':
        // Check survey count for this project
        const surveyNotice = await checkSurveyUsage(
          userId,
          context.projectId,
          limits.maxSurveysPerProject
        );
        if (surveyNotice) notices.push(surveyNotice);
        break;

      case 'survey':
        // Check measurement count for this survey
        const measurementNotice = await checkMeasurementUsage(
          context.surveyId,
          limits.maxMeasurementsPerSurvey
        );
        if (measurementNotice) notices.push(measurementNotice);
        break;

      case 'ai_insights':
        // Check AI insights usage this month
        const aiNotice = await checkAiInsightsUsage(userId, limits.maxAiInsightsPerMonth);
        if (aiNotice) notices.push(aiNotice);
        break;

      case 'heatmap':
        // Check heatmap export usage this month
        const heatmapNotice = await checkHeatmapExportUsage(
          userId,
          limits.maxHeatmapExportsPerMonth
        );
        if (heatmapNotice) notices.push(heatmapNotice);
        break;
    }
  } catch (error) {
    console.error('Failed to fetch usage notices:', error);
  }

  return notices;
}

/**
 * Check project usage and return notice if applicable
 */
async function checkProjectUsage(
  userId: string,
  limit: number
): Promise<UsageNotice | null> {
  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const current = count || 0;
  const rule = findApplicableNoticeRule('projects', current, limit);

  if (!rule) return null;

  return {
    id: rule.id,
    severity: rule.severity,
    message: interpolateMessage(rule.message, current, limit),
    cta: rule.ctaLabel && rule.ctaAction
      ? { label: rule.ctaLabel, action: rule.ctaAction }
      : undefined,
  };
}

/**
 * Check survey usage for a project and return notice if applicable
 */
async function checkSurveyUsage(
  userId: string,
  projectId: string,
  limit: number
): Promise<UsageNotice | null> {
  const { count } = await supabase
    .from('floors')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  const current = count || 0;
  const rule = findApplicableNoticeRule('surveys', current, limit);

  if (!rule) return null;

  return {
    id: rule.id,
    severity: rule.severity,
    message: interpolateMessage(rule.message, current, limit),
    cta: rule.ctaLabel && rule.ctaAction
      ? { label: rule.ctaLabel, action: rule.ctaAction }
      : undefined,
  };
}

/**
 * Check measurement usage for a survey and return notice if applicable
 */
async function checkMeasurementUsage(
  surveyId: string,
  limit: number
): Promise<UsageNotice | null> {
  const { count } = await supabase
    .from('measurements')
    .select('*', { count: 'exact', head: true })
    .eq('floor_id', surveyId);

  const current = count || 0;
  const rule = findApplicableNoticeRule('measurements', current, limit);

  if (!rule) return null;

  return {
    id: rule.id,
    severity: rule.severity,
    message: interpolateMessage(rule.message, current, limit),
    cta: rule.ctaLabel && rule.ctaAction
      ? { label: rule.ctaLabel, action: rule.ctaAction }
      : undefined,
  };
}

/**
 * Check AI insights usage this month and return notice if applicable
 */
async function checkAiInsightsUsage(
  userId: string,
  limit: number
): Promise<UsageNotice | null> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', 'ai_insight_generated')
    .gte('created_at', startOfMonth.toISOString());

  const current = count || 0;
  const rule = findApplicableNoticeRule('ai_insights', current, limit);

  if (!rule) return null;

  return {
    id: rule.id,
    severity: rule.severity,
    message: interpolateMessage(rule.message, current, limit),
    cta: rule.ctaLabel && rule.ctaAction
      ? { label: rule.ctaLabel, action: rule.ctaAction }
      : undefined,
  };
}

/**
 * Check heatmap export usage this month and return notice if applicable
 */
async function checkHeatmapExportUsage(
  userId: string,
  limit: number
): Promise<UsageNotice | null> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', 'heatmap_exported')
    .gte('created_at', startOfMonth.toISOString());

  const current = count || 0;
  const rule = findApplicableNoticeRule('heatmap_exports', current, limit);

  if (!rule) return null;

  return {
    id: rule.id,
    severity: rule.severity,
    message: interpolateMessage(rule.message, current, limit),
    cta: rule.ctaLabel && rule.ctaAction
      ? { label: rule.ctaLabel, action: rule.ctaAction }
      : undefined,
  };
}

/**
 * Get a quick summary of all usage for a user (for settings/profile page)
 */
export async function getUserUsageSummary(userId: string) {
  const resolved = await resolveUserPlan(userId);
  const limits = getLimitsForPlan(resolved.plan);

  // Count projects
  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Count AI insights this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: aiInsightsCount } = await supabase
    .from('usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', 'ai_insight_generated')
    .gte('created_at', startOfMonth.toISOString());

  const { count: heatmapExportsCount } = await supabase
    .from('usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('event_type', 'heatmap_exported')
    .gte('created_at', startOfMonth.toISOString());

  return {
    plan: resolved.plan,
    projects: {
      current: projectCount || 0,
      limit: limits.maxProjects,
    },
    aiInsights: {
      current: aiInsightsCount || 0,
      limit: limits.maxAiInsightsPerMonth,
    },
    heatmapExports: {
      current: heatmapExportsCount || 0,
      limit: limits.maxHeatmapExportsPerMonth,
    },
  };
}
