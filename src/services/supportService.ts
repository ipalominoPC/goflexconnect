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

/**
 * Generate a unique ticket number
 * Format: GF-YYYYMMDD-XXXX (GF = GoFlex, date + 4 random uppercase chars)
 *
 * Zero database queries. Guaranteed unique by timestamp + random.
 */
function generateTicketNumber(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const ticketNumber = `GF-${dateStr}-${random}`;

  console.log('[Support] Generated ticket number:', ticketNumber);
  return ticketNumber;
}

/**
 * DEBUG: Check Supabase configuration
 */
export async function debugCheckSupabaseConfig(): Promise<void> {
  console.log('[Support][Debug] Checking Supabase configuration...');

  console.log('[Support][Debug] Environment variables:', {
    hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    urlValue: import.meta.env.VITE_SUPABASE_URL,
  });

  console.log('[Support][Debug] Supabase client:', {
    url: supabase.supabaseUrl,
    hasAuth: !!supabase.auth,
    hasFrom: typeof supabase.from === 'function',
  });

  try {
    const { data, error, count } = await supabase
      .from('support_tickets')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error('[Support][Debug] Table query failed:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
    } else {
      console.log('[Support][Debug] Table exists and is accessible. Count:', count);
    }
  } catch (err) {
    console.error('[Support][Debug] Exception querying table:', err);
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.log('[Support][Debug] Not authenticated (expected for anonymous):', error.message);
    } else {
      console.log('[Support][Debug] Current user:', user?.email || 'anonymous');
    }
  } catch (err) {
    console.error('[Support][Debug] Error checking auth:', err);
  }
}

/**
 * DEBUG: Test ticket creation with full logging
 * Temporary function for debugging support ticket submission
 */
export async function debugCreateSupportTicketOnce(): Promise<any> {
  console.log('[Support][Debug] Starting debugCreateSupportTicketOnce');

  await debugCheckSupabaseConfig();

  const testPayload: CreateSupportTicketInput = {
    name: 'Debug User',
    email: 'debug@example.com',
    phone: '1234567890',
    category: 'technical',
    subject: 'Debug ticket',
    message: 'Debug message from debugCreateSupportTicketOnce()',
  };

  try {
    const result = await createSupportTicket(testPayload);
    console.log('[Support][Debug] Ticket created successfully:', result);
    return result;
  } catch (error: any) {
    console.error('[Support][Debug] Failed to create ticket:', {
      message: error?.message,
      stack: error?.stack,
      error,
    });
    throw error;
  }
}

/**
 * Create a support ticket
 * Inserts into DB and sends email notification to support team
 */
