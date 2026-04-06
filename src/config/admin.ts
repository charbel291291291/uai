import type { UserProfile } from '../types';

type AuthLikeUser = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
  app_metadata?: Record<string, unknown> | null;
} | null | undefined;

export const ADMIN_ROUTES = {
  MAIN: '/admin',
  PRODUCTS: '/admin',
  ORDERS: '/admin/orders',
  PAYMENTS: '/admin/payments',
  NFC_ORDERS: '/admin/nfc',
} as const;

export enum AdminPermission {
  VIEW_PAYMENTS = 'view_payments',
  APPROVE_PAYMENTS = 'approve_payments',
  MANAGE_ORDERS = 'manage_orders',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_USERS = 'manage_users',
  MANAGE_PRODUCTS = 'manage_products',
}

function getRoleFromUser(user: AuthLikeUser): string | null {
  // Only trust app_metadata — it is server-writable only (Supabase service role).
  // user_metadata is user-writable via updateUser() and MUST NOT be used for auth.
  const appRole = user?.app_metadata?.role;
  if (typeof appRole === 'string') return appRole.toLowerCase();
  return null;
}

export function getAdminRole(profile?: UserProfile | null, user?: AuthLikeUser): string {
  const profileRole = typeof profile?.role === 'string' ? profile.role.toLowerCase() : null;
  return profileRole || getRoleFromUser(user) || 'user';
}

export function hasAdminAccess(profile?: UserProfile | null, user?: AuthLikeUser): boolean {
  return getAdminRole(profile, user) === 'admin';
}

export function hasPermission(
  profile: UserProfile | null | undefined,
  user: AuthLikeUser,
  _permission: AdminPermission,
): boolean {
  return hasAdminAccess(profile, user);
}
