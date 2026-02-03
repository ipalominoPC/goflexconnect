/**
 * Global Announcement Service (v1.0 Truth Edition)
 */
import { supabase } from './supabaseClient';

export interface Announcement {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'critical';
  is_active: boolean;
}

const MASTER_ID = '00000000-0000-0000-0000-000000000001';

export async function getActiveAnnouncement(): Promise<Announcement | null> {
  const { data, error } = await supabase
    .from('system_announcements')
    .select('*')
    .eq('id', MASTER_ID)
    .single();
  
  if (error) return null;
  return data;
}

export async function updateAnnouncement(message: string, type: string, is_active: boolean) {
  const { error } = await supabase
    .from('system_announcements')
    .update({ 
      message, 
      type, 
      is_active, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', MASTER_ID);
  
  return { success: !error, error };
}