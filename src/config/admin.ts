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
 * Check if a username has admin privileges
 */
export function isAdmin(username: string | null | undefined): boolean {
  if (!username) return false;
  return ADMIN_USERNAMES.includes(username.toLowerCase());
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
