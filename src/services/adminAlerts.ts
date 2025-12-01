/**
 * Admin alerts service for system notifications and email alerts
 */

import { supabase } from './supabaseClient';
import { ADMIN_EMAILS } from '../config/admin';

export type AdminAlertType = 'new_user' | 'usage_threshold' | 'bad_survey_quality' | 'test_email';

export interface CreateAdminAlertParams {
  type: AdminAlertType;
  userId?: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface AdminAlert {
  id: string;
  created_at: string;
  user_id: string | null;
  type: AdminAlertType;
  title: string;
  message: string;
  metadata: Record<string, any> | null;
  is_read: boolean;
}

/**
 * Create an admin alert and send email notification
 */
export async function createAdminAlert(params: CreateAdminAlertParams): Promise<void> {
  const { type, userId, title, message, metadata } = params;

  try {
    // Insert alert into database
    const { data, error } = await supabase
      .from('admin_alerts')
      .insert({
        type,
        user_id: userId || null,
        title,
        message,
        metadata: metadata || null,
      })
      .select()
      .single();

    if (error) throw error;

    // Send email notification to admin(s)
    await sendAdminEmailNotification({
      type,
      title,
      message,
      metadata,
    });
  } catch (error) {
    console.error('Failed to create admin alert:', error);
  }
}

/**
 * Get recent admin alerts
 */
export async function getRecentAdminAlerts(params?: {
  limit?: number;
  sinceDays?: number;
  unreadOnly?: boolean;
}): Promise<AdminAlert[]> {
  const { limit = 50, sinceDays = 30, unreadOnly = false } = params || {};

  try {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - sinceDays);

    let query = supabase
      .from('admin_alerts')
      .select('*')
      .gte('created_at', sinceDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []) as AdminAlert[];
  } catch (error) {
    console.error('Failed to get admin alerts:', error);
    return [];
  }
}

/**
 * Mark alerts as read
 */
export async function markAlertsAsRead(alertIds: string[]): Promise<void> {
  try {
    const { error } = await supabase
      .from('admin_alerts')
      .update({ is_read: true })
      .in('id', alertIds);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to mark alerts as read:', error);
  }
}

/**
 * Get count of unread alerts
 */
export async function getUnreadAlertCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('admin_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (error) throw error;

    return count || 0;
  } catch (error) {
    console.error('Failed to get unread alert count:', error);
    return 0;
  }
}

/**
 * Send email notification to admin(s)
 * This is a placeholder - will use existing email infrastructure
 */
async function sendAdminEmailNotification(params: {
  type: AdminAlertType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  const { type, title, message, metadata } = params;

  // Build email subject based on type
  let subject = '[GoFlexConnect] ';
  switch (type) {
    case 'new_user':
      subject += `New user registered: ${metadata?.email || 'Unknown'}`;
      break;
    case 'usage_threshold':
      subject += `Usage warning for ${metadata?.email || 'user'}`;
      break;
    case 'bad_survey_quality':
      subject += 'Survey quality issue detected';
      break;
    default:
      subject += 'System alert';
  }

  // Build email body
  const body = `
${title}

${message}

${metadata ? `\nAdditional Details:\n${JSON.stringify(metadata, null, 2)}` : ''}

---
View full details in the Admin Dashboard:
${window.location.origin}/#/admin
  `.trim();

  // Log for now - TODO: integrate with actual email service
  console.log('[Admin Email Notification]', {
    recipients: ADMIN_EMAILS,
    subject,
    body,
    metadata,
  });

  // TODO: Replace with actual email sending
  // Options:
  // 1. Use existing new-user-notification Edge Function
  // 2. Call SendGrid/Resend/etc API
  // 3. Create new Supabase Edge Function for admin alerts

  /*
  // Example Edge Function call:
  try {
    const { error } = await supabase.functions.invoke('admin-alert-notification', {
      body: {
        recipients: ADMIN_EMAILS,
        subject,
        body,
        metadata,
      },
    });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to send admin email:', error);
  }
  */
}

/**
 * Send a test admin email to verify SMTP and alert routing
 * Attempts to use edge function with aggressive timeout and fallback
 * Returns success status and details
 */
export async function sendAdminTestEmail(params?: {
  triggeredBy?: string;
  userId?: string;
}): Promise<{ success: boolean; message: string; details?: string }> {
  const startTime = Date.now();
  const testId = `test-${Date.now()}`;
  const timestamp = new Date().toISOString();

  try {
    // Aggressive 10-second timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout after 10 seconds')), 10000);
    });

    // Try to invoke edge function
    const invokePromise = supabase.functions.invoke('admin-test-email', {
      body: {
        triggeredBy: params?.triggeredBy || 'Admin Dashboard',
        userId: params?.userId,
      },
    });

    // Race against timeout
    const { data, error } = await Promise.race([invokePromise, timeoutPromise]);

    // Check for invocation errors
    if (error) {
      throw new Error(error.message || 'Edge function invocation failed');
    }

    // Check response data
    if (!data) {
      throw new Error('No response from edge function');
    }

    // Edge function returned error
    if (!data.success) {
      throw new Error(data.message || data.error || 'Email send failed');
    }

    // Success!
    const duration = Date.now() - startTime;

    // Log success
    await supabase.from('admin_alerts').insert({
      type: 'test_email',
      user_id: params?.userId || null,
      title: 'Admin test email sent',
      message: `Test email sent successfully to ${ADMIN_EMAILS.length} admin recipient(s) via ${params?.triggeredBy || 'Admin Dashboard'}.`,
      metadata: {
        testId,
        timestamp,
        recipients: ADMIN_EMAILS,
        triggeredBy: params?.triggeredBy || 'Admin Dashboard',
        duration,
        success: true,
      },
    });

    return {
      success: true,
      message: `Test email sent successfully to ${ADMIN_EMAILS.length} admin recipient(s)`,
      details: `Completed in ${duration}ms`,
    };
  } catch (error) {
    console.error('[sendAdminTestEmail] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const duration = Date.now() - startTime;

    // Always log failure
    try {
      await supabase.from('admin_alerts').insert({
        type: 'test_email',
        user_id: params?.userId || null,
        title: 'Admin test email FAILED',
        message: `Test email failed: ${errorMessage}`,
        metadata: {
          testId,
          timestamp,
          recipients: ADMIN_EMAILS,
          triggeredBy: params?.triggeredBy || 'Admin Dashboard',
          error: errorMessage,
          duration,
          success: false,
        },
      });
    } catch (logError) {
      console.error('[sendAdminTestEmail] Failed to log error:', logError);
    }

    return {
      success: false,
      message: errorMessage,
      details: `Failed after ${duration}ms`,
    };
  }
}
