/**
 * Admin Plan Management Service
 *
 * Allows admins to grant/revoke manual PRO access to users
 * Used for beta testers, comped accounts, etc.
 */

import { supabase } from './supabaseClient';
import { PlanId } from '../config/planLimits';

export interface PlanOverride {
  id: string;
  user_id: string;
  plan_id: string;
  granted_by: string;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface UserWithPlan {
  id: string;
  email: string;
  created_at: string;
  effective_plan: PlanId;
  override?: PlanOverride;
}

/**
 * List all users with their effective plans
 */
export async function listUsersWithPlans(): Promise<UserWithPlan[]> {
  // Get all users from auth.users (admin only)
  const { data: usersData, error: usersError } = await supabase.rpc('get_all_users_admin');

  if (usersError) {
    // Fallback: If RPC doesn't exist, just return empty
    console.error('Failed to fetch users:', usersError);
    return [];
  }

  // Get all plan overrides
  const { data: overrides } = await supabase
    .from('plan_overrides')
    .select('*');

  // Map overrides by user_id
  const overrideMap = new Map<string, PlanOverride>();
  overrides?.forEach((override) => {
    overrideMap.set(override.user_id, override);
  });

  // Combine users with their overrides
  const users: UserWithPlan[] = usersData.map((user: any) => {
    const override = overrideMap.get(user.id);
    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      effective_plan: override
        ? (override.plan_id.toLowerCase() as PlanId)
        : (user.raw_user_meta_data?.plan?.toLowerCase() || 'free') as PlanId,
      override,
    };
  });

  return users;
}

/**
 * Grant PRO access to a user
 */
export async function grantProAccess(
  userId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('plan_overrides')
    .upsert({
      user_id: userId,
      plan_id: 'PRO',
      granted_by: currentUser.id,
      reason: reason || 'Manual PRO access',
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('Failed to grant PRO access:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Revoke PRO access (set back to FREE)
 */
export async function revokeProAccess(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('plan_overrides')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to revoke PRO access:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Update plan override
 */
export async function updatePlanOverride(
  userId: string,
  planId: 'FREE' | 'PRO',
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  if (planId === 'FREE') {
    // If setting to FREE, just remove the override
    return revokeProAccess(userId);
  }

  return grantProAccess(userId, reason);
}

/**
 * Get plan override for a specific user
 */
export async function getPlanOverride(userId: string): Promise<PlanOverride | null> {
  const { data, error } = await supabase
    .from('plan_overrides')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to get plan override:', error);
    return null;
  }

  return data;
}
