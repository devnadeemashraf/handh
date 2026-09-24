import { Worker } from 'bullmq';

import type { ConnectionOptions, Job } from 'bullmq';
import type { Redis, RedisOptions } from 'ioredis';

import {
  formatOrderConfirmationWhatsApp,
  formatOrderDeliveredWhatsApp,
  formatOrderDispatchedWhatsApp
} from '@hh/domain';

import type {
  OrderConfirmationWhatsAppData,
  OrderDeliveredWhatsAppData,
  OrderDispatchedWhatsAppData
} from '@hh/domain';

import {
  NOTIFICATION_WHATSAPP_QUEUE,
  WHATSAPP_JOB_ORDER_CONFIRMATION,
  WHATSAPP_JOB_ORDER_DELIVERED,
  WHATSAPP_JOB_ORDER_DISPATCHED
} from '../queues/queue-names';

import type { WhatsAppService } from '../services/whatsapp.service';

export function createWhatsAppWorker(
  connection: Redis | RedisOptions | ConnectionOptions,
  whatsappService: WhatsAppService,
  concurrency = 5
): Worker {
  const worker = new Worker(
    NOTIFICATION_WHATSAPP_QUEUE,
    async (job: Job) => {
      console.log(
        JSON.stringify({
          level: 'info',
          message: `Processing WhatsApp job: ${job.name}`,
          jobId: job.id
        })
      );

      switch (job.name) {
        case WHATSAPP_JOB_ORDER_CONFIRMATION: {
          const data = job.data as OrderConfirmationWhatsAppData;
          const formatted = formatOrderConfirmationWhatsApp(data);
          const result = await whatsappService.send({
            to: data.phone,
            text: formatted.text,
            template: formatted.template
          });

          if (!result.success) {
            throw new Error(`Failed to send order confirmation WhatsApp: ${result.error}`);
          }
          return result;
        }

        case WHATSAPP_JOB_ORDER_DISPATCHED: {
          const data = job.data as OrderDispatchedWhatsAppData;
          const formatted = formatOrderDispatchedWhatsApp(data);
          const result = await whatsappService.send({
            to: data.phone,
            text: formatted.text,
            template: formatted.template
          });

          if (!result.success) {
            throw new Error(`Failed to send order dispatched WhatsApp: ${result.error}`);
          }
          return result;
        }

        case WHATSAPP_JOB_ORDER_DELIVERED: {
          const data = job.data as OrderDeliveredWhatsAppData;
          const formatted = formatOrderDeliveredWhatsApp(data);
          const result = await whatsappService.send({
            to: data.phone,
            text: formatted.text,
            template: formatted.template
          });

          if (!result.success) {
            throw new Error(`Failed to send order delivered WhatsApp: ${result.error}`);
          }
          return result;
        }

        default:
          console.warn(`Unrecognized WhatsApp job type: ${job.name}`);
          return { skipped: true, reason: `Unknown job type ${job.name}` };
      }
    },
    {
      connection,
      concurrency
    }
  );

  worker.on('failed', (job, err) => {
    console.error(
      JSON.stringify({
        level: 'error',
        message: `WhatsApp job failed: ${job?.name}`,
        jobId: job?.id,
        attemptsMade: job?.attemptsMade,
        error: err.message
      })
    );
  });

  return worker;
}
