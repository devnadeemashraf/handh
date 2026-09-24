import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { Queue } from 'bullmq';

import {
  cleanPendingOutboxEvents,
  createDbClient,
  createStore,
  createUser,
  insertOutboxEvent
} from '@hh/db';

import type { DatabaseClient } from '@hh/db';

import {
  EMAIL_JOB_ADMIN_ORDER_ALERT,
  EMAIL_JOB_ORDER_CONFIRMATION,
  EMAIL_JOB_ORDER_DELIVERED,
  EMAIL_JOB_ORDER_DISPATCHED,
  WHATSAPP_JOB_ORDER_CONFIRMATION,
  WHATSAPP_JOB_ORDER_DISPATCHED
} from '../queues/queue-names';
import { pollOutboxOnce } from './outbox-poller';

import type { NotificationQueues } from '../queues';

describe('Outbox Poller Integration', () => {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  const db: DatabaseClient = createDbClient(databaseUrl);

  let storeId: string;
  let optedInUserId: string;
  let optedOutUserId: string;

  beforeAll(async () => {
    // Drain prior pending events from other test suites
    await cleanPendingOutboxEvents(db);

    const storeSlug = `poller-store-${Date.now()}`;
    const store = await createStore(db, {
      slug: storeSlug,
      name: 'Poller Store',
      defaultCurrency: 'INR',
      isActive: true,
      settings: {
        orderNotificationEmails: ['orders-lead@handh.local']
      }
    });
    storeId = store.id;

    const optedInUser = await createUser(db, storeSlug, {
      phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
      name: 'Amina Opted In',
      whatsappOptIn: true
    });
    optedInUserId = optedInUser.id;

    const optedOutUser = await createUser(db, storeSlug, {
      phone: `+9197${Math.floor(10000000 + Math.random() * 90000000)}`,
      name: 'Zainab Opted Out',
      whatsappOptIn: false
    });
    optedOutUserId = optedOutUser.id;
  });

  function createMockQueues(): {
    queues: NotificationQueues;
    emailSpy: ReturnType<typeof vi.fn>;
    whatsappSpy: ReturnType<typeof vi.fn>;
  } {
    const emailSpy = vi.fn().mockResolvedValue({ id: 'email-job-1' });
    const whatsappSpy = vi.fn().mockResolvedValue({ id: 'wa-job-1' });

    const queues = {
      emailQueue: { add: emailSpy } as unknown as Queue,
      whatsappQueue: { add: whatsappSpy } as unknown as Queue
    };

    return { queues, emailSpy, whatsappSpy };
  }

  it('enqueues customer email, admin alert, and WhatsApp when user opted in to WhatsApp', async () => {
    const { queues, emailSpy, whatsappSpy } = createMockQueues();
    const orderNumber = `HH-POL-${Date.now()}`;

    // Insert pending order.paid event
    await insertOutboxEvent(db, {
      eventName: 'order.paid',
      aggregateType: 'order',
      aggregateId: 'ord-poller-1',
      payload: {
        orderId: 'ord-poller-1',
        storeId,
        orderNumber,
        customerName: 'Amina Opted In',
        customerEmail: 'amina@example.com',
        customerPhone: '+919812345678',
        totalMinor: 899900,
        currency: 'INR',
        itemsSnapshot: [
          {
            title: 'Royal Kaftan',
            quantity: 1,
            unitPriceMinor: 899900,
            subtotalMinor: 899900
          }
        ],
        shippingAddressSnapshot: {
          recipientName: 'Amina Opted In',
          line1: '12 Emerald Crescent',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500001',
          country: 'IN'
        },
        userId: optedInUserId,
        paidAt: new Date().toISOString()
      },
      status: 'pending',
      scheduledAt: new Date()
    });

    const result = await pollOutboxOnce(db, queues, { appUrl: 'https://handh.local' });
    expect(result.processedCount).toBeGreaterThanOrEqual(1);

    // Verify customer confirmation email enqueued
    expect(emailSpy).toHaveBeenCalledWith(
      EMAIL_JOB_ORDER_CONFIRMATION,
      expect.objectContaining({
        orderNumber,
        customerEmail: 'amina@example.com',
        totalMinor: 899900
      }),
      { jobId: `email:order-confirmed:${orderNumber}` }
    );

    // Verify admin alert email enqueued with store setting recipient
    expect(emailSpy).toHaveBeenCalledWith(
      EMAIL_JOB_ADMIN_ORDER_ALERT,
      expect.objectContaining({
        orderNumber,
        recipientEmails: ['orders-lead@handh.local']
      }),
      { jobId: `email:admin-alert:${orderNumber}` }
    );

    // Verify WhatsApp confirmation enqueued because user opted in
    expect(whatsappSpy).toHaveBeenCalledWith(
      WHATSAPP_JOB_ORDER_CONFIRMATION,
      expect.objectContaining({
        orderNumber,
        phone: '+919812345678',
        totalMinor: 899900
      }),
      { jobId: `whatsapp:order-confirmed:${orderNumber}` }
    );
  });

  it('strictly respects opt-in consent and does NOT enqueue WhatsApp if user opted out', async () => {
    const { queues, emailSpy, whatsappSpy } = createMockQueues();
    const orderNumber = `HH-NO-WA-${Date.now()}`;

    await insertOutboxEvent(db, {
      eventName: 'order.paid',
      aggregateType: 'order',
      aggregateId: 'ord-poller-2',
      payload: {
        orderId: 'ord-poller-2',
        storeId,
        orderNumber,
        customerName: 'Zainab Opted Out',
        customerEmail: 'zainab@example.com',
        customerPhone: '+919712345678',
        totalMinor: 499900,
        currency: 'INR',
        itemsSnapshot: [],
        shippingAddressSnapshot: {
          recipientName: 'Zainab',
          line1: '45 Rose Ave',
          city: 'Delhi',
          state: 'Delhi',
          postalCode: '110001',
          country: 'IN'
        },
        userId: optedOutUserId,
        paidAt: new Date().toISOString()
      },
      status: 'pending',
      scheduledAt: new Date()
    });

    await pollOutboxOnce(db, queues, { appUrl: 'https://handh.local' });

    // Customer email should still be enqueued
    expect(emailSpy).toHaveBeenCalledWith(
      EMAIL_JOB_ORDER_CONFIRMATION,
      expect.objectContaining({ orderNumber }),
      expect.anything()
    );

    // WhatsApp must NOT have been enqueued for this order!
    const waCallsForThisOrder = whatsappSpy.mock.calls.filter(
      (call) => (call[1] as Record<string, unknown>)?.['orderNumber'] === orderNumber
    );
    expect(waCallsForThisOrder).toHaveLength(0);
  });

  it('enqueues WhatsApp for guest buyer with explicit whatsappOptIn = true (E-COM-082)', async () => {
    const { queues, emailSpy, whatsappSpy } = createMockQueues();
    const orderNumber = `HH-GUEST-OPTIN-${Date.now()}`;

    await insertOutboxEvent(db, {
      eventName: 'order.paid',
      aggregateType: 'order',
      aggregateId: 'ord-poller-guest-1',
      payload: {
        orderId: 'ord-poller-guest-1',
        storeId,
        orderNumber,
        customerName: 'Guest Opted In',
        customerEmail: 'guest-optin@example.com',
        customerPhone: '+919812345679',
        totalMinor: 599900,
        currency: 'INR',
        itemsSnapshot: [],
        shippingAddressSnapshot: {
          recipientName: 'Guest Opted In',
          line1: '99 Jubilee Hills',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500033',
          country: 'IN'
        },
        userId: null, // Guest buyer
        whatsappOptIn: true,
        paidAt: new Date().toISOString()
      },
      status: 'pending',
      scheduledAt: new Date()
    });

    await pollOutboxOnce(db, queues, { appUrl: 'https://handh.local' });

    // Customer email is enqueued
    expect(emailSpy).toHaveBeenCalledWith(
      EMAIL_JOB_ORDER_CONFIRMATION,
      expect.objectContaining({ orderNumber }),
      expect.anything()
    );

    expect(whatsappSpy).toHaveBeenCalledWith(
      WHATSAPP_JOB_ORDER_CONFIRMATION,
      expect.objectContaining({
        orderNumber,
        phone: '+919812345679',
        totalMinor: 599900
      }),
      { jobId: `whatsapp:order-confirmed:${orderNumber}` }
    );
  });

  it('does NOT enqueue WhatsApp for guest buyer when whatsappOptIn = false (E-COM-082)', async () => {
    const { queues, emailSpy, whatsappSpy } = createMockQueues();
    const orderNumber = `HH-GUEST-OPTOUT-${Date.now()}`;

    await insertOutboxEvent(db, {
      eventName: 'order.paid',
      aggregateType: 'order',
      aggregateId: 'ord-poller-guest-2',
      payload: {
        orderId: 'ord-poller-guest-2',
        storeId,
        orderNumber,
        customerName: 'Guest Opted Out',
        customerEmail: 'guest-optout@example.com',
        customerPhone: '+919812345680',
        totalMinor: 599900,
        currency: 'INR',
        itemsSnapshot: [],
        shippingAddressSnapshot: {
          recipientName: 'Guest Opted Out',
          line1: '99 Jubilee Hills',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500033',
          country: 'IN'
        },
        userId: null, // Guest buyer
        whatsappOptIn: false,
        paidAt: new Date().toISOString()
      },
      status: 'pending',
      scheduledAt: new Date()
    });

    await pollOutboxOnce(db, queues, { appUrl: 'https://handh.local' });

    // Customer email is still enqueued even when opting out of WhatsApp
    expect(emailSpy).toHaveBeenCalledWith(
      EMAIL_JOB_ORDER_CONFIRMATION,
      expect.objectContaining({ orderNumber }),
      expect.anything()
    );

    const waCallsForThisOrder = whatsappSpy.mock.calls.filter(
      (call) => (call[1] as Record<string, unknown>)?.['orderNumber'] === orderNumber
    );
    expect(waCallsForThisOrder).toHaveLength(0);
  });

  it('enqueues dispatch and delivery notifications correctly', async () => {
    const { queues, emailSpy, whatsappSpy } = createMockQueues();
    const orderNumber = `HH-SHIP-${Date.now()}`;

    // 1. Dispatched event
    await insertOutboxEvent(db, {
      eventName: 'order.dispatched',
      aggregateType: 'order',
      aggregateId: 'ord-ship-1',
      payload: {
        orderId: 'ord-ship-1',
        orderNumber,
        courierProvider: 'BlueDart',
        trackingNumber: 'BD-998877',
        trackingReference: 'TRK-998877',
        customerName: 'Amina',
        customerEmail: 'amina@example.com',
        customerPhone: '+919812345678',
        userId: optedInUserId,
        shippedAt: new Date().toISOString()
      },
      status: 'pending',
      scheduledAt: new Date()
    });

    await pollOutboxOnce(db, queues, { appUrl: 'https://handh.local' });

    expect(emailSpy).toHaveBeenCalledWith(
      EMAIL_JOB_ORDER_DISPATCHED,
      expect.objectContaining({
        orderNumber,
        courierName: 'BlueDart',
        trackingNumber: 'BD-998877'
      }),
      { jobId: `email:order-dispatched:${orderNumber}` }
    );

    expect(whatsappSpy).toHaveBeenCalledWith(
      WHATSAPP_JOB_ORDER_DISPATCHED,
      expect.objectContaining({
        orderNumber,
        courierName: 'BlueDart',
        trackingNumber: 'BD-998877'
      }),
      { jobId: `whatsapp:order-dispatched:${orderNumber}` }
    );

    // 2. Delivered event
    const { queues: qDelivered, emailSpy: emailDeliveredSpy } = createMockQueues();
    await insertOutboxEvent(db, {
      eventName: 'order.delivered',
      aggregateType: 'order',
      aggregateId: 'ord-deliv-1',
      payload: {
        orderId: 'ord-deliv-1',
        orderNumber,
        fulfillmentId: 'ful-1',
        awb: 'BD-998877',
        customerEmail: 'amina@example.com',
        customerName: 'Amina',
        deliveredAt: new Date().toISOString()
      },
      status: 'pending',
      scheduledAt: new Date()
    });

    await pollOutboxOnce(db, qDelivered, { appUrl: 'https://handh.local' });

    expect(emailDeliveredSpy).toHaveBeenCalledWith(
      EMAIL_JOB_ORDER_DELIVERED,
      expect.objectContaining({
        orderNumber,
        customerEmail: 'amina@example.com'
      }),
      { jobId: `email:order-delivered:${orderNumber}` }
    );
  });
});
