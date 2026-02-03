/**
 * Support Service (Phase 3.1 Upgrade)
 * Restores Carrier/CID mapping and enables Admin Teleportation.
 */
import { supabase } from './supabaseClient';

export type SupportCategory = 'technical' | 'account' | 'billing' | 'feature_request' | 'feedback';
export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type SupportPriority = 'normal' | 'high';

export interface AdminSupportTicket {
  id: string;
  ticketNumber: string | null;
  createdAt: string;
  status: SupportStatus;
  category: SupportCategory;
  email: string;
  name: string;
  subject: string | null;
  message: string;
  priority: SupportPriority | null;
  phone: string | null;
  updatedAt: string;
  lastAdminView: string | null;
  lastAdminNote: string | null;
  userId: string | null;
  projectId: string | null; // THE TELEPORT KEY
  unreadByAdmin: boolean;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderType: 'customer' | 'admin';
  senderId: string | null;
  senderName: string;
  senderEmail: string;
  message: string;
  createdAt: string;
}

function generateTicketNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GF-${dateStr}-${random}`;
}

export async function createSupportTicket(input: any, currentUserId?: string): Promise<any> {
  const ticketNumber = generateTicketNumber();
  const { error } = await supabase.from('support_tickets').insert({
    user_id: currentUserId || null,
    ticket_number: ticketNumber,
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    category: input.category,
    subject: input.subject || null,
    message: input.message,
    status: 'open',
    source: 'app',
    associated_project_id: input.projectId || null
  });
  if (error) throw error;
  return { ticketId: ticketNumber, ticketNumber };
}

export async function adminFetchSupportTickets(): Promise<AdminSupportTicket[]> {
  const { data, error } = await supabase.rpc('admin_get_support_tickets');
  if (error) throw error;
  return (data || []).map((t: any) => ({
    id: t.id,
    ticketNumber: t.ticket_number,
    userId: t.user_id,
    projectId: t.associated_project_id, // MAPPED FOR TELEPORT
    name: t.name,
    email: t.email,
    phone: t.phone,
    category: t.category,
    subject: t.subject,
    message: t.message,
    status: t.status,
    priority: t.priority,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
    lastAdminView: t.last_admin_view,
    lastAdminNote: t.last_admin_note,
    unreadByAdmin: t.unread_by_admin ?? true,
  }));
}

export async function getTicketById(ticketId: string): Promise<AdminSupportTicket> {
  const { data, error } = await supabase.from('support_tickets').select('*').eq('id', ticketId).maybeSingle();
  if (error || !data) throw new Error('Ticket not found');
  return {
    id: data.id,
    ticketNumber: data.ticket_number,
    userId: data.user_id,
    projectId: data.associated_project_id, // MAPPED FOR TELEPORT
    name: data.name,
    email: data.email,
    phone: data.phone,
    category: data.category,
    subject: data.subject,
    message: data.message,
    status: data.status,
    priority: data.priority,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    lastAdminView: data.last_admin_view,
    lastAdminNote: data.last_admin_note,
    unreadByAdmin: false,
  };
}

export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  const { data: ticket } = await supabase.from('support_tickets').select('*').eq('id', ticketId).maybeSingle();
  const { data: messages } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
  const allMessages: TicketMessage[] = [{
    id: ticket.id, ticketId: ticket.id, senderType: 'customer', senderId: ticket.user_id,
    senderName: ticket.name, senderEmail: ticket.email, message: ticket.message, createdAt: ticket.created_at,
  }];
  if (messages) {
    messages.forEach((msg: any) => {
      allMessages.push({
        id: msg.id, ticketId: msg.ticket_id, senderType: msg.sender_type,
        senderId: msg.sender_id, senderName: msg.sender_name, senderEmail: msg.sender_email,
        message: msg.message, createdAt: msg.created_at,
      });
    });
  }
  return allMessages;
}

export async function sendAdminReply(ticketId: string, message: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');
  await supabase.from('ticket_messages').insert({
    ticket_id: ticketId, sender_type: 'admin', sender_id: user.id,
    sender_name: 'GFC Support', sender_email: 'support@goflexconnect.com', message,
  });
  await supabase.from('support_tickets').update({ status: 'in_progress', updated_at: new Date().toISOString() }).eq('id', ticketId);
}

export async function resolveTicket(ticketId: string): Promise<void> {
  await supabase.from('support_tickets').update({ status: 'resolved', updated_at: new Date().toISOString() }).eq('id', ticketId);
}

export function getCategoryLabel(category: SupportCategory): string {
  const labels: any = { technical: 'Technical', account: 'Account', billing: 'Billing', feature_request: 'Feature', feedback: 'Feedback' };
  return labels[category];
}

export function getStatusInfo(status: SupportStatus): { label: string; color: string } {
  const statusMap: any = { open: { label: 'Open', color: 'blue' }, in_progress: { label: 'Active', color: 'yellow' }, resolved: { label: 'Fixed', color: 'green' }, closed: { label: 'Closed', color: 'gray' } };
  return statusMap[status];
}