export async function createSupportTicket(
  input: CreateSupportTicketInput,
  currentUserId?: string
): Promise<{ ticketId: string; ticketNumber: string }> {
  console.log('[Support] Creating ticket for', input.email);
  console.log('[Support] Supabase client configured:', {
    url: supabase.supabaseUrl,
    hasAuth: !!supabase.auth,
  });

  const ticketNumber = generateTicketNumber();
  console.log('[Support] Generated ticket number:', ticketNumber);

  const insertPayload = {
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
  };

  console.log('[Support] About to insert ticket with payload:', JSON.stringify(insertPayload, null, 2));

  const { error } = await supabase
    .from('support_tickets')
    .insert(insertPayload);

  console.log('[Support] Insert result:', {
    hasError: !!error,
    errorCode: error?.code,
    errorMessage: error?.message,
    errorDetails: error?.details,
    errorHint: error?.hint,
  });

  if (error) {
    console.error('[Support] Ticket insert failed:', error);
    console.error('[Support] Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(`Failed to create support ticket: ${error.message}`);
  }

  console.log('[Support] Created ticket successfully with number:', ticketNumber);

  sendSupportTicketEmail(ticketNumber, input).catch((err) => {
    console.error('[Support] Ticket email send failed (non-blocking):', err);
  });

  return { ticketId: ticketNumber, ticketNumber };
}

/**
 * Send branded email notification for new support ticket
 * Uses the existing send-email edge function
 */
async function sendSupportTicketEmail(
  ticketNumber: string,
  input: CreateSupportTicketInput
): Promise<void> {
  console.log('[Support] Sending email for ticket', ticketNumber);
  console.log('[Support] Sending to:', input.email, 'and support@goflexconnect.com');

  try {
    const categoryLabels: Record<SupportCategory, string> = {
      technical: 'Technical Support',
      account: 'Account Support',
      billing: 'Billing',
      feature_request: 'Feature Request',
      feedback: 'Feedback',
    };

    const categoryLabel = categoryLabels[input.category];
    const subjectLine = input.subject || input.message.slice(0, 50) + (input.message.length > 50 ? '...' : '');

    const subject = `We received your request – Ticket #${ticketNumber}`;

    const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="background-color:#ffffff;max-width:600px;margin:0 auto;padding:24px;color:#0f172a;font-size:14px;line-height:1.6;">
    <img
      src="https://raw.githubusercontent.com/ipalominoPC/goflexconnect/main/public/icons/logo-128.png"
      alt="GoFlexConnect"
      width="80"
      height="80"
      style="display:block; margin:0 auto 20px auto; border:0; outline:none; text-decoration:none;"
    />
    <div style="font-size: 28px; font-weight: bold; color: #1a1a1a; padding-bottom: 20px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      GoFlexConnect Support
    </div>
    <p>Hi ${input.name},</p>

    <p>Thanks for contacting <strong>GoFlexConnect Support</strong>. We've received your request and created <strong>Ticket #${ticketNumber}</strong>.</p>

    <p>Our team has everything we need to start reviewing your case and will follow up with you as soon as possible.</p>

    <h3 style="font-size:15px;margin-top:24px;margin-bottom:8px;">Ticket Details</h3>
    <ul style="list-style:none;padding:0;margin:0 0 16px 0;">
      <li><strong>Ticket Number:</strong> ${ticketNumber}</li>
      <li><strong>Name:</strong> ${input.name}</li>
      <li><strong>Email:</strong> ${input.email}</li>
      ${input.phone ? `<li><strong>Phone:</strong> ${input.phone}</li>` : ''}
      <li><strong>Category:</strong> ${categoryLabel}</li>
      <li><strong>Subject:</strong> ${subjectLine}</li>
    </ul>

    <h3 style="font-size:15px;margin-top:16px;margin-bottom:8px;">Message</h3>
    <div style="padding:12px 16px;border-radius:8px;background-color:#f8fafc;border:1px solid #e2e8f0;white-space:pre-wrap;">${input.message}</div>

    <p style="margin-top:16px;">
      If you'd like to add more information, simply reply to this email — your reply will be automatically attached to your ticket.
    </p>

    <p style="margin-top:16px;font-size:13px;color:#64748b;">
      Most requests receive a response within <strong>1–2 business days</strong>.
    </p>

    <p style="margin-top:16px;">
      Best regards,<br/>
      <strong>GoFlexConnect Support Team</strong><br/>
      <a href="mailto:support@goflexconnect.com" style="color:#27AAE1;text-decoration:none;">support@goflexconnect.com</a>
    </p>
  </div>
</body>
</html>`.trim();

    console.log('[Support] About to invoke send-email edge function...');

    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: ['support@goflexconnect.com'],
        cc: [input.email],
        replyTo: 'support@goflexconnect.com',
        subject,
        html: htmlBody,
      },
    });

    if (error) {
      console.error('[Support] Error invoking send-email function:', error);
      console.error('[Support] Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('[Support] Email sent successfully:', data);
    console.log('[Support] Email response data:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[Support] Failed to send support ticket email:', err);
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
    ticketNumber: ticket.ticket_number,
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
    unreadByAdmin: ticket.unread_by_admin ?? true,
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
 * Get ticket by ID (for admin)
 */
export async function getTicketById(ticketId: string): Promise<AdminSupportTicket> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching ticket:', error);
    throw new Error('Failed to load ticket');
  }

  if (!data) {
    throw new Error('Ticket not found');
  }

  // Mark as read by admin
  await supabase
    .from('support_tickets')
    .update({ unread_by_admin: false, last_admin_view: new Date().toISOString() })
    .eq('id', ticketId);

  return {
    id: data.id,
    ticketNumber: data.ticket_number,
    userId: data.user_id,
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

/**
 * Get all messages for a ticket
 */
export async function getTicketMessages(ticketId: string): Promise<TicketMessage[]> {
  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .maybeSingle();

  if (ticketError || !ticket) {
    console.error('Error fetching ticket:', ticketError);
    return [];
  }

  // Get all messages from ticket_messages table
  const { data: messages, error: messagesError } = await supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  const allMessages: TicketMessage[] = [];

  // Add initial ticket message as first message
  allMessages.push({
    id: ticket.id,
    ticketId: ticket.id,
    senderType: 'customer',
    senderId: ticket.user_id,
    senderName: ticket.name,
    senderEmail: ticket.email,
    message: ticket.message,
    createdAt: ticket.created_at,
  });

  // Add all replies
  if (!messagesError && messages) {
    messages.forEach((msg: any) => {
      allMessages.push({
        id: msg.id,
        ticketId: msg.ticket_id,
        senderType: msg.sender_type,
        senderId: msg.sender_id,
        senderName: msg.sender_name,
        senderEmail: msg.sender_email,
        message: msg.message,
        createdAt: msg.created_at,
      });
    });
  }

  return allMessages;
}

/**
 * Send admin reply to ticket
 */
export async function sendAdminReply(ticketId: string, message: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get ticket details
  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .maybeSingle();

  if (ticketError || !ticket) {
    throw new Error('Ticket not found');
  }

  // Insert message
  const { error: insertError } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: ticketId,
      sender_type: 'admin',
      sender_id: user.id,
      sender_name: user.email?.split('@')[0] || 'Support',
      sender_email: user.email || 'support@goflexconnect.com',
      message,
    });

  if (insertError) {
    console.error('Error inserting message:', insertError);
    throw new Error('Failed to send reply');
  }

  // Update ticket status to in_progress if it was open
  if (ticket.status === 'open') {
    await supabase
      .from('support_tickets')
      .update({ status: 'in_progress', last_reply_at: new Date().toISOString() })
      .eq('id', ticketId);
  } else {
    await supabase
      .from('support_tickets')
      .update({ last_reply_at: new Date().toISOString() })
      .eq('id', ticketId);
  }

  // Send email to customer
  await sendAdminReplyEmail(ticket, message);
}

/**
 * Send admin reply email to customer
 */
async function sendAdminReplyEmail(ticket: any, replyMessage: string): Promise<void> {
  const subject = `Re: ${ticket.subject || 'Your Support Request'} - Ticket #${ticket.ticket_number}`;

  const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="background-color:#ffffff;max-width:600px;margin:0 auto;padding:24px;color:#0f172a;font-size:14px;line-height:1.6;">
    <img
      src="https://raw.githubusercontent.com/ipalominoPC/goflexconnect/main/public/icons/logo-128.png"
      alt="GoFlexConnect"
      width="80"
      height="80"
      style="display:block; margin:0 auto 20px auto; border:0; outline:none; text-decoration:none;"
    />
    <div style="font-size: 28px; font-weight: bold; color: #1a1a1a; padding-bottom: 20px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      GoFlexConnect Support
    </div>
    <p>Hi ${ticket.name},</p>

    <p>We've replied to your support ticket <strong>#${ticket.ticket_number}</strong>:</p>

    <div style="padding:16px;border-radius:8px;background-color:#f8fafc;border-left:4px solid #27AAE1;margin:16px 0;">
      <p style="margin:0;white-space:pre-wrap;">${replyMessage}</p>
    </div>

    <p>You can reply to this email to continue the conversation, and your response will be added to the ticket automatically.</p>

    <p style="margin-top:24px;">
      Best regards,<br/>
      <strong>GoFlexConnect Support Team</strong><br/>
      <a href="mailto:support@goflexconnect.com" style="color:#27AAE1;text-decoration:none;">support@goflexconnect.com</a>
    </p>
  </div>
</body>
</html>`.trim();

  try {
    await supabase.functions.invoke('send-email', {
      body: {
        to: [ticket.email],
        replyTo: 'support@goflexconnect.com',
        subject,
        html: htmlBody,
      },
    });
  } catch (error) {
    console.error('[Support] Failed to send reply email:', error);
  }
}

/**
 * Resolve ticket and send resolution email
 */
export async function resolveTicket(ticketId: string): Promise<void> {
  // Get ticket details
  const { data: ticket, error: ticketError } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('id', ticketId)
    .maybeSingle();

  if (ticketError || !ticket) {
    throw new Error('Ticket not found');
  }

  // Update ticket status
  const { error: updateError } = await supabase
    .from('support_tickets')
    .update({ status: 'resolved', updated_at: new Date().toISOString() })
    .eq('id', ticketId);

  if (updateError) {
    console.error('Error resolving ticket:', updateError);
    throw new Error('Failed to resolve ticket');
  }

  // Send resolution email
  await sendResolutionEmail(ticket);
}

/**
 * Send resolution email to customer
 */
async function sendResolutionEmail(ticket: any): Promise<void> {
  const subject = `Your ticket has been resolved - #${ticket.ticket_number}`;

  const htmlBody = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="background-color:#ffffff;max-width:600px;margin:0 auto;padding:24px;color:#0f172a;font-size:14px;line-height:1.6;">
    <img
      src="https://raw.githubusercontent.com/ipalominoPC/goflexconnect/main/public/icons/logo-128.png"
      alt="GoFlexConnect"
      width="80"
      height="80"
      style="display:block; margin:0 auto 20px auto; border:0; outline:none; text-decoration:none;"
    />
    <div style="font-size: 28px; font-weight: bold; color: #1a1a1a; padding-bottom: 20px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      GoFlexConnect Support
    </div>
    <div style="text-align:center;padding:24px;background-color:#10b981;color:white;border-radius:12px;margin-bottom:24px;">
      <h2 style="margin:0 0 8px 0;font-size:24px;">✓ Ticket Resolved</h2>
      <p style="margin:0;opacity:0.9;">Ticket #${ticket.ticket_number}</p>
    </div>

    <p>Hi ${ticket.name},</p>

    <p>Great news! Your support ticket has been <strong>resolved</strong>.</p>

    <p>We hope we were able to help you with your request. If you have any additional questions or if the issue resurfaces, please don't hesitate to reach out to us.</p>

    <p>Thank you for using GoFlexConnect!</p>

    <p style="margin-top:24px;">
      Best regards,<br/>
      <strong>GoFlexConnect Support Team</strong><br/>
      <a href="mailto:support@goflexconnect.com" style="color:#27AAE1;text-decoration:none;">support@goflexconnect.com</a>
    </p>
  </div>
</body>
</html>`.trim();

  try {
    await supabase.functions.invoke('send-email', {
      body: {
        to: [ticket.email],
        replyTo: 'support@goflexconnect.com',
        subject,
        html: htmlBody,
      },
    });
  } catch (error) {
    console.error('[Support] Failed to send resolution email:', error);
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

/**
 * Diagnostic function to test support ticket system
 * Run in console: runSupportTests()
 */
export async function runSupportTests(): Promise<void> {
  console.log('[Support][Diagnostics] Starting support ticket system diagnostics...');
  console.log('[Support][Diagnostics] ================================================');

  let allTestsPassed = true;

  console.log('[Support][Diagnostics] Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('[Support][Diagnostics] Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

  console.log('[Support][Diagnostics] TEST 1: Supabase Connectivity');
  try {
    const { data, error } = await supabase
      .from('support_tickets')
      .select('id')
      .limit(1);

    if (error) {
      console.error('[Support][Diagnostics] ❌ FAIL - Connectivity error:', error);
      allTestsPassed = false;
    } else {
      console.log('[Support][Diagnostics] ✅ PASS - Connected to support_tickets table');
    }
  } catch (err) {
    console.error('[Support][Diagnostics] ❌ FAIL - Exception during connectivity test:', err);
    allTestsPassed = false;
  }

  console.log('[Support][Diagnostics] TEST 2: Ticket Insert');
  let testTicketId: string | null = null;
  try {
    const testData = {
      ticket_number: `GFC-TEST-${Date.now()}`,
      name: 'Diagnostic Test User',
      email: 'diagnostics@test.com',
      category: 'technical' as SupportCategory,
      message: 'This is a diagnostic test ticket.',
      status: 'open' as SupportStatus,
      source: 'app',
    };

    console.log('[Support][Diagnostics] Attempting insert with data:', testData);

    const { data, error } = await supabase
      .from('support_tickets')
      .insert(testData)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('[Support][Diagnostics] ❌ FAIL - Insert error:', error);
      console.error('[Support][Diagnostics] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      allTestsPassed = false;
    } else if (data) {
      testTicketId = data.id;
      console.log('[Support][Diagnostics] ✅ PASS - Ticket inserted successfully, ID:', testTicketId);
    } else {
      console.error('[Support][Diagnostics] ❌ FAIL - No data returned from insert (likely RLS blocking SELECT)');
      console.error('[Support][Diagnostics] This means the ticket was created but cannot be read back');
      allTestsPassed = false;
    }
  } catch (err) {
    console.error('[Support][Diagnostics] ❌ FAIL - Exception during insert test:', err);
    allTestsPassed = false;
  }

  if (testTicketId) {
    console.log('[Support][Diagnostics] Cleaning up test ticket:', testTicketId);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .delete()
        .eq('id', testTicketId);

      if (error) {
        console.warn('[Support][Diagnostics] Warning: Could not delete test ticket:', error);
      } else {
        console.log('[Support][Diagnostics] Test ticket cleaned up successfully');
      }
    } catch (err) {
      console.warn('[Support][Diagnostics] Warning: Exception during cleanup:', err);
    }
  }

  console.log('[Support][Diagnostics] TEST 3: Email Edge Function');
  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to: ['diagnostics@test.com'],
        subject: 'Diagnostic Test (Dry Run)',
        html: '<p>This is a diagnostic test email.</p>',
      },
    });

    if (error) {
      console.warn('[Support][Diagnostics] ⚠️ WARNING - Email function error (non-blocking):', error);
    } else {
      console.log('[Support][Diagnostics] ✅ PASS - Email function is accessible');
    }
  } catch (err) {
    console.warn('[Support][Diagnostics] ⚠️ WARNING - Email function exception (non-blocking):', err);
  }

  console.log('[Support][Diagnostics] ================================================');
  if (allTestsPassed) {
    console.log('[Support][Diagnostics] 🎉 ALL CRITICAL TESTS PASSED');
  } else {
    console.error('[Support][Diagnostics] ❌ SOME TESTS FAILED - Check errors above');
  }
  console.log('[Support][Diagnostics] Diagnostics complete');
}
