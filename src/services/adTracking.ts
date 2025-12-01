/**
 * Ad tracking service for logging impressions and clicks
 * Fails silently to avoid disrupting user experience
 */

import { supabase } from './supabaseClient';
import { AdPlacement } from './ads';

/**
 * Log an ad impression event
 * @param adId - The ID of the ad being shown
 * @param placement - Where the ad is being displayed
 */
export async function logAdImpression(adId: string, placement: AdPlacement): Promise<void> {
  try {
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;

    // Get user agent
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;

    // Insert impression event
    const { error } = await supabase
      .from('ad_events')
      .insert({
        user_id: userId,
        ad_id: adId,
        placement: placement,
        event_type: 'impression',
        user_agent: userAgent,
        client_ip: null, // Could be populated by edge function in future
      });

    if (error) {
      console.warn('[AdTracking] Failed to log impression:', error.message);
    }
  } catch (err) {
    // Fail silently - don't break UI
    console.warn('[AdTracking] Error logging impression:', err);
  }
}

/**
 * Log an ad click event
 * @param adId - The ID of the ad being clicked
 * @param placement - Where the ad is displayed
 */
export async function logAdClick(adId: string, placement: AdPlacement): Promise<void> {
  try {
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;

    // Get user agent
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;

    // Insert click event
    const { error } = await supabase
      .from('ad_events')
      .insert({
        user_id: userId,
        ad_id: adId,
        placement: placement,
        event_type: 'click',
        user_agent: userAgent,
        client_ip: null, // Could be populated by edge function in future
      });

    if (error) {
      console.warn('[AdTracking] Failed to log click:', error.message);
    }
  } catch (err) {
    // Fail silently - don't break UI
    console.warn('[AdTracking] Error logging click:', err);
  }
}
