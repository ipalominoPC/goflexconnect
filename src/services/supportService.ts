/**
 * Support Service
 *
 * Handles support ticket creation, retrieval, and management.
 * Uses the existing email infrastructure for notifications.
 */

import { supabase } from './supabaseClient';

export type SupportCategory =
  | 'technical'
  | 'account'
  | 'billing'
  | 'feature_request'
  | 'feedback';

export type SupportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type SupportPriority = 'normal' | 'high';

export interface CreateSupportTicketInput {
  name: string;
  email: string;
  phone?: string;
  category: SupportCategory;
  subject?: string;
  message: string;
}

export interface SupportTicket {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  category: SupportCategory;
  subject: string | null;
  message: string;
  status: SupportStatus;
  priority: SupportPriority | null;
  source: string;
  created_at: string;
  updated_at: string;
  last_admin_view: string | null;
  last_admin_note: string | null;
}

export interface AdminSupportTicket {
  id: string;
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
}

/**
 * Create a support ticket
 * Inserts into DB and sends email notification to support team
 */
export async function createSupportTicket(
  input: CreateSupportTicketInput,
  currentUserId?: string
): Promise<{ ticketId: string }> {
  // Insert ticket into database
  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({
      user_id: currentUserId || null,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      category: input.category,
      subject: input.subject || null,
      message: input.message,
      status: 'open',
      source: 'app',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating support ticket:', error);
    throw new Error('Failed to create support ticket');
  }

  const ticketId = ticket.id;

  // Send email notification (non-blocking)
  sendSupportTicketEmail(ticketId, input).catch((err) => {
    console.error('Failed to send support ticket email:', err);
  });

  return { ticketId };
}

/**
 * Send email notification for new support ticket
 * Uses the existing send-email edge function
 */
async function sendSupportTicketEmail(
  ticketId: string,
  input: CreateSupportTicketInput
): Promise<void> {
  try {
    const categoryLabels: Record<SupportCategory, string> = {
      technical: 'Technical Support',
      account: 'Account Support',
      billing: 'Billing',
      feature_request: 'Feature Request',
      feedback: 'Feedback',
    };

    const categoryLabel = categoryLabels[input.category];

    const subject = `[GoFlexConnect Support] ${categoryLabel} ticket from ${input.name}`;

    const body = `
<h2>New Support Ticket</h2>

<p><strong>Ticket ID:</strong> ${ticketId}</p>
<p><strong>Category:</strong> ${categoryLabel}</p>
<p><strong>Created:</strong> ${new Date().toLocaleString()}</p>

<hr />

<h3>Contact Information</h3>
<p><strong>Name:</strong> ${input.name}</p>
<p><strong>Email:</strong> ${input.email}</p>
${input.phone ? `<p><strong>Phone:</strong> ${input.phone}</p>` : ''}

${input.subject ? `<h3>Subject</h3><p>${input.subject}</p>` : ''}

<h3>Message</h3>
<p>${input.message.replace(/\n/g, '<br>')}</p>

<hr />

<p><em>This is an automated notification from GoFlexConnect Support System.</em></p>
    `.trim();

    // Call the existing send-email edge function
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: ['isaac@goflexconnect.com', 'dev@goflexconnect.com'],
        subject,
        html: body,
      },
    });

    if (error) {
      console.error('Error sending support ticket email:', error);
      throw error;
    }
  } catch (err) {
    console.error('Failed to send support ticket email:', err);
    throw err;
  }
}

/**
 * Fetch user's own support tickets
 */
export async function fetchUserSupportTickets(): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching support tickets:', error);
    throw new Error('Failed to load support tickets');
  }

  return data as SupportTicket[];
}

/**
 * Admin: Fetch all support tickets with filters (uses RPC)
 */
export async function adminFetchSupportTickets(params?: {
  status?: SupportStatus;
  category?: SupportCategory;
  search?: string;
}): Promise<AdminSupportTicket[]> {
  const { data, error } = await supabase.rpc('admin_get_support_tickets', {
    p_status: params?.status || null,
    p_category: params?.category || null,
    p_search: params?.search || null,
  });

  if (error) {
    console.error('Error fetching support tickets:', error);
    throw new Error(error.message || 'Failed to load support tickets');
  }

  // Transform to camelCase for frontend
  return (data || []).map((ticket: any) => ({
    id: ticket.id,
    userId: ticket.user_id,
    name: ticket.name,
    email: ticket.email,
    phone: ticket.phone,
    category: ticket.category,
    subject: ticket.subject,
    message: ticket.message,
    status: ticket.status,
    priority: ticket.priority,
    source: ticket.source,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    lastAdminView: ticket.last_admin_view,
    lastAdminNote: ticket.last_admin_note,
  }));
}

/**
 * Admin: Update support ticket
 */
export async function adminUpdateSupportTicket(
  ticketId: string,
  updates: {
    status?: SupportStatus;
    priority?: SupportPriority | null;
    last_admin_note?: string | null;
  }
): Promise<void> {
  const updateData: any = {
    ...updates,
    last_admin_view: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('support_tickets')
    .update(updateData)
    .eq('id', ticketId);

  if (error) {
    console.error('Error updating support ticket:', error);
    throw new Error('Failed to update support ticket');
  }
}

/**
 * Get category label for display
 */
export function getCategoryLabel(category: SupportCategory): string {
  const labels: Record<SupportCategory, string> = {
    technical: 'Technical Support',
    account: 'Account Support',
    billing: 'Billing',
    feature_request: 'Feature Request',
    feedback: 'Feedback',
  };
  return labels[category];
}

/**
 * Get status label and color for display
 */
export function getStatusInfo(status: SupportStatus): { label: string; color: string } {
  const statusMap: Record<SupportStatus, { label: string; color: string }> = {
    open: { label: 'Open', color: 'blue' },
    in_progress: { label: 'In Progress', color: 'yellow' },
    resolved: { label: 'Resolved', color: 'green' },
    closed: { label: 'Closed', color: 'gray' },
  };
  return statusMap[status];
}
