/**
 * Admin access control configuration
 *
 * SECURITY: Only users with emails in this list can access the Admin Dashboard
 * and view sensitive data like session events and user activity logs.
 */

export const ADMIN_EMAILS = [
  'ipalomino@gmail.com',
  'isaac@goflexconnect.com',
  'dev@goflexconnect.com',
];

/**
 * Check if a given email is authorized as an admin
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
