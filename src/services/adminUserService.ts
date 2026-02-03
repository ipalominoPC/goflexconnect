/**
 * HQ Identity Service (v4.5 Truth Edition)
 * 
 * Master control logic for technician fleet identity and security.
 */

import { supabase } from './supabaseClient';

export interface FleetMember {
  id: string;
  email: string;
  full_name: string;
  company_name: string | null;
  phone_number: string | null;
  project_count: number;
  last_active: string | null;
  status: 'active' | 'idle';
}

/**
 * FETCH GLOBAL IDENTITY DIRECTORY
 */
export async function getFleetDirectory(): Promise<FleetMember[]> {
  try {
    // 1. Fetch profiles with new identity fields
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, company_name, phone_number, updated_at');

    if (profileError) throw profileError;

    // 2. Fetch mission counts
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('user_id');

    if (projectError) throw projectError;

    return profiles.map(profile => {
      const userProjects = projects.filter(p => p.user_id === profile.id);
      const lastActiveDate = new Date(profile.updated_at);
      const isRecentlyActive = (Date.now() - lastActiveDate.getTime()) < 86400000;

      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name || 'Unverified Node',
        company_name: profile.company_name,
        phone_number: profile.phone_number,
        project_count: userProjects.length,
        last_active: profile.updated_at,
        status: isRecentlyActive ? 'active' : 'idle'
      };
    }).sort((a, b) => b.project_count - a.project_count);

  } catch (err) {
    console.error('[Truth HQ] Identity uplink failed:', err);
    return [];
  }
}

/**
 * TRIGGER SECURE PASSWORD RESET (Admin Action)
 * Sends an Azure-style reset link to the technician.
 */
export async function triggerPasswordResetHQ(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin, // Returns user to your Vercel URL
    });
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[Truth HQ] Password reset trigger failed:', err);
    return { success: false, error: err };
  }
}

export async function resetUserOnboarding(userId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ has_completed_onboarding: false, updated_at: new Date().toISOString() })
    .eq('id', userId);
  return { success: !error, error };
}