/**
 * Admin User Service
 *
 * Provides functions for admin operations on users and plan overrides.
 * All operations require admin authentication via Supabase RPC functions.
 */

import { supabase } from './supabaseClient';
import { PlanId } from '../config/planLimits';

export interface AdminUserWithPlan {
  id: string;
  email: string;
  created_at: string;
  plan_override: PlanId | null;
  plan_override_reason: string | null;
  plan_override_expires_at: string | null;
}

/**
 * Fetch all users with their plan override data (admin only)
 * Uses SECURITY DEFINER RPC to bypass RLS safely
 */
export async function adminFetchUsersWithPlans(): Promise<AdminUserWithPlan[]> {
  const { data, error } = await supabase.rpc('admin_get_users_with_plans');

  if (error) {
    console.error('Error fetching users:', error);
    throw new Error(error.message || 'Failed to load users');
  }

  return (data || []) as AdminUserWithPlan[];
}

/**
 * Update a user's plan override (admin only)
 */
export async function adminUpdatePlanOverride(
  userId: string,
  override: {
    plan_override: PlanId | null;
    plan_override_reason: string | null;
    plan_override_expires_at: string | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(override)
    .eq('id', userId);

  if (error) {
    console.error('Error updating plan override:', error);
    throw new Error(error.message || 'Failed to update plan override');
  }
}

/**
 * Clear a user's plan override (admin only)
 */
export async function adminClearPlanOverride(userId: string): Promise<void> {
  await adminUpdatePlanOverride(userId, {
    plan_override: null,
    plan_override_reason: null,
    plan_override_expires_at: null,
  });
}
