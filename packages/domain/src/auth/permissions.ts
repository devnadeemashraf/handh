import type { Permission, UserRole } from './types';

const CUSTOMER_PERMISSIONS: readonly Permission[] = [
  'catalog:browse',
  'cart:manage',
  'checkout:place_order',
  'orders:view_own',
  'profile:manage',
  'addresses:manage',
  'family:manage',
  'wishlist:manage'
] as const;

const ADMIN_PERMISSIONS: readonly Permission[] = [
  ...CUSTOMER_PERMISSIONS,
  'orders:view_all',
  'orders:manage',
  'inventory:manage',
  'products:manage',
  'coupons:manage',
  'insights:view',
  'fulfillment:manage'
] as const;

const SUPER_ADMIN_PERMISSIONS: readonly Permission[] = [
  ...ADMIN_PERMISSIONS,
  'brand:manage',
  'service_control:manage',
  'users:manage_roles',
  'invoice:manage_templates',
  'compliance:manage',
  'audit_logs:view'
] as const;

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  customer: CUSTOMER_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  super_admin: SUPER_ADMIN_PERMISSIONS
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

export function getUserPermissions(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}
