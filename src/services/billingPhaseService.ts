/**
 * Billing Phase Service
 *
 * Manages the global billing phase state for the application.
 * This is framework-agnostic and can be used across web, PWA, and future native mobile containers.
 *
 * Billing Phases:
 * - BETA_FREE: Everyone has PRO features, no billing (default during beta)
 * - NOTICE: PRO features still active, but users see notice that billing will start
 * - PAID_LIVE: Only explicitly PRO users keep PRO features, others revert to FREE with ads
 */

import { supabase } from './supabaseClient';

export type BillingPhase = 'BETA_FREE' | 'NOTICE' | 'PAID_LIVE';

export interface BillingPhaseInfo {
  phase: BillingPhase;
  noticeStartAt: string | null;
  noticeDays: number | null;
  billingActivationDate: string | null;
}

export interface UpdateBillingPhaseParams {
  phase?: BillingPhase;
  noticeStartAt?: string | null;
  noticeDays?: number | null;
}

/**
 * Fetch the current billing phase from database
 */
export async function fetchBillingPhase(): Promise<BillingPhaseInfo> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('billing_phase, billing_notice_start_at, billing_notice_days')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching billing phase:', error);
    // Return safe default
    return {
      phase: 'BETA_FREE',
      noticeStartAt: null,
      noticeDays: null,
      billingActivationDate: null,
    };
  }

  if (!data) {
    // No settings row exists, return default
    return {
      phase: 'BETA_FREE',
      noticeStartAt: null,
      noticeDays: null,
      billingActivationDate: null,
    };
  }

  // Calculate billing activation date
  let billingActivationDate: string | null = null;
  if (data.billing_notice_start_at && data.billing_notice_days) {
    const startDate = new Date(data.billing_notice_start_at);
    const activationDate = new Date(startDate);
    activationDate.setDate(activationDate.getDate() + data.billing_notice_days);
    billingActivationDate = activationDate.toISOString();
  }

  return {
    phase: data.billing_phase as BillingPhase,
    noticeStartAt: data.billing_notice_start_at,
    noticeDays: data.billing_notice_days,
    billingActivationDate,
  };
}

/**
 * Update the billing phase (admin only)
 * Note: This should be called from admin-authenticated contexts
 */
export async function updateBillingPhase(params: UpdateBillingPhaseParams): Promise<BillingPhaseInfo> {
  // Build update object
  const updates: any = {
    updated_at: new Date().toISOString(),
  };

  if (params.phase !== undefined) {
    updates.billing_phase = params.phase;
  }

  if (params.noticeStartAt !== undefined) {
    updates.billing_notice_start_at = params.noticeStartAt;
  }

  if (params.noticeDays !== undefined) {
    updates.billing_notice_days = params.noticeDays;
  }

  // Get first settings row (there should only be one)
  const { data: existingSettings } = await supabase
    .from('app_settings')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (existingSettings) {
    // Update existing row
    const { error } = await supabase
      .from('app_settings')
      .update(updates)
      .eq('id', existingSettings.id);

    if (error) {
      console.error('Error updating billing phase:', error);
      throw new Error('Failed to update billing phase');
    }
  } else {
    // Create new row if none exists
    const { error } = await supabase
      .from('app_settings')
      .insert({
        billing_phase: params.phase || 'BETA_FREE',
        billing_notice_start_at: params.noticeStartAt || null,
        billing_notice_days: params.noticeDays || 14,
      });

    if (error) {
      console.error('Error creating billing phase settings:', error);
      throw new Error('Failed to create billing phase settings');
    }
  }

  // Return updated settings
  return await fetchBillingPhase();
}

/**
 * Check if user should have PRO features based on billing phase
 *
 * @param userPlan - The user's resolved plan (from plan overrides, etc.)
 * @param billingPhase - Current billing phase
 * @returns true if user should have PRO features
 */
export function shouldHaveProFeatures(
  userPlan: 'free' | 'pro',
  billingPhase: BillingPhase
): boolean {
  switch (billingPhase) {
    case 'BETA_FREE':
      // Everyone gets PRO features during beta
      return true;

    case 'NOTICE':
      // Everyone still gets PRO features, but with notice
      return true;

    case 'PAID_LIVE':
      // Only explicitly PRO users get PRO features
      return userPlan === 'pro';

    default:
      // Safe default: respect user's actual plan
      return userPlan === 'pro';
  }
}

/**
 * Get days remaining until billing activation (if in NOTICE phase)
 */
export function getDaysUntilBillingActivation(billingInfo: BillingPhaseInfo): number | null {
  if (billingInfo.phase !== 'NOTICE' || !billingInfo.billingActivationDate) {
    return null;
  }

  const now = new Date();
  const activationDate = new Date(billingInfo.billingActivationDate);
  const diffMs = activationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Format billing activation date for display
 */
export function formatBillingActivationDate(billingInfo: BillingPhaseInfo): string | null {
  if (!billingInfo.billingActivationDate) {
    return null;
  }

  const date = new Date(billingInfo.billingActivationDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Check if notice period has expired (should transition to PAID_LIVE)
 */
export function isNoticePeriodExpired(billingInfo: BillingPhaseInfo): boolean {
  if (billingInfo.phase !== 'NOTICE' || !billingInfo.billingActivationDate) {
    return false;
  }

  const now = new Date();
  const activationDate = new Date(billingInfo.billingActivationDate);
  return now >= activationDate;
}
