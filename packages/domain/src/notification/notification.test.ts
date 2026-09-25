import { describe, expect, it } from 'vitest';

import { DEFAULT_BRAND_IDENTITY } from '../brand/config';
import {
  formatOrderConfirmationWhatsApp,
  formatOrderDeliveredWhatsApp,
  formatOrderDispatchedWhatsApp,
  renderAdminOrderAlertEmail,
  renderOrderConfirmationEmail,
  renderOrderDeliveredEmail,
  renderOrderDispatchedEmail
} from './templates';

describe('Notification Domain Templates', () => {
  const sampleItems = [
    {
      title: 'Silk Organza Abaya',
      variantTitle: 'Midnight Black / M',
      quantity: 1,
      unitPriceMinor: 1299900,
      subtotalMinor: 1299900
    },
    {
      title: 'Modal Silk Hijab',
      variantTitle: 'Ivory Cream',
      quantity: 2,
      unitPriceMinor: 149900,
      subtotalMinor: 299800
    }
  ];

  const sampleAddress = {
    recipientName: 'Fatima Al-Hassan',
    line1: 'Flat 402, Royal Palms Residency',
    line2: 'Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400050',
    country: 'IN',
    phone: '+919876543210'
  };

  describe('renderOrderConfirmationEmail', () => {
    it('renders beautiful luxury email and text with all order details', () => {
      const email = renderOrderConfirmationEmail({
        orderId: 'ord-123',
        orderNumber: 'HH-2026-0001',
        customerName: 'Fatima Al-Hassan',
        customerEmail: 'fatima@example.com',
        totalMinor: 1599700,
        currency: 'INR',
        items: sampleItems,
        shippingAddress: sampleAddress,
        orderUrl: 'https://handh.local/account/orders/ord-123'
      });

      expect(email.subject).toBe(
        `Order Confirmed: #HH-2026-0001 — ${DEFAULT_BRAND_IDENTITY.name} Luxury`
      );
      expect(email.html).toContain(DEFAULT_BRAND_IDENTITY.name.replace(/&/g, '&amp;'));
      expect(email.html).toContain(DEFAULT_BRAND_IDENTITY.subtitle.replace(/&/g, '&amp;'));
      expect(email.html).toContain('Fatima Al-Hassan');
      expect(email.html).toContain('#HH-2026-0001');
      expect(email.html).toContain('Silk Organza Abaya');
      expect(email.html).toContain('Midnight Black / M');
      expect(email.html).toContain('Modal Silk Hijab');
      expect(email.html).toContain('₹15,997.00');
      expect(email.html).toContain('Flat 402, Royal Palms Residency');
      expect(email.html).toContain('Mumbai');
      expect(email.html).toContain('https://handh.local/account/orders/ord-123');

      expect(email.text).toContain('HH-2026-0001');
      expect(email.text).toContain('Silk Organza Abaya');
      expect(email.text).toContain('₹15,997.00');
      expect(email.text).toContain('https://handh.local/account/orders/ord-123');
    }, 15000);
  });

  describe('renderOrderDispatchedEmail', () => {
    it('renders dispatched notice with courier and tracking link', () => {
      const email = renderOrderDispatchedEmail({
        orderId: 'ord-123',
        orderNumber: 'HH-2026-0001',
        customerName: 'Fatima Al-Hassan',
        customerEmail: 'fatima@example.com',
        courierName: 'BlueDart Express',
        trackingNumber: 'BLUEDART-88291039',
        trackingReference: 'TRK-2026-0001',
        trackingUrl: 'https://track.handh.local/TRK-2026-0001',
        shippedAt: new Date().toISOString()
      });

      expect(email.subject).toContain('HH-2026-0001');
      expect(email.html).toContain('BlueDart Express');
      expect(email.html).toContain('BLUEDART-88291039');
      expect(email.html).toContain('https://track.handh.local/TRK-2026-0001');
      expect(email.text).toContain('BlueDart Express');
      expect(email.text).toContain('BLUEDART-88291039');
    });
  });

  describe('renderOrderDeliveredEmail', () => {
    it('renders delivered notice with concierge closing', () => {
      const email = renderOrderDeliveredEmail({
        orderId: 'ord-123',
        orderNumber: 'HH-2026-0001',
        customerName: 'Fatima Al-Hassan',
        customerEmail: 'fatima@example.com',
        deliveredAt: new Date().toISOString(),
        orderUrl: 'https://handh.local/account/orders/ord-123'
      });

      expect(email.subject).toContain('HH-2026-0001');
      expect(email.html).toContain('Delivered Successfully');
      expect(email.html).toContain('Fatima Al-Hassan');
      expect(email.text).toContain('HH-2026-0001');
    });
  });

  describe('renderAdminOrderAlertEmail', () => {
    it('renders operations alert with customer info and items breakdown', () => {
      const email = renderAdminOrderAlertEmail({
        orderId: 'ord-123',
        orderNumber: 'HH-2026-0001',
        customerName: 'Fatima Al-Hassan',
        customerEmail: 'fatima@example.com',
        customerPhone: '+919876543210',
        totalMinor: 1599700,
        currency: 'INR',
        items: sampleItems,
        shippingAddress: sampleAddress,
        adminOrderUrl: 'https://handh.local/admin/orders/ord-123'
      });

      expect(email.subject).toContain('[New Order Alert]');
      expect(email.subject).toContain('HH-2026-0001');
      expect(email.subject).toContain('₹15,997.00');
      expect(email.html).toContain('+919876543210');
      expect(email.html).toContain('fatima@example.com');
      expect(email.html).toContain('Mumbai');
      expect(email.html).toContain('https://handh.local/admin/orders/ord-123');
    });
  });

  describe('WhatsApp formatters', () => {
    it('formats order confirmation message', () => {
      const wa = formatOrderConfirmationWhatsApp({
        orderId: 'ord-123',
        orderNumber: 'HH-2026-0001',
        customerName: 'Fatima',
        phone: '+919876543210',
        totalMinor: 1599700,
        currency: 'INR',
        itemCount: 3,
        trackingUrl: 'https://handh.local/track/HH-2026-0001'
      });

      expect(wa.text).toContain(
        `*${DEFAULT_BRAND_IDENTITY.name} ${DEFAULT_BRAND_IDENTITY.terminology.conciergeTitle}*`
      );
      expect(wa.text).toContain('*#HH-2026-0001*');
      expect(wa.text).toContain('₹15,997.00');
      expect(wa.text).toContain('3 items');
      expect(wa.text).toContain('https://handh.local/track/HH-2026-0001');

      expect(wa.template).toBeDefined();
      expect(wa.template?.name).toBe('order_confirmation');
      expect(wa.template?.language.code).toBe('en');
      expect(wa.template?.components?.[0]?.parameters).toEqual([
        { type: 'text', text: 'Fatima' },
        { type: 'text', text: 'HH-2026-0001' },
        { type: 'text', text: '₹15,997.00' },
        { type: 'text', text: '3' }
      ]);
    });

    it('formats order dispatched message', () => {
      const wa = formatOrderDispatchedWhatsApp({
        orderId: 'ord-123',
        orderNumber: 'HH-2026-0001',
        customerName: 'Fatima',
        phone: '+919876543210',
        courierName: 'BlueDart',
        trackingNumber: 'BLUEDART-88291039',
        trackingUrl: 'https://track.handh.local/TRK-2026-0001'
      });

      expect(wa.text).toContain(`*${DEFAULT_BRAND_IDENTITY.name} Delivery Update*`);
      expect(wa.text).toContain('*#HH-2026-0001*');
      expect(wa.text).toContain('*BlueDart*');
      expect(wa.text).toContain('*BLUEDART-88291039*');

      expect(wa.template).toBeDefined();
      expect(wa.template?.name).toBe('order_dispatched');
      expect(wa.template?.language.code).toBe('en');
      expect(wa.template?.components?.[0]?.parameters).toEqual([
        { type: 'text', text: 'Fatima' },
        { type: 'text', text: 'HH-2026-0001' },
        { type: 'text', text: 'BlueDart' },
        { type: 'text', text: 'BLUEDART-88291039' }
      ]);
    });

    it('formats order delivered message', () => {
      const wa = formatOrderDeliveredWhatsApp({
        orderId: 'ord-123',
        orderNumber: 'HH-2026-0001',
        customerName: 'Fatima',
        phone: '+919876543210',
        deliveredAt: new Date().toISOString()
      });

      expect(wa.text).toContain(`*${DEFAULT_BRAND_IDENTITY.name} Delivery Complete*`);
      expect(wa.text).toContain('*#HH-2026-0001*');
      expect(wa.text).toContain('Fatima');

      expect(wa.template).toBeDefined();
      expect(wa.template?.name).toBe('order_delivered');
      expect(wa.template?.language.code).toBe('en');
      expect(wa.template?.components?.[0]?.parameters).toEqual([
        { type: 'text', text: 'Fatima' },
        { type: 'text', text: 'HH-2026-0001' }
      ]);
    });
  });
});
