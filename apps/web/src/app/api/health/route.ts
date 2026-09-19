import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';

import { createDbClient, sql } from '@hh/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export async function GET() {
  const startedAt = Date.now();

  // 1. Database Connectivity Probe
  let dbStatus: 'connected' | 'error' = 'connected';
  let dbLatencyMs = 0;
  let dbError: string | null = null;

  try {
    const db = getDatabase();
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    dbLatencyMs = Date.now() - dbStart;
  } catch (err) {
    dbStatus = 'error';
    dbError = err instanceof Error ? err.message : String(err);
  }

  // 2. Redis Connectivity Probe
  let redisStatus: 'connected' | 'error' | 'not_configured' = 'connected';
  let redisLatencyMs = 0;
  let redisError: string | null = null;

  try {
    const redis = getRedisClient();
    if (!redis) {
      redisStatus = 'not_configured';
    } else {
      const redisStart = Date.now();
      if (redis.status === 'wait') {
        await redis.connect().catch(() => {});
      }
      const pingRes = await Promise.race([
        redis.ping(),
        new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('Redis ping timeout (1500ms)')), 1500)
        )
      ]);
      if (pingRes !== 'PONG') {
        redisStatus = 'error';
        redisError = `Unexpected ping response: ${String(pingRes)}`;
      }
      redisLatencyMs = Date.now() - redisStart;
    }
  } catch (err) {
    redisStatus = 'error';
    redisError = err instanceof Error ? err.message : String(err);
  }

  // 3. Process Health & Resource Metrics
  const memory = process.memoryUsage();
  const uptimeSeconds = Math.floor(process.uptime());

  const isHealthy =
    dbStatus === 'connected' && (redisStatus === 'connected' || redisStatus === 'not_configured');
  const isDegraded = dbStatus === 'connected' && redisStatus === 'error';
  const overallStatus = isHealthy ? 'healthy' : isDegraded ? 'degraded' : 'unhealthy';

  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      uptimeSeconds,
      environment: process.env.NODE_ENV ?? 'development',
      services: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
          ...(dbError ? { error: dbError } : {})
        },
        redis: {
          status: redisStatus,
          latencyMs: redisLatencyMs,
          ...(redisError ? { error: redisError } : {})
        }
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          rssMb: Math.round(memory.rss / (1024 * 1024)),
          heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
          heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024))
        }
      }
    },
    {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    }
  );
}
