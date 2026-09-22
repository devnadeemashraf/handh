import { afterEach, describe, expect, it, vi } from 'vitest';

import * as dbModule from '@hh/db';

import type { DatabaseClient } from '@hh/db';

import { runInventorySweeperPass, startInventorySweeper } from './inventory-sweeper';

describe('Inventory Hold Sweeper (Worker)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const mockDb = {} as DatabaseClient;

  it('runs a sweeper pass and logs output when expired reservations are found', async () => {
    const sweepSpy = vi.spyOn(dbModule, 'sweepExpiredReservations').mockResolvedValue({
      releasedReservationsCount: 2,
      affectedVariantsCount: 1,
      cancelledOrdersCount: 1,
      orderIds: ['order-id-123']
    });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await runInventorySweeperPass(mockDb);

    expect(sweepSpy).toHaveBeenCalledWith(mockDb, expect.any(Date));
    expect(result).toEqual({
      releasedReservationsCount: 2,
      affectedVariantsCount: 1,
      cancelledOrdersCount: 1
    });

    expect(consoleSpy).toHaveBeenCalled();
    const logCall = consoleSpy.mock.calls[0]?.[0];
    expect(logCall).toContain('Inventory hold sweeper completed pass');
    expect(logCall).toContain('order-id-123');
  });

  it('runs a sweeper pass cleanly without logging when no expired reservations are found', async () => {
    vi.spyOn(dbModule, 'sweepExpiredReservations').mockResolvedValue({
      releasedReservationsCount: 0,
      affectedVariantsCount: 0,
      cancelledOrdersCount: 0,
      orderIds: []
    });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await runInventorySweeperPass(mockDb);

    expect(result).toEqual({
      releasedReservationsCount: 0,
      affectedVariantsCount: 0,
      cancelledOrdersCount: 0
    });
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('starts continuous sweeper on timer interval and stops cleanly on teardown', async () => {
    vi.useFakeTimers();

    const sweepSpy = vi.spyOn(dbModule, 'sweepExpiredReservations').mockResolvedValue({
      releasedReservationsCount: 0,
      affectedVariantsCount: 0,
      cancelledOrdersCount: 0,
      orderIds: []
    });

    const stopSweeper = startInventorySweeper(mockDb, 5000);

    // Initial state: not called yet
    expect(sweepSpy).not.toHaveBeenCalled();

    // Advance 5s -> should fire once
    await vi.advanceTimersByTimeAsync(5000);
    expect(sweepSpy).toHaveBeenCalledTimes(1);

    // Advance another 5s -> should fire twice
    await vi.advanceTimersByTimeAsync(5000);
    expect(sweepSpy).toHaveBeenCalledTimes(2);

    // Teardown
    stopSweeper();

    // Advance 10s -> should NOT fire anymore
    await vi.advanceTimersByTimeAsync(10000);
    expect(sweepSpy).toHaveBeenCalledTimes(2);
  });

  it('catches and logs errors during sweeper interval execution without throwing', async () => {
    vi.useFakeTimers();

    vi.spyOn(dbModule, 'sweepExpiredReservations').mockRejectedValue(
      new Error('Database connectivity lost')
    );

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const stopSweeper = startInventorySweeper(mockDb, 3000);

    await vi.advanceTimersByTimeAsync(3000);

    expect(consoleErrorSpy).toHaveBeenCalled();
    const errorLog = consoleErrorSpy.mock.calls[0]?.[0];
    expect(errorLog).toContain('Unhandled error during inventory sweeper pass');
    expect(errorLog).toContain('Database connectivity lost');

    stopSweeper();
  });
});
