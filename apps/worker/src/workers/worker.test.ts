import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Worker } from 'bullmq';
import type { Redis } from 'ioredis';

import { createNotificationQueues, createRedisConnection } from '../queues';
import {
  EMAIL_JOB_ADMIN_ORDER_ALERT,
  EMAIL_JOB_ORDER_CONFIRMATION,
  WHATSAPP_JOB_ORDER_CONFIRMATION
} from '../queues/queue-names';
import { EmailService } from '../services/email.service';
import { MockWhatsAppAdapter, WhatsAppService } from '../services/whatsapp.service';
import { createEmailWorker } from './email.worker';
import { createWhatsAppWorker } from './whatsapp.worker';

import type { NotificationQueues } from '../queues';

describe('BullMQ Worker Processing Integration', () => {
  const redisUrl = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
  let redisConnection: Redis;
  let queues: NotificationQueues;
  let emailService: EmailService;
  let whatsappAdapter: MockWhatsAppAdapter;
  let whatsappService: WhatsAppService;
  let emailWorker: Worker;
  let whatsappWorker: Worker;

  beforeAll(() => {
    redisConnection = createRedisConnection(redisUrl);
    queues = createNotificationQueues(redisConnection);

    emailService = new EmailService({ forceMock: true });
    whatsappAdapter = new MockWhatsAppAdapter();
    whatsappService = new WhatsAppService(whatsappAdapter);

    emailWorker = createEmailWorker(redisConnection, emailService);
    whatsappWorker = createWhatsAppWorker(redisConnection, whatsappService);
  });

  afterAll(async () => {
    await Promise.allSettled([
      emailWorker.close(),
      whatsappWorker.close(),
      queues.emailQueue.close(),
      queues.whatsappQueue.close()
    ]);
    await redisConnection.quit();
  });

  it('processes customer order confirmation email job through BullMQ', async () => {
    const orderNumber = `HH-TEST-WK-${Date.now()}`;

    await queues.emailQueue.add(
      EMAIL_JOB_ORDER_CONFIRMATION,
      {
        orderId: 'ord-wk-1',
        orderNumber,
        customerName: 'Mariam',
        customerEmail: 'mariam@example.com',
        totalMinor: 799900,
        currency: 'INR',
        items: [
          {
            title: 'Royal Embroidered Abaya',
            quantity: 1,
            unitPriceMinor: 799900,
            subtotalMinor: 799900
          }
        ],
        shippingAddress: {
          recipientName: 'Mariam',
          line1: '10 High St',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'IN'
        }
      },
      { jobId: `test:email:${orderNumber}` }
    );

    // Wait briefly for worker to consume and process job
    let attempts = 0;
    while (attempts < 30) {
      const found = emailService.sentEmails.find((e) => e.subject.includes(orderNumber));
      if (found) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    const sent = emailService.sentEmails.find((e) => e.subject.includes(orderNumber));
    expect(sent).toBeDefined();
    expect(sent?.to).toEqual(['mariam@example.com']);
    expect(sent?.html).toContain('Royal Embroidered Abaya');
    expect(sent?.html).toContain('₹7,999.00');
  });

  it('processes admin alert email job through BullMQ', async () => {
    const orderNumber = `HH-ADMIN-WK-${Date.now()}`;

    await queues.emailQueue.add(
      EMAIL_JOB_ADMIN_ORDER_ALERT,
      {
        orderId: 'ord-admin-1',
        orderNumber,
        customerName: 'Mariam',
        customerEmail: 'mariam@example.com',
        customerPhone: '+919900112233',
        totalMinor: 799900,
        currency: 'INR',
        items: [],
        shippingAddress: {
          recipientName: 'Mariam',
          line1: '10 High St',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'IN'
        },
        recipientEmails: ['admin-team@handh.local']
      },
      { jobId: `test:admin:${orderNumber}` }
    );

    let attempts = 0;
    while (attempts < 30) {
      const found = emailService.sentEmails.find((e) => e.subject.includes(orderNumber));
      if (found) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    const sent = emailService.sentEmails.find((e) => e.subject.includes(orderNumber));
    expect(sent).toBeDefined();
    expect(sent?.to).toEqual(['admin-team@handh.local']);
    expect(sent?.subject).toContain('[New Order Alert]');
  });

  it('processes WhatsApp notification job through BullMQ', async () => {
    const orderNumber = `HH-WA-WK-${Date.now()}`;

    await queues.whatsappQueue.add(
      WHATSAPP_JOB_ORDER_CONFIRMATION,
      {
        orderId: 'ord-wa-1',
        orderNumber,
        customerName: 'Mariam',
        phone: '+919900112233',
        totalMinor: 799900,
        currency: 'INR',
        itemCount: 1,
        trackingUrl: `https://handh.local/track/${orderNumber}`
      },
      { jobId: `test:wa:${orderNumber}` }
    );

    let attempts = 0;
    while (attempts < 30) {
      const found = whatsappAdapter.sentMessages.find((m) => m.text.includes(orderNumber));
      if (found) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }

    const sent = whatsappAdapter.sentMessages.find((m) => m.text.includes(orderNumber));
    expect(sent).toBeDefined();
    expect(sent?.to).toBe('+919900112233');
    expect(sent?.text).toContain(orderNumber);
    expect(sent?.text).toContain('*H&H Luxury Concierge*');
  });
});
