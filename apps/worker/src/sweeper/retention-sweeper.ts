import { type DatabaseClient, executeRetentionPurge } from '@hh/db';

export interface RetentionSweeperOptions {
  otpRetentionHours?: number | undefined;
  outboxRetentionDays?: number | undefined;
}

/**
 * Runs a single pass of the statutory data retention sweeper:
 * - Purges expired unverified OTP codes older than 24 hours.
 * - Anonymizes customer notification PII payloads from processed outbox events older than 30 days.
 * Fulfills DPDP Act 2023 §8(7) statutory mandates.
 */
export async function runRetentionSweeperPass(
  db: DatabaseClient,
  options: RetentionSweeperOptions = {}
): Promise<{
  purgedOtpsCount: number;
  anonymizedOutboxEventsCount: number;
}> {
  const result = await executeRetentionPurge(db, options);

  if (result.purgedOtpsCount > 0 || result.anonymizedOutboxEventsCount > 0) {
    console.log(
      JSON.stringify({
        level: 'info',
        message: 'DPDP statutory retention sweeper completed pass',
        purgedOtps: result.purgedOtpsCount,
        anonymizedOutboxEvents: result.anonymizedOutboxEventsCount,
        executedAt: result.executedAt
      })
    );
  }

  return {
    purgedOtpsCount: result.purgedOtpsCount,
    anonymizedOutboxEventsCount: result.anonymizedOutboxEventsCount
  };
}

/**
 * Starts continuous background sweeping for DPDP Act statutory data retention (E-COM-166).
 * Prevents overlapping/re-entrant runs.
 * Returns a teardown function to cleanly stop the timer.
 */
export function startRetentionSweeper(
  db: DatabaseClient,
  intervalMs = 3600000,
  options: RetentionSweeperOptions = {}
): () => void {
  let isSweeping = false;

  const intervalId = setInterval(async () => {
    if (isSweeping) return;
    isSweeping = true;

    try {
      await runRetentionSweeperPass(db, options);
    } catch (err) {
      console.error(
        JSON.stringify({
          level: 'error',
          message: 'Unhandled error during DPDP retention sweeper pass',
          error: err instanceof Error ? err.message : String(err)
        })
      );
    } finally {
      isSweeping = false;
    }
  }, intervalMs);

  return () => {
    clearInterval(intervalId);
  };
}
