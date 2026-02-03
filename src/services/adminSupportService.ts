/**
 * Admin Support Service (v4.5 Truth Edition)
 * 
 * Synchronized with Supabase Schema:
 * id, user_id, user_email, subject, status, priority, message, project_id, admin_reply, ticket_number, conversation_id
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
  conversation_id: string | null; // TASK 1: For Intelligence Audit (Transcript Linking)
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
 * Task 1: Supports persisting conversation_id for Intelligence Audits
 */
export async function addAdminReply(ticketId: string, reply: string, conversationId?: string) {
  try {
    const updatePayload: any = { 
      admin_reply: reply,
      status: 'in-review',
      updated_at: new Date().toISOString()
    };

    if (conversationId) {
      updatePayload.conversation_id = conversationId;
    }

    const { error } = await supabase
      .from('support_tickets')
      .update(updatePayload)
      .eq('id', ticketId);

    return { success: !error, error };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * TASK 3: SALES ENGINE FINALIZATION
 * Creates a record in system_quotes when a "Zap" (Remediation) is actioned.
 */
export async function createRemediationQuote(ticket: AdminTicketListItem, estimatedValue: number = 0) {
  try {
    const { data, error } = await supabase
      .from('system_quotes')
      .insert([{
        ticket_id: ticket.id,
        user_id: ticket.user_id,
        project_id: ticket.project_id,
        user_email: ticket.user_email,
        subject: `REMEDIATION: ${ticket.subject}`,
        quote_amount: estimatedValue,
        status: 'pending_review',
        metadata: {
          original_ticket_no: ticket.ticket_number,
          priority: ticket.priority
        }
      }])
      .select();

    return { data, error };
  } catch (err) {
    return { data: null, error: err };
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
    conversation_id: `conv_${Math.random().toString(36).slice(2, 11)}`, // Mock for Intelligence Audit
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('support_tickets')
    .insert([mockTicket])
    .select();

  return { data, error };
}