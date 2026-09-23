import { describe, expect, it } from 'vitest';

import { isLocalDatabase, LOCAL_HOSTNAMES, validateTruncateEnvironment } from './clean';

describe('Database Maintenance Safeguards (clean.ts / E-COM-099)', () => {
  describe('isLocalDatabase', () => {
    it('recognizes standard local hostnames and loopback addresses', () => {
      expect(isLocalDatabase('postgres://user:pass@localhost:5432/hh_dev')).toBe(true);
      expect(isLocalDatabase('postgres://user:pass@127.0.0.1:5432/hh_dev')).toBe(true);
      expect(isLocalDatabase('postgres://user:pass@[::1]:5432/hh_dev')).toBe(true);
      expect(isLocalDatabase('postgres://user:pass@postgres:5432/hh_dev')).toBe(true);
      expect(isLocalDatabase('postgres://user:pass@host.docker.internal:5432/hh_dev')).toBe(true);
    });

    it('rejects remote production or external cloud hostnames', () => {
      expect(isLocalDatabase('postgres://user:pass@db.production.aws.com:5432/hh_prod')).toBe(
        false
      );
      expect(
        isLocalDatabase('postgres://user:pass@ep-dry-pond-1234.us-east-1.aws.neon.tech/neondb')
      ).toBe(false);
      expect(isLocalDatabase('postgres://user:pass@db.supabase.co:5432/postgres')).toBe(false);
      expect(isLocalDatabase('postgres://user:pass@192.168.1.100:5432/hh_prod')).toBe(false);
      expect(isLocalDatabase('invalid-url-string')).toBe(false);
    });

    it('verifies LOCAL_HOSTNAMES set contents', () => {
      expect(LOCAL_HOSTNAMES.has('localhost')).toBe(true);
      expect(LOCAL_HOSTNAMES.has('127.0.0.1')).toBe(true);
      expect(LOCAL_HOSTNAMES.has('::1')).toBe(true);
      expect(LOCAL_HOSTNAMES.has('[::1]')).toBe(true);
      expect(LOCAL_HOSTNAMES.has('postgres')).toBe(true);
      expect(LOCAL_HOSTNAMES.has('host.docker.internal')).toBe(true);
    });
  });

  describe('validateTruncateEnvironment', () => {
    const localDbUrl = 'postgres://postgres:postgres@localhost:5432/hh_dev';
    const remoteDbUrl =
      'postgres://admin:secret@production-db.rds.amazonaws.com:5432/hh_production';

    it('strictly forbids database truncation if NODE_ENV is production', () => {
      const result = validateTruncateEnvironment({
        databaseUrl: localDbUrl,
        nodeEnv: 'production',
        appEnv: 'development',
        allowDestructiveTruncate: 'true',
        cliArgs: ['--force', '--force-destructive-wipe'],
        isInteractive: true
      });

      expect(result.allowed).toBe(false);
      expect(result.needsInteractiveConfirmation).toBe(false);
      expect(result.reason).toMatch(
        /strictly prohibited when NODE_ENV or APP_ENV is "production"/i
      );
    });

    it('strictly forbids database truncation if APP_ENV is production', () => {
      const result = validateTruncateEnvironment({
        databaseUrl: localDbUrl,
        nodeEnv: 'development',
        appEnv: 'production',
        allowDestructiveTruncate: 'true',
        cliArgs: ['--force'],
        isInteractive: true
      });

      expect(result.allowed).toBe(false);
      expect(result.needsInteractiveConfirmation).toBe(false);
      expect(result.reason).toMatch(
        /strictly prohibited when NODE_ENV or APP_ENV is "production"/i
      );
    });

    it('rejects invalid database URL strings', () => {
      const result = validateTruncateEnvironment({
        databaseUrl: 'not_a_valid_url',
        nodeEnv: 'development',
        appEnv: 'development'
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/Invalid DATABASE_URL format/i);
    });

    it('blocks remote database truncation when confirmation token is missing', () => {
      const result = validateTruncateEnvironment({
        databaseUrl: remoteDbUrl,
        nodeEnv: 'staging',
        appEnv: 'staging',
        allowDestructiveTruncate: undefined,
        cliArgs: ['--force-destructive-wipe'],
        isInteractive: false
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/Refusing to truncate remote\/non-local database host/i);
    });

    it('blocks remote database truncation when --force-destructive-wipe flag is missing', () => {
      const result = validateTruncateEnvironment({
        databaseUrl: remoteDbUrl,
        nodeEnv: 'staging',
        appEnv: 'staging',
        allowDestructiveTruncate: 'true',
        cliArgs: ['--force'], // Only standard force, missing remote bypass flag
        isInteractive: false
      });

      expect(result.allowed).toBe(false);
      expect(result.reason).toMatch(/Refusing to truncate remote\/non-local database host/i);
    });

    it('permits remote database truncation in non-production ONLY when both token and --force-destructive-wipe are supplied', () => {
      const result = validateTruncateEnvironment({
        databaseUrl: remoteDbUrl,
        nodeEnv: 'staging',
        appEnv: 'staging',
        allowDestructiveTruncate: 'true',
        cliArgs: ['--force-destructive-wipe'],
        isInteractive: false
      });

      expect(result.allowed).toBe(true);
      expect(result.needsInteractiveConfirmation).toBe(false);
    });

    it('permits local database truncation when ALLOW_DESTRUCTIVE_DB_TRUNCATE=true', () => {
      const result = validateTruncateEnvironment({
        databaseUrl: localDbUrl,
        nodeEnv: 'development',
        appEnv: 'development',
        allowDestructiveTruncate: 'true',
        cliArgs: [],
        isInteractive: false
      });

      expect(result.allowed).toBe(true);
      expect(result.needsInteractiveConfirmation).toBe(false);
    });

    it('permits local database truncation when --force or --yes CLI flag is passed', () => {
      const resultWithForce = validateTruncateEnvironment({
        databaseUrl: localDbUrl,
        nodeEnv: 'development',
        cliArgs: ['--force'],
        isInteractive: false
      });
      expect(resultWithForce.allowed).toBe(true);

      const resultWithYes = validateTruncateEnvironment({
        databaseUrl: localDbUrl,
        nodeEnv: 'development',
        cliArgs: ['--yes'],
        isInteractive: false
      });
      expect(resultWithYes.allowed).toBe(true);
    });

    it('requests interactive confirmation when running locally with TTY and no force flags', () => {
      const result = validateTruncateEnvironment({
        databaseUrl: localDbUrl,
        nodeEnv: 'development',
        appEnv: 'development',
        allowDestructiveTruncate: undefined,
        cliArgs: [],
        isInteractive: true
      });

      expect(result.allowed).toBe(false);
      expect(result.needsInteractiveConfirmation).toBe(true);
    });

    it('rejects local database truncation in non-interactive environment without flags', () => {
      const result = validateTruncateEnvironment({
        databaseUrl: localDbUrl,
        nodeEnv: 'development',
        appEnv: 'development',
        allowDestructiveTruncate: undefined,
        cliArgs: [],
        isInteractive: false
      });

      expect(result.allowed).toBe(false);
      expect(result.needsInteractiveConfirmation).toBe(false);
      expect(result.reason).toMatch(/Non-interactive execution on local database requires/i);
    });
  });
});
