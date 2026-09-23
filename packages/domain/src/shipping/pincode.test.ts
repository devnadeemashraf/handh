import { describe, expect, it } from 'vitest';

import {
  estimateTransitDays,
  getPostalCodeRegion,
  isPostalCodeServiceable,
  validateIndianPostalCode
} from './pincode';

describe('Indian Postal Code Engine (E-COM-063)', () => {
  describe('validateIndianPostalCode', () => {
    it('accepts valid 6-digit Indian PIN codes', () => {
      expect(validateIndianPostalCode('500034').valid).toBe(true);
      expect(validateIndianPostalCode('560001').valid).toBe(true);
      expect(validateIndianPostalCode('110001').valid).toBe(true);
    });

    it('rejects empty or whitespace PIN codes', () => {
      expect(validateIndianPostalCode('').valid).toBe(false);
      expect(validateIndianPostalCode('   ').valid).toBe(false);
    });

    it('rejects PIN codes that do not have 6 digits', () => {
      expect(validateIndianPostalCode('50003').valid).toBe(false);
      expect(validateIndianPostalCode('5000341').valid).toBe(false);
    });

    it('rejects PIN codes starting with 0', () => {
      const res = validateIndianPostalCode('012345');
      expect(res.valid).toBe(false);
      expect(res.error).toContain('cannot begin with 0');
    });

    it('normalizes formatted PIN codes with spaces or hyphens', () => {
      const res = validateIndianPostalCode('500 034');
      expect(res.valid).toBe(true);
      expect(res.normalized).toBe('500034');
    });
  });

  describe('getPostalCodeRegion', () => {
    it('correctly maps 2-digit prefixes to states and zones', () => {
      expect(getPostalCodeRegion('110001')).toEqual({ state: 'Delhi', zone: 1 });
      expect(getPostalCodeRegion('201301')).toEqual({ state: 'Uttar Pradesh', zone: 2 });
      expect(getPostalCodeRegion('302001')).toEqual({ state: 'Rajasthan', zone: 3 });
      expect(getPostalCodeRegion('400001')).toEqual({ state: 'Maharashtra', zone: 4 });
      expect(getPostalCodeRegion('500034')).toEqual({ state: 'Telangana', zone: 5 });
      expect(getPostalCodeRegion('560001')).toEqual({ state: 'Karnataka', zone: 5 });
      expect(getPostalCodeRegion('600001')).toEqual({ state: 'Tamil Nadu', zone: 6 });
      expect(getPostalCodeRegion('700001')).toEqual({ state: 'West Bengal', zone: 7 });
      expect(getPostalCodeRegion('800001')).toEqual({ state: 'Bihar', zone: 8 });
      expect(getPostalCodeRegion('900001')).toEqual({
        state: 'Army Postal Service (APS)',
        zone: 9
      });
    });

    it('returns null for invalid PIN codes', () => {
      expect(getPostalCodeRegion('012345')).toBeNull();
      expect(getPostalCodeRegion('ABCDEF')).toBeNull();
    });
  });

  describe('isPostalCodeServiceable', () => {
    it('marks standard civilian postal codes as serviceable', () => {
      expect(isPostalCodeServiceable('500034')).toBe(true);
      expect(isPostalCodeServiceable('560001')).toBe(true);
      expect(isPostalCodeServiceable('400001')).toBe(true);
      expect(isPostalCodeServiceable('110001')).toBe(true);
    });

    it('blocks military Army Postal Service (APS) zone 9 PIN codes', () => {
      expect(isPostalCodeServiceable('900001')).toBe(false);
      expect(isPostalCodeServiceable('999999')).toBe(false);
    });

    it('blocks explicit unserviceable remote codes (E-COM-063 audit case)', () => {
      expect(isPostalCodeServiceable('790001')).toBe(false);
      expect(isPostalCodeServiceable('790002')).toBe(false);
    });

    it('honors custom unserviceable list', () => {
      expect(isPostalCodeServiceable('500034', { unserviceableList: ['500034'] })).toBe(false);
    });
  });

  describe('estimateTransitDays', () => {
    it('estimates 1-2 days for local Hyderabad delivery', () => {
      const transit = estimateTransitDays('500001');
      expect(transit.minDays).toBe(1);
      expect(transit.maxDays).toBe(2);
    });

    it('estimates 2-3 days for regional South delivery (AP/KA)', () => {
      const transit = estimateTransitDays('560001');
      expect(transit.minDays).toBe(2);
      expect(transit.maxDays).toBe(3);
    });

    it('estimates 2-4 days for West & South metro delivery (MH/TN)', () => {
      const transit = estimateTransitDays('400001');
      expect(transit.minDays).toBe(2);
      expect(transit.maxDays).toBe(4);
    });

    it('estimates 3-6 days for North & East India delivery', () => {
      const transit = estimateTransitDays('110001');
      expect(transit.minDays).toBe(3);
      expect(transit.maxDays).toBe(6);
    });

    it('estimates 5-8 days for remote North-East delivery', () => {
      const transit = estimateTransitDays('790003');
      expect(transit.minDays).toBe(5);
      expect(transit.maxDays).toBe(8);
    });
  });
});
