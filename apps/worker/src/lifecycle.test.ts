import { afterEach, describe, expect, it, vi } from 'vitest';

import * as dbModule from '@hh/db';

import type { DatabaseClient } from '@hh/db';

import { startOutboxPoller } from './poller/outbox-poller';
import { getRedisConnectionOptions } from './queues/connection';
import { startInventorySweeper } from './sweeper/inventory-sweeper';
import { startRetentionSweeper } from './sweeper/retention-sweeper';

import type { NotificationQueues } from './queues';

describe('Worker Lifecycle & Dedicated Redis Connection Packaging (E-COM-159, E-COM-160)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('getRedisConnectionOptions (E-COM-159)', () => {
    it('parses standard localhost redis URL with required BullMQ options', () => {
      const options = getRedisConnectionOptions('redis://localhost:6379');

      expect(options.host).toBe('localhost');
      expect(options.port).toBe(6379);
      expect(options.maxRetriesPerRequest).toBeNull();
      expect(options.enableReadyCheck).toBe(false);
      expect(typeof options.retryStrategy).toBe('function');
    });

    it('parses authenticated redis URL with credentials and database index', () => {
      const options = getRedisConnectionOptions(
        'redis://default:s3cr3tp4ss@redis-cluster.cloud:6380/3'
      );

      expect(options.host).toBe('redis-cluster.cloud');
      expect(options.port).toBe(6380);
      expect(options.username).toBe('default');
      expect(options.password).toBe('s3cr3tp4ss');
      expect(options.db).toBe(3);
      expect(options.maxRetriesPerRequest).toBeNull();
      expect(options.enableReadyCheck).toBe(false);
    });

    it('enables TLS configuration when rediss:// scheme is used', () => {
      const options = getRedisConnectionOptions('rediss://secure-cache.internal:6379');

      expect(options.host).toBe('secure-cache.internal');
      expect(options.port).toBe(6379);
      expect(options.tls).toBeDefined();
      expect(options.maxRetriesPerRequest).toBeNull();
    });

    it('falls back safely to default localhost options on unparseable input', () => {
      const options = getRedisConnectionOptions('not-a-valid-url');

      expect(options.host).toBe('localhost');
      expect(options.port).toBe(6379);
      expect(options.maxRetriesPerRequest).toBeNull();
      expect(options.enableReadyCheck).toBe(false);
    });

    it('allows custom options to override or extend base defaults', () => {
      const options = getRedisConnectionOptions('redis://localhost:6379', {
        connectTimeout: 5000,
        lazyConnect: true
      });

      expect(options.connectTimeout).toBe(5000);
      expect(options.lazyConnect).toBe(true);
      expect(options.maxRetriesPerRequest).toBeNull();
    });
  });

  describe('In-Flight Task Drain on Shutdown (E-COM-160)', () => {
    const mockDb = {} as DatabaseClient;

    it('startOutboxPoller teardown awaits in-flight active polling execution', async () => {
      vi.useFakeTimers();

      let inFlightFinished = false;
      const mockQueues = {
        emailQueue: { add: vi.fn() },
        whatsappQueue: { add: vi.fn() }
      } as unknown as NotificationQueues;

      vi.spyOn(dbModule, 'fetchPendingOutboxEvents').mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        inFlightFinished = true;
        return [];
      });

      const stopPoller = startOutboxPoller(mockDb, mockQueues, 1000);

      // Trigger interval tick
      await vi.advanceTimersByTimeAsync(1000);

      // Call stop while polling is in-flight
      const stopPromise = stopPoller();
      expect(inFlightFinished).toBe(false);

      // Advance time for the in-flight promise to finish
      await vi.advanceTimersByTimeAsync(600);
      await stopPromise;

      expect(inFlightFinished).toBe(true);
    });

    it('startInventorySweeper teardown awaits in-flight sweep pass', async () => {
      vi.useFakeTimers();

      let inFlightFinished = false;
      vi.spyOn(dbModule, 'sweepExpiredReservations').mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        inFlightFinished = true;
        return {
          releasedReservationsCount: 1,
          affectedVariantsCount: 1,
          cancelledOrdersCount: 1,
          orderIds: []
        };
      });

      const stopSweeper = startInventorySweeper(mockDb, 2000);

      // Trigger interval tick
      await vi.advanceTimersByTimeAsync(2000);

      // Call stop while sweep pass is in-flight
      const stopPromise = stopSweeper();
      expect(inFlightFinished).toBe(false);

      // Advance time for in-flight sweep pass
      await vi.advanceTimersByTimeAsync(1000);
      await stopPromise;

      expect(inFlightFinished).toBe(true);
    });

    it('startRetentionSweeper teardown awaits in-flight retention purge pass', async () => {
      vi.useFakeTimers();

      let inFlightFinished = false;
      vi.spyOn(dbModule, 'executeRetentionPurge').mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 400));
        inFlightFinished = true;
        return {
          purgedOtpsCount: 2,
          anonymizedOutboxEventsCount: 3,
          executedAt: new Date().toISOString()
        };
      });

      const stopRetention = startRetentionSweeper(mockDb, 5000);

      // Trigger tick
      await vi.advanceTimersByTimeAsync(5000);

      // Call stop while retention purge is in-flight
      const stopPromise = stopRetention();
      expect(inFlightFinished).toBe(false);

      await vi.advanceTimersByTimeAsync(500);
      await stopPromise;

      expect(inFlightFinished).toBe(true);
    });
  });
});
