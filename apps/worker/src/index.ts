import { validateServerEnv } from '@hh/config';
import { getSharedDbClient } from '@hh/db';

import { startOutboxPoller } from './poller/outbox-poller';
import { createNotificationQueues, getRedisConnectionOptions } from './queues';
import { EmailService } from './services/email.service';
import { WhatsAppService } from './services/whatsapp.service';
import { startInventorySweeper } from './sweeper/inventory-sweeper';
import { startRetentionSweeper } from './sweeper/retention-sweeper';
import { createEmailWorker } from './workers/email.worker';
import { createWhatsAppWorker } from './workers/whatsapp.worker';

export async function startWorkerServer(): Promise<{
  shutdown: (signal: string) => Promise<void>;
}> {
  const env = validateServerEnv();

  // Structured startup log
  console.log(
    JSON.stringify({
      level: 'info',
      message: 'Starting H&H background worker...',
      nodeEnv: env.NODE_ENV
    })
  );

  // 1. Initialize DB client (pooled shared client)
  const db = getSharedDbClient(env.DATABASE_URL);

  // 2. Initialize Redis connection options for dedicated BullMQ connections per queue and worker (E-COM-159)
  const redisOptions = getRedisConnectionOptions(env.REDIS_URL);

  // 3. Initialize BullMQ Queues (each queue creates its own dedicated connection)
  const queues = createNotificationQueues(redisOptions);

  // 4. Initialize Notification Delivery Services
  const emailService = new EmailService({
    apiKey: env.RESEND_API_KEY
  });
  const whatsappService = new WhatsAppService({
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: env.WHATSAPP_ACCESS_TOKEN,
    businessAccountId: env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    apiVersion: env.WHATSAPP_API_VERSION,
    apiUrl: env.WHATSAPP_API_URL
  });

  // 5. Initialize BullMQ Workers (each worker manages its own dedicated blocking connections)
  const emailWorker = createEmailWorker(redisOptions, emailService);
  const whatsappWorker = createWhatsAppWorker(redisOptions, whatsappService);

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
  const shutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    // Safety timeout: forcefully exit if graceful drain hangs longer than 10 seconds (E-COM-160)
    const forceExitTimer = setTimeout(() => {
      console.error(
        JSON.stringify({
          level: 'fatal',
          message: 'Worker graceful shutdown timed out after 10 seconds. Forcing process exit.'
        })
      );
      process.exit(1);
    }, 10000);
    forceExitTimer.unref();

    console.log(
      JSON.stringify({
        level: 'info',
        message: `Received ${signal}. Draining active tasks and shutting down worker gracefully...`
      })
    );

    // 1. Drain active polling and sweep loops first before closing queues/workers
    await Promise.allSettled([stopPoller(), stopSweeper(), stopRetentionSweeper()]);

    // 2. Close BullMQ workers and queues (waits for active job processing to complete)
    await Promise.allSettled([
      emailWorker.close(),
      whatsappWorker.close(),
      queues.emailQueue.close(),
      queues.whatsappQueue.close()
    ]);

    clearTimeout(forceExitTimer);

    console.log(
      JSON.stringify({
        level: 'info',
        message: 'H&H background worker shutdown complete.'
      })
    );
  };

  return { shutdown };
}

async function main(): Promise<void> {
  const { shutdown } = await startWorkerServer();

  const handleTermination = (signal: string) => {
    void shutdown(signal).then(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', () => handleTermination('SIGINT'));
  process.on('SIGTERM', () => handleTermination('SIGTERM'));

  // Global uncaught exception and rejection handlers (E-COM-160)
  process.on('uncaughtException', (err: Error) => {
    console.error(
      JSON.stringify({
        level: 'fatal',
        message: 'Worker uncaughtException detected',
        error: err.message,
        stack: err.stack
      })
    );
    void shutdown('uncaughtException').finally(() => process.exit(1));
  });

  process.on('unhandledRejection', (reason: unknown) => {
    console.error(
      JSON.stringify({
        level: 'fatal',
        message: 'Worker unhandledRejection detected',
        reason: reason instanceof Error ? reason.message : String(reason)
      })
    );
    void shutdown('unhandledRejection').finally(() => process.exit(1));
  });
}

// Direct CLI invocation guard
const isDirectEntry =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  /(worker|dist\/index|src\/index)\.(ts|js)$/.test(process.argv[1]);

if (isDirectEntry) {
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
}
