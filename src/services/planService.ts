/**
 * Plan Service - Centralized plan detection and limit enforcement
 *
 * This service provides guard functions that enforce FREE tier limits
 * across all features. PRO users have unlimited access.
 *
 * Plan Resolution Order:
 * 1. Check for manual plan_override (admin-granted PRO access)
 * 2. Fall back to user_metadata plan (if ever used)
 * 3. Default to FREE
 */

import { supabase } from './supabaseClient';
import { PlanId, getLimitsForPlan, normalizePlanId } from '../config/planLimits';
import { checkUsageLimit, trackUsageEvent } from './usageTracking';
import { fetchBillingPhase, shouldHaveProFeatures, BillingPhaseInfo } from './billingPhaseService';

export interface User {
  id: string;
  email?: string;
  user_metadata?: {
    plan?: string;
  };
  raw_user_meta_data?: {
    plan?: string;
  };
}

export interface ResolvedPlan {
  plan: PlanId;
  basePlan: PlanId;
  override?: PlanId;
  reason?: string;
  billingPhase?: BillingPhaseInfo;
  effectivePlan?: PlanId;
}

export interface LimitCheckResult {
  allowed: boolean;
  message?: string;
  current?: number;
  limit?: number;
}

/**
 * Resolve the effective plan for a user
 * Checks for manual overrides first, then respects billing phase
 */
export async function resolveUserPlan(userId: string): Promise<ResolvedPlan> {
  // 1. Determine base plan from user metadata
  const { data: { user } } = await supabase.auth.getUser();
  const basePlan: PlanId = user?.id === userId
    ? normalizePlanId(user.user_metadata?.plan || user.raw_user_meta_data?.plan)
    : 'free';

  // 2. Check for manual plan override in profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_override, plan_override_reason, plan_override_expires_at')
    .eq('id', userId)
    .maybeSingle();

  let resolvedPlan: PlanId = basePlan;
  let override: PlanId | undefined = undefined;
  let reason: string | undefined = undefined;

  // 3. Check if override is active (not expired)
  if (profile?.plan_override) {
    const isExpired = profile.plan_override_expires_at &&
                      new Date(profile.plan_override_expires_at) < new Date();

    if (!isExpired) {
      resolvedPlan = normalizePlanId(profile.plan_override);
      override = normalizePlanId(profile.plan_override);
      reason = profile.plan_override_reason || undefined;
    }
  }

  // 4. Fetch billing phase and determine effective plan
  const billingPhase = await fetchBillingPhase();
  const effectivePlan = shouldHaveProFeatures(resolvedPlan, billingPhase.phase) ? 'pro' : 'free';

  return {
    plan: resolvedPlan,
    basePlan,
    override,
    reason,
    billingPhase,
    effectivePlan,
  };
}

/**
 * Get the plan for a user (synchronous version for backward compatibility)
 * Returns 'pro' or 'free' (defaults to 'free')
 *
 * NOTE: This does NOT check plan_overrides. Use resolveUserPlan() for full resolution.
 * This is kept for backward compatibility with existing code.
 */
export function getUserPlan(user: User | null | undefined): PlanId {
  if (!user) return 'free';

  const plan =
    user.user_metadata?.plan ||
    user.raw_user_meta_data?.plan ||
    'free';

  return normalizePlanId(plan);
}

/**
 * Check if user is on FREE plan
 */
export function isFreePlan(user: User | null | undefined): boolean {
  return getUserPlan(user) === 'free';
}

/**
 * Check if user is on PRO plan
 */
export function isProPlan(user: User | null | undefined): boolean {
  return getUserPlan(user) === 'pro';
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Guard: Check if user can create a project
 * Throws error if limit exceeded
 */
export async function assertCanCreateProject(userId: string): Promise<LimitCheckResult> {
  const user = await getCurrentUser();
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: User mismatch');
  }

  // Use resolved plan (checks overrides and billing phase)
  const resolved = await resolveUserPlan(userId);
  const planId = resolved.effectivePlan || resolved.plan;

  // PRO users have unlimited projects
  if (planId === 'pro') {
    return { allowed: true };
  }

  // Check FREE tier limit
  const limitCheck = await checkUsageLimit({
    userId,
    planId,
    limitType: 'projects',
  });

  if (!limitCheck.allowed) {
    return {
      allowed: false,
      message: limitCheck.message,
      current: limitCheck.current,
      limit: limitCheck.limit,
    };
  }

  return { allowed: true };
}

/**
 * Guard: Check if user can create a survey in a project
 * Throws error if limit exceeded
 */
export async function assertCanCreateSurvey(
  userId: string,
  projectId: string
): Promise<LimitCheckResult> {
  const user = await getCurrentUser();
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: User mismatch');
  }

  // Use resolved plan (checks overrides and billing phase)
  const resolved = await resolveUserPlan(userId);
  const planId = resolved.effectivePlan || resolved.plan;

  // PRO users have unlimited surveys
  if (planId === 'pro') {
    return { allowed: true };
  }

  // Check FREE tier limit
  const limitCheck = await checkUsageLimit({
    userId,
    planId,
    limitType: 'surveys',
    projectId,
  });

  if (!limitCheck.allowed) {
    return {
      allowed: false,
      message: limitCheck.message,
      current: limitCheck.current,
      limit: limitCheck.limit,
    };
  }

  return { allowed: true };
}

