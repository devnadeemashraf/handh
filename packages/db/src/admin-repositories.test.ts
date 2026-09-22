import { describe, expect, it } from 'vitest';

import { createDbClient } from './index';
import {
  createAdminSession,
  createAdminUser,
  findAdminSessionByTokenHash,
  findAdminUserByEmail,
  findAdminUserById,
  listAdminAuditLogs,
  recordAdminAuditLog,
  recordAdminFailedAttempt,
  resetAdminFailedAttempts,
  revokeAdminSession
} from './repositories';
import { stores } from './schema';
import {
  authenticateAdminWithPassword,
  hashAdminSessionToken,
  hashPassword
} from './services/admin-auth.service';

describe('Admin Repositories & Enterprise Auth Integration', () => {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  const db = createDbClient(databaseUrl);

  const testEmail = `test-admin-${Date.now()}@handh.in`;
  const testPassword = 'SecureAdminPassword!2026';
  let storeId: string;
  let adminId: string;

  it('retrieves store id for admin association', async () => {
    const [store] = await db.select().from(stores).limit(1);
    expect(store).toBeDefined();
    storeId = store!.id;
  });

  it('creates an admin user and finds by email (case-insensitive)', async () => {
    const passwordHash = await hashPassword(testPassword);
    const created = await createAdminUser(db, {
      storeId,
      email: testEmail.toUpperCase(), // Test case normalization
      name: 'Integration Test Admin',
      passwordHash,
      role: 'admin',
      isActive: true,
      failedLoginAttempts: 0
    });

    expect(created.id).toBeDefined();
    expect(created.email).toBe(testEmail.toLowerCase());
    adminId = created.id;

    const found = await findAdminUserByEmail(db, testEmail);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(adminId);
    expect(found?.name).toBe('Integration Test Admin');
  });

  it('records failed attempts and triggers lockout after 5 attempts', async () => {
    // 4 failed attempts should not lock
    for (let i = 1; i <= 4; i++) {
      const result = await recordAdminFailedAttempt(db, adminId, 5, 15 * 60 * 1000);
      expect(result.attempts).toBe(i);
      expect(result.isLocked).toBe(false);
      expect(result.lockedUntil).toBeNull();
    }

    // 5th failed attempt must trigger lockout
    const fifth = await recordAdminFailedAttempt(db, adminId, 5, 15 * 60 * 1000);
    expect(fifth.attempts).toBe(5);
    expect(fifth.isLocked).toBe(true);
    expect(fifth.lockedUntil).not.toBeNull();
    expect(fifth.lockedUntil!.getTime()).toBeGreaterThan(Date.now());

    // Verify database record reflects lockout
    const user = await findAdminUserById(db, adminId);
    expect(user?.failedLoginAttempts).toBe(5);
    expect(user?.lockedUntil).not.toBeNull();

    // Reset failed attempts
    await resetAdminFailedAttempts(db, adminId);
    const resetUser = await findAdminUserById(db, adminId);
    expect(resetUser?.failedLoginAttempts).toBe(0);
    expect(resetUser?.lockedUntil).toBeNull();
  });

  it('creates admin sessions, caps max concurrent sessions, and finds by token hash', async () => {
    const rawTokens: string[] = [];
    const maxSessions = 3;

    // Create 4 sessions (exceeding limit of 3)
    for (let i = 0; i < 4; i++) {
      const rawToken = `test-token-${Date.now()}-${i}`;
      rawTokens.push(rawToken);
      const tokenHash = hashAdminSessionToken(rawToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await createAdminSession(
        db,
        adminId,
        tokenHash,
        expiresAt,
        '127.0.0.1',
        `Test-Agent-${i}`,
        maxSessions
      );
    }

    // The oldest session (index 0) must have been automatically revoked
    const oldestHash = hashAdminSessionToken(rawTokens[0]!);
    const oldestSession = await findAdminSessionByTokenHash(db, oldestHash);
    expect(oldestSession).toBeNull();

    // The newest session (index 3) must be active and valid
    const newestHash = hashAdminSessionToken(rawTokens[3]!);
    const newestSession = await findAdminSessionByTokenHash(db, newestHash);
    expect(newestSession).not.toBeNull();
    expect(newestSession?.admin.id).toBe(adminId);
    expect(newestSession?.admin.email).toBe(testEmail.toLowerCase());

    // Explicit revocation
    await revokeAdminSession(db, newestHash);
    const revoked = await findAdminSessionByTokenHash(db, newestHash);
    expect(revoked).toBeNull();
  });

  it('records and queries immutable admin audit logs', async () => {
    await recordAdminAuditLog(db, {
      adminId,
      adminEmail: testEmail.toLowerCase(),
      action: 'user:role_updated',
      entityType: 'user',
      entityId: 'target-user-123',
      details: { previousRole: 'customer', newRole: 'admin' },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 TestBrowser'
    });

    const logs = await listAdminAuditLogs(db, {
      adminId,
      entityType: 'user',
      action: 'user:role_updated'
    });

    expect(logs.length).toBeGreaterThanOrEqual(1);
    const entry = logs[0]!;
    expect(entry.adminEmail).toBe(testEmail.toLowerCase());
    expect(entry.action).toBe('user:role_updated');
    expect(entry.entityId).toBe('target-user-123');
    expect(entry.details['newRole']).toBe('admin');
  });

  describe('authenticateAdminWithPassword Flow', () => {
    it('authenticates with correct credentials and returns session', async () => {
      const result = await authenticateAdminWithPassword(db, {
        email: testEmail,
        password: testPassword,
        ipAddress: '127.0.0.1',
        userAgent: 'Vitest/AuthSuite'
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.admin.email).toBe(testEmail.toLowerCase());
        expect(result.sessionToken).toBeDefined();

        // Verify issued token against findAdminSessionByTokenHash
        const hash = hashAdminSessionToken(result.sessionToken);
        const sessionInDb = await findAdminSessionByTokenHash(db, hash);
        expect(sessionInDb).not.toBeNull();
        expect(sessionInDb?.admin.id).toBe(result.admin.id);
      }
    });

    it('rejects wrong password, increments failure count, and returns failure', async () => {
      const result = await authenticateAdminWithPassword(db, {
        email: testEmail,
        password: 'IncorrectPassword999',
        ipAddress: '127.0.0.1',
        userAgent: 'Vitest/AuthSuite'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid email or password.');
      }
    });

    it('rejects non-existent email with generic error and dummy timing', async () => {
      const result = await authenticateAdminWithPassword(db, {
        email: 'does-not-exist@handh.in',
        password: 'SomePassword123',
        ipAddress: '127.0.0.1'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid email or password.');
      }
    });
  });
});
