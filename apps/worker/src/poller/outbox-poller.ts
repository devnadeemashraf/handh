import {
  fetchPendingOutboxEvents,
  findStoreById,
  findUserById,
  markOutboxEventFailed,
  markOutboxEventPublished
} from '@hh/db';

import type { DatabaseClient } from '@hh/db';
import type { OrderDeliveredPayload, OrderDispatchedPayload, OrderPaidPayload } from '@hh/domain';

import {
  EMAIL_JOB_ADMIN_ORDER_ALERT,
  EMAIL_JOB_ORDER_CONFIRMATION,
  EMAIL_JOB_ORDER_DELIVERED,
  EMAIL_JOB_ORDER_DISPATCHED,
  WHATSAPP_JOB_ORDER_CONFIRMATION,
  WHATSAPP_JOB_ORDER_DELIVERED,
  WHATSAPP_JOB_ORDER_DISPATCHED
} from '../queues/queue-names';

import type { NotificationQueues } from '../queues';

export interface OutboxPollerOptions {
  limit?: number | undefined;
  appUrl?: string | undefined;
}

/**
 * Executes a single outbox polling pass:
 * 1. Fetches due pending outbox events from DB.
 * 2. Translates events to BullMQ jobs with deterministic IDs (deduplication/idempotency).
 * 3. Checks customer WhatsApp opt-in before enqueuing WhatsApp messages.
 * 4. Atomically updates event status to 'published' or records failure with retry backoff.
 */
