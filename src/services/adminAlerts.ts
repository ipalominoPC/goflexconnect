import { supabase } from './supabaseClient';
import { ADMIN_EMAILS } from '../config/admin';

export type AdminAlertType = 'new_user' | 'usage_threshold' | 'bad_survey_quality' | 'test_email';

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

export async function createAdminAlert(params: { type: AdminAlertType; title: string; message: string; metadata?: any }) {
  try {
    await supabase.from('admin_alerts').insert({
      type: params.type,
      title: params.title,
      message: params.message,
      metadata: params.metadata || {}
    });
  } catch (e) { console.error('Alert logging failed', e); }
}

export async function getRecentAdminAlerts(params?: { limit?: number }) {
  const { data } = await supabase.from('admin_alerts').select('*').order('created_at', { ascending: false }).limit(params?.limit || 10);
  return (data || []) as AdminAlert[];
}

export async function sendAdminTestEmail(params?: { triggeredBy?: string }): Promise<{ success: boolean; message: string }> {
  try {
    console.log('[Mission Control] Pinging Edge Function...');
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: ADMIN_EMAILS,
        subject: `[GFC] Mission Control Uplink Verified`,
        html: `<div style="padding:20px; border:2px solid #27AAE1; border-radius:15px; font-family:sans-serif;">
                <h2 style="color:#27AAE1;">Uplink Success</h2>
                <p>Mission Control is now connected to the SMTP bridge.</p>
                <p><strong>Device:</strong> ${params?.triggeredBy || 'S24-Hardware'}</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
               </div>`
      },
    });

    if (error) {
      console.error('[Mission Control] Invocation Error:', error);
      throw new Error(`Cloud Reject: ${error.message || 'Check Supabase Logs'}`);
    }

    await createAdminAlert({
      type: 'test_email',
      title: 'Uplink Success',
      message: `Successfully reached ${ADMIN_EMAILS.length} admin(s).`,
      metadata: { success: true }
    });

    return { success: true, message: 'Uplink Successful' };
  } catch (error: any) {
    const errMsg = error.message || 'Connection Timed Out';
    await createAdminAlert({
      type: 'test_email',
      title: 'Uplink Failed',
      message: errMsg,
      metadata: { success: false, error: errMsg }
    });
    return { success: false, message: errMsg };
  }
}