/**
 * Guard: Check if user can record a measurement in a survey
 * Throws error if limit exceeded
 */
export async function assertCanRecordMeasurement(
  userId: string,
  surveyId: string
): Promise<LimitCheckResult> {
  const user = await getCurrentUser();
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: User mismatch');
  }

  // Use resolved plan (checks overrides and billing phase)
  const resolved = await resolveUserPlan(userId);
  const planId = resolved.effectivePlan || resolved.plan;

  // PRO users have unlimited measurements
  if (planId === 'pro') {
    return { allowed: true };
  }

  // Check FREE tier limit
  const limitCheck = await checkUsageLimit({
    userId,
    planId,
    limitType: 'measurements',
    surveyId,
  });

  if (!limitCheck.allowed) {
    return {
      allowed: false,
      message: limitCheck.message,
      current: limitCheck.current,
      limit: limitCheck.limit,
    };
  }

  return { allowed: true };
}

/**
 * Guard: Check if user can use AI Insights
 * Throws error if limit exceeded
 */
export async function assertCanUseAiInsights(userId: string): Promise<LimitCheckResult> {
  const user = await getCurrentUser();
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: User mismatch');
  }

  // Use resolved plan (checks overrides and billing phase)
  const resolved = await resolveUserPlan(userId);
  const planId = resolved.effectivePlan || resolved.plan;

  // PRO users have unlimited AI insights
  if (planId === 'pro') {
    return { allowed: true };
  }

  // Check FREE tier limit
  const limitCheck = await checkUsageLimit({
    userId,
    planId,
    limitType: 'ai_insights',
  });

  if (!limitCheck.allowed) {
    return {
      allowed: false,
      message: limitCheck.message,
      current: limitCheck.current,
      limit: limitCheck.limit,
    };
  }

  return { allowed: true };
}

/**
 * Guard: Check if user can export a heatmap
 * Throws error if limit exceeded
 */
export async function assertCanExportHeatmap(userId: string): Promise<LimitCheckResult> {
  const user = await getCurrentUser();
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: User mismatch');
  }

  // Use resolved plan (checks overrides and billing phase)
  const resolved = await resolveUserPlan(userId);
  const planId = resolved.effectivePlan || resolved.plan;

  // PRO users have unlimited heatmap exports
  if (planId === 'pro') {
    return { allowed: true };
  }

  // Check FREE tier limit
  const limitCheck = await checkUsageLimit({
    userId,
    planId,
    limitType: 'heatmap_exports',
  });

  if (!limitCheck.allowed) {
    return {
      allowed: false,
      message: limitCheck.message,
      current: limitCheck.current,
      limit: limitCheck.limit,
    };
  }

  return { allowed: true };
}

/**
 * Track project creation and enforce limit
 */
export async function trackAndEnforceProjectCreation(userId: string, projectId: string): Promise<void> {
  await trackUsageEvent({
    userId,
    eventType: 'project_created',
    projectId,
  });
}

/**
 * Track survey creation and enforce limit
 */
export async function trackAndEnforceSurveyCreation(
  userId: string,
  projectId: string,
  surveyId: string
): Promise<void> {
  await trackUsageEvent({
    userId,
    eventType: 'survey_created',
    projectId,
    surveyId,
  });
}

/**
 * Track measurement recording and enforce limit
 */
export async function trackAndEnforceMeasurementRecording(
  userId: string,
  surveyId: string,
  count: number = 1
): Promise<void> {
  await trackUsageEvent({
    userId,
    eventType: 'measurement_recorded',
    surveyId,
    count,
  });
}

/**
 * Track AI insight generation and enforce limit
 */
export async function trackAndEnforceAiInsightGeneration(userId: string): Promise<void> {
  await trackUsageEvent({
    userId,
    eventType: 'ai_insight_generated',
  });
}

/**
 * Track heatmap export and enforce limit
 */
export async function trackAndEnforceHeatmapExport(userId: string): Promise<void> {
  await trackUsageEvent({
    userId,
    eventType: 'heatmap_exported',
  });
}

/**
 * Guard: Check if user can run a speed test
 */
export async function assertCanRunSpeedTest(userId: string): Promise<LimitCheckResult> {
  const user = await getCurrentUser();
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized: User mismatch');
  }

  // Use resolved plan (checks overrides and billing phase)
  const resolved = await resolveUserPlan(userId);
  const planId = resolved.effectivePlan || resolved.plan;

  // PRO users have unlimited speed tests
  if (planId === 'pro') {
    return { allowed: true };
  }

  // Check FREE tier limit
  const limitCheck = await checkUsageLimit({
    userId,
    planId,
    limitType: 'speed_tests',
  });

  if (!limitCheck.allowed) {
    return {
      allowed: false,
      message: limitCheck.message,
      current: limitCheck.current,
      limit: limitCheck.limit,
    };
  }

  return { allowed: true };
}

/**
 * Track speed test and enforce limit
 */
export async function trackAndEnforceSpeedTest(userId: string): Promise<void> {
  await trackUsageEvent({
    userId,
    eventType: 'speed_test_run',
  });
}