export async function pollOutboxOnce(
  db: DatabaseClient,
  queues: NotificationQueues,
  options: OutboxPollerOptions = {}
): Promise<{ processedCount: number; errorsCount: number }> {
  const { limit = 50, appUrl = process.env['APP_URL'] ?? 'http://localhost:3000' } = options;
  const pendingEvents = await fetchPendingOutboxEvents(db, limit);

  let processedCount = 0;
  let errorsCount = 0;

  for (const event of pendingEvents) {
    try {
      switch (event.eventName) {
        case 'order.paid': {
          const payload = event.payload as unknown as OrderPaidPayload;

          // 1. Enqueue customer confirmation email
          await queues.emailQueue.add(
            EMAIL_JOB_ORDER_CONFIRMATION,
            {
              orderId: payload.orderId,
              orderNumber: payload.orderNumber,
              customerName: payload.customerName,
              customerEmail: payload.customerEmail,
              totalMinor: payload.totalMinor,
              currency: payload.currency,
              items: payload.itemsSnapshot,
              shippingAddress: payload.shippingAddressSnapshot,
              orderUrl: `${appUrl}/account/orders/${payload.orderId}`
            },
            {
              jobId: `email:order-confirmed:${payload.orderNumber}`
            }
          );

          // 2. Fetch admin alert notification emails from store settings
          let adminEmails: string[] = ['admin@handh.local'];
          if (payload.storeId) {
            try {
              const store = await findStoreById(db, payload.storeId);
              if (
                store?.settings?.orderNotificationEmails &&
                store.settings.orderNotificationEmails.length > 0
              ) {
                adminEmails = store.settings.orderNotificationEmails;
              } else if (store?.settings?.contactEmail) {
                adminEmails = [store.settings.contactEmail];
              }
            } catch (err) {
              console.warn(`Could not resolve store settings for admin alert: ${String(err)}`);
            }
          }

          // 3. Enqueue admin new order alert email
          await queues.emailQueue.add(
            EMAIL_JOB_ADMIN_ORDER_ALERT,
            {
              orderId: payload.orderId,
              orderNumber: payload.orderNumber,
              customerName: payload.customerName,
              customerEmail: payload.customerEmail,
              customerPhone: payload.customerPhone,
              totalMinor: payload.totalMinor,
              currency: payload.currency,
              items: payload.itemsSnapshot,
              shippingAddress: payload.shippingAddressSnapshot,
              adminOrderUrl: `${appUrl}/admin/orders/${payload.orderId}`,
              recipientEmails: adminEmails
            },
            {
              jobId: `email:admin-alert:${payload.orderNumber}`
            }
          );

          // 4. Check WhatsApp opt-in before enqueuing WhatsApp message
          let isWhatsAppOptedIn = false;
          if (payload.userId) {
            const user = await findUserById(db, payload.userId);
            isWhatsAppOptedIn = user?.whatsappOptIn === true;
          }

          if (isWhatsAppOptedIn && payload.customerPhone) {
            await queues.whatsappQueue.add(
              WHATSAPP_JOB_ORDER_CONFIRMATION,
              {
                orderId: payload.orderId,
                orderNumber: payload.orderNumber,
                customerName: payload.customerName,
                phone: payload.customerPhone,
                totalMinor: payload.totalMinor,
                currency: payload.currency,
                itemCount: payload.itemsSnapshot?.length ?? 1,
                trackingUrl: `${appUrl}/track/${payload.orderNumber}`
              },
              {
                jobId: `whatsapp:order-confirmed:${payload.orderNumber}`
              }
            );
          }

          break;
        }

        case 'order.dispatched': {
          const payload = event.payload as unknown as OrderDispatchedPayload;
          const trackingLink = `${appUrl}/track/${payload.trackingReference || payload.trackingNumber}`;

          // 1. Enqueue customer dispatch email
          await queues.emailQueue.add(
            EMAIL_JOB_ORDER_DISPATCHED,
            {
              orderId: payload.orderId,
              orderNumber: payload.orderNumber,
              customerName: payload.customerName,
              customerEmail: payload.customerEmail,
              courierName: payload.courierProvider,
              trackingNumber: payload.trackingNumber,
              trackingReference: payload.trackingReference,
              trackingUrl: trackingLink,
              shippedAt: payload.shippedAt
            },
            {
              jobId: `email:order-dispatched:${payload.orderNumber}`
            }
          );

          // 2. Check WhatsApp opt-in
          let isWhatsAppOptedIn = false;
          if (payload.userId) {
            const user = await findUserById(db, payload.userId);
            isWhatsAppOptedIn = user?.whatsappOptIn === true;
          }

          if (isWhatsAppOptedIn && payload.customerPhone) {
            await queues.whatsappQueue.add(
              WHATSAPP_JOB_ORDER_DISPATCHED,
              {
                orderId: payload.orderId,
                orderNumber: payload.orderNumber,
                customerName: payload.customerName,
                phone: payload.customerPhone,
                courierName: payload.courierProvider,
                trackingNumber: payload.trackingNumber,
                trackingUrl: trackingLink
              },
              {
                jobId: `whatsapp:order-dispatched:${payload.orderNumber}`
              }
            );
          }

          break;
        }

        case 'order.delivered': {
          const payload = event.payload as unknown as OrderDeliveredPayload;

          // 1. Enqueue customer delivery email
          await queues.emailQueue.add(
            EMAIL_JOB_ORDER_DELIVERED,
            {
              orderId: payload.orderId,
              orderNumber: payload.orderNumber,
              customerName: payload.customerName,
              customerEmail: payload.customerEmail,
              deliveredAt: payload.deliveredAt,
              orderUrl: `${appUrl}/account/orders/${payload.orderId}`
            },
            {
              jobId: `email:order-delivered:${payload.orderNumber}`
            }
          );

          // 2. Check WhatsApp opt-in
          let isWhatsAppOptedIn = false;
          if (payload.userId) {
            const user = await findUserById(db, payload.userId);
            isWhatsAppOptedIn = user?.whatsappOptIn === true;
          }

          if (isWhatsAppOptedIn && payload.customerPhone) {
            await queues.whatsappQueue.add(
              WHATSAPP_JOB_ORDER_DELIVERED,
              {
                orderId: payload.orderId,
                orderNumber: payload.orderNumber,
                customerName: payload.customerName,
                phone: payload.customerPhone,
                deliveredAt: payload.deliveredAt
              },
              {
                jobId: `whatsapp:order-delivered:${payload.orderNumber}`
              }
            );
          }

          break;
        }

        default:
          console.warn(`Unrecognized outbox event name: ${event.eventName}`);
          break;
      }

      // Mark outbox event published
      await markOutboxEventPublished(db, event.id);
      processedCount++;
    } catch (err) {
      errorsCount++;
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(
        JSON.stringify({
          level: 'error',
          message: `Failed to process outbox event: ${event.eventName}`,
          eventId: event.id,
          error: errorMessage
        })
      );

      await markOutboxEventFailed(db, event.id, errorMessage);
    }
  }

  return { processedCount, errorsCount };
}

/**
 * Starts continuous background polling for outbox events.
 * Returns an asynchronous teardown function that clears the interval and
 * awaits any in-flight polling loop to finish before resolving (E-COM-160).
 */
export function startOutboxPoller(
  db: DatabaseClient,
  queues: NotificationQueues,
  intervalMs = 2000,
  options: OutboxPollerOptions = {}
): () => Promise<void> {
  let isPolling = false;
  let isStopped = false;
  let activePollPromise: Promise<unknown> | null = null;

  const intervalId = setInterval(async () => {
    if (isPolling || isStopped) return;
    isPolling = true;

    try {
      activePollPromise = pollOutboxOnce(db, queues, options);
      await activePollPromise;
    } catch (err) {
      console.error(
        JSON.stringify({
          level: 'error',
          message: 'Unhandled error during outbox polling tick',
          error: err instanceof Error ? err.message : String(err)
        })
      );
    } finally {
      isPolling = false;
      activePollPromise = null;
    }
  }, intervalMs);

  return async () => {
    isStopped = true;
    clearInterval(intervalId);
    if (activePollPromise) {
      try {
        await activePollPromise;
      } catch {
        // In-flight error was logged in tick
      }
    }
  };
}
