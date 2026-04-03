// ============================================================================
// ADMIN CONFIGURATION
// ============================================================================
// Centralized admin user management and permissions
// ============================================================================

/**
 * List of admin usernames who can access admin panels
 * Add or remove usernames as needed
 */
export const ADMIN_USERNAMES = [
  'admin',
  'eyedeaz',
  // Add more admin usernames here
  // 'charbel',
  // 'manager',
];

/**
 * List of admin emails who can access admin panels
 * Add or remove emails as needed
 */
export const ADMIN_EMAILS = [
  'albasma12182@gmail.com',
  // Add more admin emails here
  // 'another@email.com',
];

/**
 * Check if a username has admin privileges
 */
export function isAdmin(username: string | null | undefined): boolean {
  if (!username) return false;
  return ADMIN_USERNAMES.includes(username.toLowerCase());
}

/**
 * Check if an email has admin privileges
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Check if user is admin (by username OR email)
 */
export function checkIsAdmin(username: string | null | undefined, email: string | null | undefined): boolean {
  return isAdmin(username) || isAdminEmail(email);
}

/**
 * Admin panel routes
 */
export const ADMIN_ROUTES = {
  MAIN: '/admin',
  NFC_ORDERS: '/admin/nfc',
} as const;

/**
 * Admin permissions (for future role-based access)
 */
export enum AdminPermission {
  VIEW_PAYMENTS = 'view_payments',
  APPROVE_PAYMENTS = 'approve_payments',
  MANAGE_ORDERS = 'manage_orders',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_USERS = 'manage_users',
  MANAGE_PRODUCTS = 'manage_products',
}

/**
 * Check if user has specific permission (currently all admins have all permissions)
 * Can be extended for role-based access control
 */
export function hasPermission(
  username: string | null | undefined,
  permission: AdminPermission
): boolean {
  return isAdmin(username);
}
