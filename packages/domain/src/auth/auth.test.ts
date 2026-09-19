import { describe, expect, it } from 'vitest';

import { getUserPermissions, hasPermission } from './permissions';
import { AuthPhoneSchema, FamilyPreferencesSchema, normalizeIndianPhone } from './types';

describe('Auth Domain Logic', () => {
  describe('Phone Normalization and Validation', () => {
    it('normalizes 10-digit Indian numbers to E.164 +91 format', () => {
      expect(normalizeIndianPhone('9876543210')).toBe('+919876543210');
      expect(normalizeIndianPhone(' 9876543210 ')).toBe('+919876543210');
      expect(normalizeIndianPhone('+919876543210')).toBe('+919876543210');
      expect(normalizeIndianPhone('919876543210')).toBe('+919876543210');
    });

    it('validates phone via Zod schema and transforms to +91', () => {
      const result = AuthPhoneSchema.safeParse('9876543210');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('+919876543210');
      }

      const invalid = AuthPhoneSchema.safeParse('12345');
      expect(invalid.success).toBe(false);
    });
  });

  describe('Role-Permission Matrix', () => {
    it('grants customer base e-commerce permissions only', () => {
      expect(hasPermission('customer', 'catalog:browse')).toBe(true);
      expect(hasPermission('customer', 'cart:manage')).toBe(true);
      expect(hasPermission('customer', 'checkout:place_order')).toBe(true);
      expect(hasPermission('customer', 'orders:view_own')).toBe(true);
      expect(hasPermission('customer', 'profile:manage')).toBe(true);
      expect(hasPermission('customer', 'addresses:manage')).toBe(true);
      expect(hasPermission('customer', 'family:manage')).toBe(true);
      expect(hasPermission('customer', 'wishlist:manage')).toBe(true);

      // Should not have admin permissions
      expect(hasPermission('customer', 'orders:view_all')).toBe(false);
      expect(hasPermission('customer', 'inventory:manage')).toBe(false);
      expect(hasPermission('customer', 'brand:manage')).toBe(false);
    });

    it('grants admin operational permissions but restricts governance', () => {
      expect(hasPermission('admin', 'orders:view_all')).toBe(true);
      expect(hasPermission('admin', 'inventory:manage')).toBe(true);
      expect(hasPermission('admin', 'coupons:manage')).toBe(true);
      expect(hasPermission('admin', 'insights:view')).toBe(true);
      expect(hasPermission('admin', 'fulfillment:manage')).toBe(true);

      // Should not have super admin permissions
      expect(hasPermission('admin', 'brand:manage')).toBe(false);
      expect(hasPermission('admin', 'service_control:manage')).toBe(false);
      expect(hasPermission('admin', 'users:manage_roles')).toBe(false);
      expect(hasPermission('admin', 'invoice:manage_templates')).toBe(false);
    });

    it('grants super_admin all permissions without exception', () => {
      const permissions = getUserPermissions('super_admin');
      expect(permissions.length).toBeGreaterThan(15);
      expect(hasPermission('super_admin', 'brand:manage')).toBe(true);
      expect(hasPermission('super_admin', 'service_control:manage')).toBe(true);
      expect(hasPermission('super_admin', 'users:manage_roles')).toBe(true);
      expect(hasPermission('super_admin', 'invoice:manage_templates')).toBe(true);
    });
  });

  describe('Family Preferences Schema Validation', () => {
    it('validates structured family member preferences with sizes and styles', () => {
      const valid = {
        sizes: {
          abaya: 'M',
          hijab: 'Chiffon 70x180',
          ring: '7'
        },
        style: {
          preferredColors: ['Emerald Green', 'Royal Gold', 'Midnight Black'],
          modestyLevel: 'full_coverage'
        },
        notes: 'Prefers breathable organic silk for summer'
      };

      const result = FamilyPreferencesSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sizes?.abaya).toBe('M');
        expect(result.data.style?.preferredColors).toHaveLength(3);
      }
    });

    it('rejects invalid abaya sizes', () => {
      const invalid = {
        sizes: {
          abaya: 'EXTRA_LARGE'
        }
      };
      const result = FamilyPreferencesSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
