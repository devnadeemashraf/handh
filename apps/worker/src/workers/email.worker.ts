import { Worker } from 'bullmq';

import type { Job } from 'bullmq';
import type { Redis } from 'ioredis';

import {
  renderAdminOrderAlertEmail,
  renderOrderConfirmationEmail,
  renderOrderDeliveredEmail,
  renderOrderDispatchedEmail
} from '@hh/domain';

import type {
  AdminOrderAlertEmailData,
  OrderConfirmationEmailData,
  OrderDeliveredEmailData,
  OrderDispatchedEmailData
} from '@hh/domain';

import {
  EMAIL_JOB_ADMIN_ORDER_ALERT,
  EMAIL_JOB_ORDER_CONFIRMATION,
  EMAIL_JOB_ORDER_DELIVERED,
  EMAIL_JOB_ORDER_DISPATCHED,
  NOTIFICATION_EMAIL_QUEUE
} from '../queues/queue-names';

import type { EmailService } from '../services/email.service';

export interface AdminAlertJobPayload extends AdminOrderAlertEmailData {
  recipientEmails?: string[] | undefined;
}

export function createEmailWorker(
  connection: Redis,
  emailService: EmailService,
  concurrency = 5
): Worker {
  const worker = new Worker(
    NOTIFICATION_EMAIL_QUEUE,
    async (job: Job) => {
      console.log(
        JSON.stringify({
          level: 'info',
          message: `Processing email job: ${job.name}`,
          jobId: job.id
        })
      );

      switch (job.name) {
        case EMAIL_JOB_ORDER_CONFIRMATION: {
          const data = job.data as OrderConfirmationEmailData;
          const rendered = renderOrderConfirmationEmail(data);
          const result = await emailService.send({
            to: data.customerEmail,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text
          });

          if (!result.success) {
            throw new Error(`Failed to send order confirmation email: ${result.error}`);
          }
          return result;
        }

        case EMAIL_JOB_ORDER_DISPATCHED: {
          const data = job.data as OrderDispatchedEmailData;
          const rendered = renderOrderDispatchedEmail(data);
          const result = await emailService.send({
            to: data.customerEmail,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text
          });

          if (!result.success) {
            throw new Error(`Failed to send order dispatched email: ${result.error}`);
          }
          return result;
        }

        case EMAIL_JOB_ORDER_DELIVERED: {
          const data = job.data as OrderDeliveredEmailData;
          const rendered = renderOrderDeliveredEmail(data);
          const result = await emailService.send({
            to: data.customerEmail,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text
          });

          if (!result.success) {
            throw new Error(`Failed to send order delivered email: ${result.error}`);
          }
          return result;
        }

        case EMAIL_JOB_ADMIN_ORDER_ALERT: {
          const data = job.data as AdminAlertJobPayload;
          const recipients =
            data.recipientEmails && data.recipientEmails.length > 0
              ? data.recipientEmails
              : ['admin@handh.local'];

          const rendered = renderAdminOrderAlertEmail(data);
          const result = await emailService.send({
            to: recipients,
            subject: rendered.subject,
            html: rendered.html,
            text: rendered.text
          });

          if (!result.success) {
            throw new Error(`Failed to send admin order alert email: ${result.error}`);
          }
          return result;
        }

        default:
          console.warn(`Unrecognized email job type: ${job.name}`);
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
        message: `Email job failed: ${job?.name}`,
        jobId: job?.id,
        attemptsMade: job?.attemptsMade,
        error: err.message
      })
    );
  });

  return worker;
}
