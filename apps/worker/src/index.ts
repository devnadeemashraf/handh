import { validateServerEnv } from '@hh/config';

async function main(): Promise<void> {
  const env = validateServerEnv();

  // Structured startup log (No secrets leaked!)
  console.log(
    JSON.stringify({
      level: 'info',
      message: 'Starting H&H background worker...',
      nodeEnv: env.NODE_ENV
    })
  );

  const shutdown = async (signal: string) => {
    console.log(
      JSON.stringify({
        level: 'info',
        message: `Received ${signal}. Shutting down worker gracefully...`
      })
    );
    // Worker teardown will close BullMQ and Redis connections
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
