import { Queue } from 'bullmq';

import type { ConnectionOptions } from 'bullmq';
import type { Redis, RedisOptions } from 'ioredis';

import { NOTIFICATION_EMAIL_QUEUE, NOTIFICATION_WHATSAPP_QUEUE } from './queue-names';

export * from './connection';
export * from './queue-names';

export interface NotificationQueues {
  emailQueue: Queue;
  whatsappQueue: Queue;
}

/**
 * Instantiates the BullMQ notification queues.
 * Supports passing either an existing Redis instance or RedisOptions to enable
 * dedicated connections per Queue (E-COM-159).
 */
export function createNotificationQueues(
  connectionOrOptions: Redis | RedisOptions | ConnectionOptions
): NotificationQueues {
  const defaultJobOptions = {
    attempts: 3,
    backoff: {
      type: 'exponential' as const,
      delay: 5000
    },
    removeOnComplete: {
      age: 86400, // keep 24 hours
      count: 1000
    },
    removeOnFail: {
      age: 604800 // keep 7 days
    }
  };

  const emailQueue = new Queue(NOTIFICATION_EMAIL_QUEUE, {
    connection: connectionOrOptions,
    defaultJobOptions
  });

  const whatsappQueue = new Queue(NOTIFICATION_WHATSAPP_QUEUE, {
    connection: connectionOrOptions,
    defaultJobOptions
  });

  return {
    emailQueue,
    whatsappQueue
  };
}
