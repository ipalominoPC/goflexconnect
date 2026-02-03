/**
 * HQ Project Management Service (v4.5 Truth Edition)
 * 
 * Master control logic for global project remediation.
 */

import { supabase } from './supabaseClient';

/**
 * MASTER PROJECT UPDATE (Admin Action)
 * Corrects project names, types, or locations globally.
 */
export async function updateProjectHQ(projectId: string, updates: { name?: string; type?: string; location?: string }) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update({ 
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[Truth HQ] Project update failed:', err);
    return { success: false, error: err };
  }
}

/**
 * MASTER PURGE PROTOCOL (Admin Action)
 * Permanently deletes a project and its associated data nodes.
 */
export async function deleteProjectHQ(projectId: string) {
  try {
    // Note: Supabase Foreign Key 'Cascade' should handle floors and measurements,
    // but we target the root project here.
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[Truth HQ] Purge protocol failed:', err);
    return { success: false, error: err };
  }
}