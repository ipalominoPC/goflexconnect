/**
 * Admin Metrics Service (v4.4 Truth Edition)
 * 
 * Provides real-time HQ intelligence by aggregating data from 
 * projects, support_tickets, and user_profiles.
 */

import { supabase } from './supabaseClient';

export interface AdminSummaryStats {
  total_projects: number;
  critical_signals: number;
  pending_quotes: number;
  active_techs: number;
}

/**
 * Fetch summary statistics for the Executive Command Center
 */
export async function fetchAdminSummaryStats(): Promise<AdminSummaryStats> {
  try {
    // 1. Fetch Total Projects (Missions)
    const { count: projectsCount, error: projectsError } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (projectsError) throw projectsError;

    // 2. Fetch Critical Signals (Unresolved Remediation Tickets)
    const { count: criticalCount, error: criticalError } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .eq('priority', 'REMEDIATION')
      .neq('status', 'resolved');

    if (criticalError) throw criticalError;

    // 3. Fetch Pending Quotes (All unresolved tickets)
    const { count: pendingCount, error: pendingError } = await supabase
      .from('support_tickets')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'resolved');

    if (pendingError) throw pendingError;

    // 4. Fetch Active Techs (Unique user count in support tickets)
    const { data: techData, error: techError } = await supabase
      .from('support_tickets')
      .select('user_id');

    if (techError) throw techError;
    
    const uniqueTechs = new Set(techData?.map(t => t.user_id).filter(Boolean));

    return {
      total_projects: projectsCount || 0,
      critical_signals: criticalCount || 0,
      pending_quotes: pendingCount || 0,
      active_techs: uniqueTechs.size || 0
    };
  } catch (error) {
    console.error('[Truth Metrics] Data aggregation failed:', error);
    return {
      total_projects: 0,
      critical_signals: 0,
      pending_quotes: 0,
      active_techs: 0
    };
  }
}

/**
 * Legacy support for health data (maintained for background analysis)
 */
export async function fetchSitesNeedingAttention() {
  try {
    const { data: measurements, error } = await supabase
      .from('measurements')
      .select('project_id, rsrp, sinr, created_at')
      .lt('rsrp', -105); // Standard Truth threshold for 'Poor'

    if (error) throw error;
    return measurements || [];
  } catch (e) {
    return [];
  }
}