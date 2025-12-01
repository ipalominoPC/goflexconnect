import { supabase } from './supabaseClient';

export type SessionEventType = 'sign_in' | 'sign_out' | 'project_open';

interface LogSessionEventParams {
  eventType: SessionEventType;
  metadata?: Record<string, any>;
}

export async function logSessionEvent(params: LogSessionEventParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return;
    }

    const deviceInfo = typeof navigator !== 'undefined'
      ? `${navigator.platform} | ${navigator.userAgent.substring(0, 200)}`
      : 'Unknown';

    await supabase.from('session_events').insert({
      user_id: user.id,
      event_type: params.eventType,
      device_info: deviceInfo,
      metadata: params.metadata || null,
    });

  } catch (error) {
    console.warn('Session tracking failed (non-critical):', error);
  }
}
