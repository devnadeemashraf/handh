import type { RetentionPurgeResult } from '@hh/domain';

import { purgeExpiredOtps } from '../repositories/otp.repository';
import { purgeProcessedOutboxPayloads } from '../repositories/outbox.repository';

import type { DatabaseClient } from '../index';

export interface RetentionPurgeOptions {
  otpRetentionHours?: number | undefined;
  outboxRetentionDays?: number | undefined;
}

/**
 * Executes statutory data minimization and retention purges pursuant to Section 8(7) of the DPDP Act 2023.
 * - Deletes expired, unverified OTP codes older than 24 hours.
 * - Redacts customer PII from completed/failed outbox notification payloads older than 30 days.
 */
export async function executeRetentionPurge(
  db: DatabaseClient,
  options: RetentionPurgeOptions = {}
): Promise<RetentionPurgeResult> {
  const { otpRetentionHours = 24, outboxRetentionDays = 30 } = options;

  const purgedOtpsCount = await purgeExpiredOtps(db, otpRetentionHours);
  const anonymizedOutboxEventsCount = await purgeProcessedOutboxPayloads(db, outboxRetentionDays);

  return {
    purgedOtpsCount,
    anonymizedOutboxEventsCount,
    executedAt: new Date().toISOString()
  };
}
