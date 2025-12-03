/**
 * Admin Support Service
 *
 * Provides admin-level access to support tickets.
 * Uses RLS policies that grant admins full access based on email.
 */

import { supabase } from './supabaseClient';

export interface AdminTicketListItem {
  id: string;
  ticket_number: string;
  category: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
  user_id: string | null;
  name: string;
  email: string;
}

/**
 * Get all tickets for a specific user
 * Admin users will have full access via RLS policies
 */
export async function getTicketsForUser(userId: string): Promise<AdminTicketListItem[]> {
  try {
    console.log('[AdminSupportService] Fetching tickets for user:', userId);

    const { data, error } = await supabase
      .from('support_tickets')
      .select('id, ticket_number, category, subject, message, status, created_at, user_id, name, email')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[AdminSupportService] Error loading tickets:', error);
      throw error;
    }

    console.log('[AdminSupportService] Loaded tickets:', data?.length || 0);
    return data || [];
  } catch (err) {
    console.error('[AdminSupportService] Failed to fetch user tickets:', err);
    throw err;
  }
}

/**
 * Get all tickets (admin only)
 * Only works for admin users via RLS policies
 */
export async function getAllTickets(): Promise<AdminTicketListItem[]> {
  try {
    console.log('[AdminSupportService] Fetching all tickets (admin only)');

    const { data, error } = await supabase
      .from('support_tickets')
      .select('id, ticket_number, category, subject, message, status, created_at, user_id, name, email')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[AdminSupportService] Error loading all tickets:', error);
      throw error;
    }

    console.log('[AdminSupportService] Loaded all tickets:', data?.length || 0);
    return data || [];
  } catch (err) {
    console.error('[AdminSupportService] Failed to fetch all tickets:', err);
    throw err;
  }
}
