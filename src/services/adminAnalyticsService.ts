/**
 * Admin Analytics Service
 *
 * Provides aggregated analytics queries for admin dashboard.
 * Uses SECURITY DEFINER RPC function to bypass RLS safely.
 */

import { supabase } from './supabaseClient';

export interface UserAnalyticsSummary {
  totalUsers: number;
  newUsersLast7Days: number;
  activeUsersLast24h: number;
  activeUsersLast7Days: number;
  freeUsersCount: number;
  proUsersCount: number;
  overriddenProCount: number;
}

export interface UsageAnalyticsSummary {
  projectsLast7Days: number;
  measurementsLast24h: number;
  measurementsLast7Days: number;
  speedTestsLast24h: number;
  speedTestsLast7Days: number;
  aiInsightsLast7Days: number;
  heatmapExportsLast7Days: number;
}

export interface AdAnalyticsSummary {
  impressionsLast7Days: number;
  clicksLast7Days: number;
  ctrLast7Days: number;
}

export interface TopUserUsage {
  userId: string;
  email: string;
  plan: string;
  measurementsLast7Days: number;
  speedTestsLast7Days: number;
  projectsTotal: number;
}

export interface AdminAnalytics {
  userSummary: UserAnalyticsSummary;
  usageSummary: UsageAnalyticsSummary;
  adSummary: AdAnalyticsSummary;
  topHeavyUsers: TopUserUsage[];
}

/**
 * Fetch comprehensive admin analytics via RPC
 * Uses admin_get_analytics() function with SECURITY DEFINER
 */
export async function fetchAdminAnalytics(): Promise<AdminAnalytics> {
  const { data, error } = await supabase.rpc('admin_get_analytics');

  if (error) {
    console.error('Admin analytics RPC error:', error);
    throw new Error(error.message || 'Failed to fetch admin analytics');
  }

  if (!data) {
    throw new Error('No data returned from admin analytics');
  }

  return data as AdminAnalytics;
}
