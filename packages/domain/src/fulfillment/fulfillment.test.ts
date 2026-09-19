import { describe, it, expect } from 'vitest';
import {
  resolveCourierTrackingUrl,
  isAllowlistedCourierUrl,
  generateTrackingReference,
  CreateFulfillmentRequestSchema,
  canTransitionFulfillment,
  assertCanTransitionFulfillment,
  InvalidStateTransitionError
} from '../index';

describe('Fulfillment Domain', () => {
  describe('resolveCourierTrackingUrl', () => {
    it('generates accurate tracking URLs for DTDC with encoded AWB', () => {
      const url = resolveCourierTrackingUrl('dtdc', 'D12345678');
      expect(url).toBe(
        'https://www.dtdc.in/tracking/shipment-tracking.asp?search_type=AWB&strTrackingNo=D12345678'
      );
    });

    it('generates accurate tracking URLs for Delhivery with encoded AWB', () => {
      const url = resolveCourierTrackingUrl('delhivery', 'DLV 987 654');
      expect(url).toBe('https://www.delhivery.com/track/package/DLV%20987%20654');
    });

    it('generates accurate tracking URLs for Blue Dart with encoded AWB', () => {
      const url = resolveCourierTrackingUrl('bluedart', 'BLU999');
      expect(url).toBe('https://www.bluedart.com/tracking?trackFor=0&trackNo=BLU999');
    });

    it('returns official India Post consignment portal for India Post', () => {
      const url = resolveCourierTrackingUrl('india_post', 'EM123456789IN');
      expect(url).toBe(
        'https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx'
      );
    });

    it('returns null for other or custom local couriers', () => {
      const url = resolveCourierTrackingUrl('other', 'LOCAL-123');
      expect(url).toBeNull();
    });
  });

  describe('isAllowlistedCourierUrl (Open-Redirect Guard)', () => {
    it('accepts legitimate courier domains and subdomains', () => {
      expect(
        isAllowlistedCourierUrl(
          'https://www.dtdc.in/tracking/shipment-tracking.asp?search_type=AWB&strTrackingNo=D123'
        )
      ).toBe(true);
      expect(isAllowlistedCourierUrl('https://www.delhivery.com/track/package/123')).toBe(true);
      expect(isAllowlistedCourierUrl('https://tracking.dtdc.com/view/123')).toBe(true);
      expect(
        isAllowlistedCourierUrl(
          'https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx'
        )
      ).toBe(true);
    });

    it('strictly rejects unauthorized or phishing domains', () => {
      expect(isAllowlistedCourierUrl('https://evil-phishing.com/tracking')).toBe(false);
      expect(isAllowlistedCourierUrl('https://dtdc.in.attacker.org/tracking')).toBe(false);
      expect(isAllowlistedCourierUrl('javascript:alert(1)')).toBe(false);
      expect(isAllowlistedCourierUrl('not-a-valid-url')).toBe(false);
    });
  });

  describe('generateTrackingReference', () => {
    it('generates reference matching TRK-YYYY-XXXXX format', () => {
      const ref = generateTrackingReference();
      const currentYear = new Date().getFullYear();
      const regex = new RegExp(`^TRK-${currentYear}-[A-Z0-9]{5}$`);
      expect(ref).toMatch(regex);
    });
  });

  describe('CreateFulfillmentRequestSchema', () => {
    it('validates a valid fulfillment request', () => {
      const result = CreateFulfillmentRequestSchema.safeParse({
        orderId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        courierProvider: 'dtdc',
        trackingNumber: 'D12345678',
        notes: 'Handed to DTDC courier pickup'
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid order IDs or empty tracking numbers', () => {
      const result = CreateFulfillmentRequestSchema.safeParse({
        orderId: 'not-a-uuid',
        courierProvider: 'dtdc',
        trackingNumber: '   '
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Fulfillment State Transitions', () => {
    it('allows valid progressive transitions', () => {
      expect(canTransitionFulfillment('unfulfilled', 'shipped')).toBe(true);
      expect(canTransitionFulfillment('shipped', 'delivered')).toBe(true);
    });

    it('rejects backwards or illegal transitions', () => {
      expect(canTransitionFulfillment('delivered', 'unfulfilled')).toBe(false);
      expect(canTransitionFulfillment('delivered', 'shipped')).toBe(false);
      expect(() => assertCanTransitionFulfillment('delivered', 'unfulfilled')).toThrow(
        InvalidStateTransitionError
      );
    });
  });
});
