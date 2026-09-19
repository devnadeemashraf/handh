import { describe, it, expect } from 'vitest';
import {
  ShippingAdapterRegistry,
  ManualShippingAdapter,
  ShiprocketAdapter,
  TrackingMoreAdapter
} from './index';

describe('Shipping Provider Adapters', () => {
  describe('ManualShippingAdapter', () => {
    const adapter = new ManualShippingAdapter({ webhookSecret: 'test_manual_secret' });

    it('registers counter AWB and resolves public tracking portal URLs', async () => {
      const dtdcRes = await adapter.registerCounterAwb({
        awb: 'D12345678',
        courierSlug: 'dtdc'
      });
      expect(dtdcRes.registered).toBe(true);
      expect(dtdcRes.providerId).toBe('manual');
      expect(dtdcRes.trackingUrl).toContain('dtdc.in');

      const speedPostRes = await adapter.registerCounterAwb({
        awb: 'EM123456789IN',
        courierSlug: 'india_post'
      });
      expect(speedPostRes.registered).toBe(true);
      expect(speedPostRes.trackingUrl).toContain('indiapost.gov.in');
    });

    it('verifies webhook signature using header', () => {
      expect(
        adapter.verifyWebhookSignature('{}', { 'x-manual-webhook-secret': 'test_manual_secret' })
      ).toBe(true);
      expect(
        adapter.verifyWebhookSignature('{}', { 'x-manual-webhook-secret': 'wrong_secret' })
      ).toBe(false);
    });

    it('parses valid manual webhook payload', () => {
      const raw = JSON.stringify({
        awb: 'D12345678',
        status: 'delivered',
        location: 'Hyderabad, Telangana',
        description: 'Delivered to recipient at Jubilee Hills'
      });

      const parsed = adapter.parseWebhookPayload(raw);
      expect(parsed.awb).toBe('D12345678');
      expect(parsed.status).toBe('delivered');
      expect(parsed.providerId).toBe('manual');
      expect(parsed.location).toBe('Hyderabad, Telangana');
    });
  });

  describe('ShiprocketAdapter', () => {
    const adapter = new ShiprocketAdapter({
      webhookSecret: 'sr_secret_key'
    });

    it('simulates doorstep pickup booking in dev mode', async () => {
      const result = await adapter.bookDoorstepPickup({
        orderId: '00000000-0000-0000-0000-000000000001',
        orderNumber: 'HH-2026-00001',
        origin: {
          name: 'H&H Atelier',
          phone: '9876543210',
          line1: 'Banjara Hills',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500034'
        },
        destination: {
          fullName: 'Zainab Fatima',
          phone: '9876543211',
          email: 'zainab@example.com',
          line1: 'Jubilee Hills Road 36',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500033'
        },
        package: {
          weightGrams: 250,
          lengthCm: 15,
          widthCm: 10,
          heightCm: 5,
          declaredValueMinor: 499900
        }
      });

      expect(result.awb).toMatch(/^SR/);
      expect(result.courierName).toContain('Delhivery Surface');
      expect(result.labelUrl).toContain('.pdf');
      expect(result.pickupToken).toBe('PICKUP-HH-2026-00001');
    });

    it('verifies shiprocket webhook header', () => {
      expect(
        adapter.verifyWebhookSignature('{}', { 'x-shiprocket-signature': 'sr_secret_key' })
      ).toBe(true);
      expect(
        adapter.verifyWebhookSignature('{}', { 'x-shiprocket-signature': 'invalid_secret' })
      ).toBe(false);
    });

    it('normalizes Shiprocket status events', () => {
      const deliveredPayload = JSON.stringify({
        awb: 'SR99887766',
        current_status: 'DELIVERED',
        current_timestamp: '2026-09-19T10:00:00Z',
        scans: [{ location: 'Hyderabad Hub', activity: 'Package delivered' }]
      });

      const parsed = adapter.parseWebhookPayload(deliveredPayload);
      expect(parsed.awb).toBe('SR99887766');
      expect(parsed.status).toBe('delivered');
      expect(parsed.location).toBe('Hyderabad Hub');

      const outForDeliveryPayload = JSON.stringify({
        awb_code: 'SR99887766',
        status: 'OUT FOR DELIVERY',
        scans: [{ location: 'Hyderabad South DC', activity: 'Out with courier' }]
      });

      const parsedOfd = adapter.parseWebhookPayload(outForDeliveryPayload);
      expect(parsedOfd.status).toBe('out_for_delivery');
    });
  });

  describe('TrackingMoreAdapter', () => {
    const adapter = new TrackingMoreAdapter({
      webhookSecret: 'tm_webhook_secret'
    });

    it('registers counter AWB for universal tracking', async () => {
      const result = await adapter.registerCounterAwb({
        awb: 'EM998877665IN',
        courierSlug: 'india-post'
      });

      expect(result.registered).toBe(true);
      expect(result.providerId).toBe('trackingmore');
      expect(result.trackingUrl).toContain('trackingmore.com/india-post/EM998877665IN');
    });

    it('verifies trackingmore webhook signature', () => {
      expect(
        adapter.verifyWebhookSignature('{}', { 'trackingmore-signature': 'tm_webhook_secret' })
      ).toBe(true);
      expect(adapter.verifyWebhookSignature('{}', { 'trackingmore-signature': 'wrong_sig' })).toBe(
        false
      );
    });

    it('normalizes TrackingMore webhook payloads', () => {
      const raw = JSON.stringify({
        event: 'tracking_update',
        data: {
          tracking_number: 'EM998877665IN',
          carrier_code: 'india-post',
          delivery_status: 'delivered',
          latest_event: 'Item Delivered at Jubilee Hills SO',
          updated_at: '2026-09-19T10:30:00Z'
        }
      });

      const parsed = adapter.parseWebhookPayload(raw);
      expect(parsed.awb).toBe('EM998877665IN');
      expect(parsed.status).toBe('delivered');
      expect(parsed.description).toBe('Item Delivered at Jubilee Hills SO');
    });
  });

  describe('ShippingAdapterRegistry', () => {
    it('initializes with manual adapter by default and resolves adapters', () => {
      const registry = new ShippingAdapterRegistry();
      expect(registry.has('manual')).toBe(true);
      expect(registry.get('manual')).toBeInstanceOf(ManualShippingAdapter);

      registry.register(new ShiprocketAdapter());
      expect(registry.has('shiprocket')).toBe(true);
      expect(registry.get('shiprocket')).toBeInstanceOf(ShiprocketAdapter);

      expect(() => registry.getOrThrow('non_existent')).toThrowError(
        /Shipping provider adapter not found/
      );
    });

    it('creates default registry with factory method', () => {
      const registry = ShippingAdapterRegistry.createDefault({
        manualSecret: 'manual_sec',
        shiprocket: { webhookSecret: 'sr_sec' },
        trackingmore: { webhookSecret: 'tm_sec' }
      });

      expect(registry.has('manual')).toBe(true);
      expect(registry.has('shiprocket')).toBe(true);
      expect(registry.has('trackingmore')).toBe(true);
    });
  });
});
