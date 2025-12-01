/**
 * Signup notification service
 *
 * Triggers admin alert and email notification when new users sign up.
 */

import { createAdminAlert } from './adminAlerts';

export async function notifyAdminOnSignup(userEmail: string, userId?: string): Promise<void> {
  try {
    const timestamp = new Date().toISOString();

    // Log for debugging
    console.log('[Signup Notification Hook]', {
      event: 'new_user_signup',
      email: userEmail,
      userId,
      timestamp,
    });

    // Create admin alert (includes email notification)
    await createAdminAlert({
      type: 'new_user',
      userId,
      title: 'New user registered',
      message: `${userEmail} just created a new GoFlexConnect account.`,
      metadata: { email: userEmail, timestamp },
    });

  } catch (error) {
    // Silent fail - don't break the signup flow
    console.warn('Signup notification error (non-critical):', error);
  }
}
