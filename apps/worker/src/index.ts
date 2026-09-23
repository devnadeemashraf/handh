import { validateServerEnv } from '@hh/config';
import { createDbClient } from '@hh/db';

import { startOutboxPoller } from './poller/outbox-poller';
import { createNotificationQueues, createRedisConnection } from './queues';
import { EmailService } from './services/email.service';
import { WhatsAppService } from './services/whatsapp.service';
import { startInventorySweeper } from './sweeper/inventory-sweeper';
import { startRetentionSweeper } from './sweeper/retention-sweeper';
import { createEmailWorker } from './workers/email.worker';
import { createWhatsAppWorker } from './workers/whatsapp.worker';

async function main(): Promise<void> {
  const env = validateServerEnv();

  // Structured startup log
  console.log(
    JSON.stringify({
      level: 'info',
      message: 'Starting H&H background worker...',
      nodeEnv: env.NODE_ENV
    })
  );

  // 1. Initialize DB client
  const db = createDbClient(env.DATABASE_URL);

  // 2. Initialize Redis connection
  const redisConnection = createRedisConnection(env.REDIS_URL);

  // 3. Initialize BullMQ Queues
  const queues = createNotificationQueues(redisConnection);

  // 4. Initialize Notification Delivery Services
  const emailService = new EmailService({
    apiKey: env.RESEND_API_KEY
  });
  const whatsappService = new WhatsAppService();

  // 5. Initialize BullMQ Workers
  const emailWorker = createEmailWorker(redisConnection, emailService);
  const whatsappWorker = createWhatsAppWorker(redisConnection, whatsappService);

  // 6. Start Outbox Poller
  const stopPoller = startOutboxPoller(db, queues, 2000, {
    appUrl: env.APP_URL
  });

  // 7. Start Inventory Hold Sweeper (E-COM-043, E-COM-117)
  const stopSweeper = startInventorySweeper(db, 60000);

  // 8. Start Statutory DPDP Retention Sweeper (E-COM-166) - Runs hourly
  const stopRetentionSweeper = startRetentionSweeper(db, 3600000);

  console.log(
    JSON.stringify({
      level: 'info',
      message:
        'H&H background worker initialized successfully. Poller, inventory sweeper, retention sweeper & workers active.'
    })
  );

  let isShuttingDown = false;
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(
      JSON.stringify({
        level: 'info',
        message: `Received ${signal}. Shutting down worker gracefully...`
      })
    );

    stopPoller();
    stopSweeper();
    stopRetentionSweeper();

    await Promise.allSettled([
      emailWorker.close(),
      whatsappWorker.close(),
      queues.emailQueue.close(),
      queues.whatsappQueue.close()
    ]);

    await redisConnection.quit();

    console.log(
      JSON.stringify({
        level: 'info',
        message: 'H&H background worker shutdown complete.'
      })
    );

    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err: unknown) => {
  console.error(
    JSON.stringify({
      level: 'fatal',
      message: 'Worker encountered an unhandled error during startup',
      error: err instanceof Error ? err.message : String(err)
    })
  );
  process.exit(1);
});
