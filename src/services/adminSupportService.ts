/**
 * Admin Support Service (v4.4 Truth Edition)
 * 
 * Synchronized with Supabase Schema:
 * id, user_id, user_email, subject, status, priority, message, project_id, admin_reply, ticket_number
 */

import { supabase } from './supabaseClient';

export interface AdminTicketListItem {
  id: string;
  ticket_number: string | null;
  priority: string | null; // Database column is 'priority'
  subject: string | null;
  message: string | null;
  status: string | null;
  created_at: string;
  user_id: string | null;
  user_email: string | null; // Database column is 'user_email'
  project_id: string | null;
  admin_reply: string | null;
}

/**
 * Get all tickets for a specific user
 */
export async function getTicketsForUser(userId: string): Promise<AdminTicketListItem[]> {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as AdminTicketListItem[]) || [];
  } catch (err) {
    console.error('[AdminSupportService] User fetch failed:', err);
    throw err;
  }
}

/**
 * Get all tickets (admin only)
 */
export async function getAllTickets(): Promise<AdminTicketListItem[]> {
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as AdminTicketListItem[]) || [];
  } catch (err) {
    console.error('[AdminSupportService] Global fetch failed:', err);
    throw err;
  }
}

/**
 * SEND TACTICAL INSTRUCTION (Admin Action)
 */
export async function addAdminReply(ticketId: string, reply: string) {
  try {
    const { error } = await supabase
      .from('support_tickets')
      .update({ 
        admin_reply: reply,
        status: 'in-review',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    return { success: !error, error };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(ticketId: string, status: string) {
  const { error } = await supabase
    .from('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId);
  return { error };
}

/**
 * TRUTH SIMULATION PROTOCOL
 * Injects a test "Zap" using verified schema columns.
 */
export async function injectSimulationTicket(userId: string, email: string) {
  const mockTicket = {
    ticket_number: `SIM-${Math.floor(1000 + Math.random() * 9000)}`,
    priority: 'REMEDIATION',
    subject: 'SIMULATED SIGNAL CRITICAL',
    message: 'AUTOMATED RF ALERT: Critical signal gap detected (-115dBm). Hardware remediation suggested.',
    status: 'new',
    user_id: userId,
    user_email: email,
    project_id: '00000000-0000-0000-0000-000000000000',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('support_tickets')
    .insert([mockTicket])
    .select();

  return { data, error };
}