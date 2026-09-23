import { afterEach, describe, expect, it, vi } from 'vitest';

import * as dbModule from '@hh/db';

import type { DatabaseClient } from '@hh/db';

import { runRetentionSweeperPass, startRetentionSweeper } from './retention-sweeper';

describe('DPDP Retention Sweeper (Worker)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const mockDb = {} as DatabaseClient;

  it('runs a retention sweeper pass and logs output when items are purged', async () => {
    const purgeSpy = vi.spyOn(dbModule, 'executeRetentionPurge').mockResolvedValue({
      purgedOtpsCount: 5,
      anonymizedOutboxEventsCount: 12,
      executedAt: new Date().toISOString()
    });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await runRetentionSweeperPass(mockDb, {
      otpRetentionHours: 24,
      outboxRetentionDays: 30
    });

    expect(purgeSpy).toHaveBeenCalledWith(mockDb, {
      otpRetentionHours: 24,
      outboxRetentionDays: 30
    });
    expect(result).toEqual({
      purgedOtpsCount: 5,
      anonymizedOutboxEventsCount: 12
    });

    expect(consoleSpy).toHaveBeenCalled();
    const logCall = consoleSpy.mock.calls[0]?.[0];
    expect(logCall).toContain('DPDP statutory retention sweeper completed pass');
    expect(logCall).toContain('"purgedOtps":5');
    expect(logCall).toContain('"anonymizedOutboxEvents":12');
  });

  it('runs cleanly without logging when zero items qualify for purge', async () => {
    vi.spyOn(dbModule, 'executeRetentionPurge').mockResolvedValue({
      purgedOtpsCount: 0,
      anonymizedOutboxEventsCount: 0,
      executedAt: new Date().toISOString()
    });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await runRetentionSweeperPass(mockDb);

    expect(result).toEqual({
      purgedOtpsCount: 0,
      anonymizedOutboxEventsCount: 0
    });
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('handles errors gracefully in interval loop without crashing worker process', async () => {
    vi.useFakeTimers();

    vi.spyOn(dbModule, 'executeRetentionPurge').mockRejectedValue(
      new Error('Database connectivity error')
    );
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const stopSweeper = startRetentionSweeper(mockDb, 1000);

    // Advance fake timer to trigger interval
    await vi.advanceTimersByTimeAsync(1000);

    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorLog = consoleErrorSpy.mock.calls[0]?.[0];
    expect(errorLog).toContain('Unhandled error during DPDP retention sweeper pass');
    expect(errorLog).toContain('Database connectivity error');

    stopSweeper();
  });
});
