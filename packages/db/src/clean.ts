import * as readline from 'node:readline';
import postgres from 'postgres';

export interface TruncateGuardOptions {
  databaseUrl: string;
  nodeEnv?: string | undefined;
  appEnv?: string | undefined;
  allowDestructiveTruncate?: string | undefined;
  cliArgs?: string[] | undefined;
  isInteractive?: boolean | undefined;
}

export const LOCAL_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '[::1]',
  'postgres',
  'host.docker.internal'
]);

export function isLocalDatabase(databaseUrl: string): boolean {
  try {
    const parsed = new URL(databaseUrl);
    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    return LOCAL_HOSTNAMES.has(host) || LOCAL_HOSTNAMES.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function validateTruncateEnvironment(options: TruncateGuardOptions): {
  allowed: boolean;
  needsInteractiveConfirmation: boolean;
  reason?: string;
} {
  const {
    databaseUrl,
    nodeEnv = process.env['NODE_ENV'],
    appEnv = process.env['APP_ENV'],
    allowDestructiveTruncate = process.env['ALLOW_DESTRUCTIVE_DB_TRUNCATE'],
    cliArgs = process.argv.slice(2),
    isInteractive = Boolean(process.stdin.isTTY && process.stdout.isTTY)
  } = options;

  // 1. Strict production block: Never allow database truncate in production
  if (nodeEnv === 'production' || appEnv === 'production') {
    return {
      allowed: false,
      needsInteractiveConfirmation: false,
      reason: `Blocked: Refusing to truncate database. Destructive operations are strictly prohibited when NODE_ENV or APP_ENV is "production" (NODE_ENV=${nodeEnv}, APP_ENV=${appEnv}).`
    };
  }

  // 2. Validate URL structure
  let hostname: string;
  try {
    const parsed = new URL(databaseUrl);
    hostname = parsed.hostname.toLowerCase();
  } catch {
    return {
      allowed: false,
      needsInteractiveConfirmation: false,
      reason: `Blocked: Invalid DATABASE_URL format: ${databaseUrl}`
    };
  }

  const normalizedHost = hostname.replace(/^\[|\]$/g, '');
  const isLocal = LOCAL_HOSTNAMES.has(hostname) || LOCAL_HOSTNAMES.has(normalizedHost);
  const hasForceToken = allowDestructiveTruncate === 'true';
  const hasForceFlag = cliArgs.includes('--force') || cliArgs.includes('--yes');
  const hasRemoteBypassFlag = cliArgs.includes('--force-destructive-wipe');

  // 3. Remote host checks
  if (!isLocal) {
    if (!hasForceToken || !hasRemoteBypassFlag) {
      return {
        allowed: false,
        needsInteractiveConfirmation: false,
        reason: `Blocked: Refusing to truncate remote/non-local database host (${hostname}). For non-local databases, both ALLOW_DESTRUCTIVE_DB_TRUNCATE=true and --force-destructive-wipe CLI flag are mandatory.`
      };
    }
    return {
      allowed: true,
      needsInteractiveConfirmation: false
    };
  }

  // 4. Local host with explicit force token or flag
  if (hasForceToken || hasForceFlag) {
    return {
      allowed: true,
      needsInteractiveConfirmation: false
    };
  }

  // 5. Local host interactive confirmation
  if (isInteractive) {
    return {
      allowed: false,
      needsInteractiveConfirmation: true
    };
  }

  // 6. Non-interactive local host without confirmation token
  return {
    allowed: false,
    needsInteractiveConfirmation: false,
    reason:
      'Blocked: Non-interactive execution on local database requires ALLOW_DESTRUCTIVE_DB_TRUNCATE=true or --force flag.'
  };
}

async function promptUserConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 'y' || normalized === 'yes');
    });
  });
}

export async function cleanDatabase(databaseUrl?: string): Promise<void> {
  const targetUrl =
    databaseUrl ??
    process.env['DATABASE_URL'] ??
    'postgres://postgres:postgres@localhost:5432/hh_dev';

  const validation = validateTruncateEnvironment({
    databaseUrl: targetUrl,
    nodeEnv: process.env['NODE_ENV'],
    appEnv: process.env['APP_ENV'],
    allowDestructiveTruncate: process.env['ALLOW_DESTRUCTIVE_DB_TRUNCATE'],
    cliArgs: process.argv.slice(2),
    isInteractive: Boolean(process.stdin.isTTY && process.stdout.isTTY)
  });

  if (!validation.allowed) {
    if (validation.needsInteractiveConfirmation) {
      const confirmed = await promptUserConfirmation(
        `⚠️ WARNING: You are about to TRUNCATE all database tables on: ${targetUrl.replace(/:[^:@]+@/, ':****@')}\nAre you sure you want to proceed? (y/N): `
      );
      if (!confirmed) {
        console.log('⛔ Truncate operation cancelled by user.');
        return;
      }
    } else {
      console.error(`⛔ ${validation.reason}`);
      throw new Error(validation.reason);
    }
  }

  console.log('🧹 Cleaning database tables on:', targetUrl.replace(/:[^:@]+@/, ':****@'));

  const sql = postgres(targetUrl, { max: 1 });

  try {
    // Truncate all application and administrative tables in one atomic statement
    await sql.unsafe(`
      TRUNCATE TABLE 
        admin_audit_logs,
        admin_sessions,
        admin_users,
        inventory_audit_logs,
        inventory_reservations,
        inventory_levels,
        order_items,
        fulfillments,
        payment_attempts,
        webhook_events,
        analytics_events,
        outbox_events,
        grievance_tickets,
        orders,
        coupons,
        wishlist_items,
        family_members,
        user_addresses,
        user_sessions,
        otp_codes,
        users,
        product_images,
        product_variants,
        products,
        categories,
        store_domains,
        stores
      RESTART IDENTITY CASCADE;
    `);

    console.log('  ✓ All database tables truncated and identity sequences reset.');
  } catch (err: unknown) {
    console.error('❌ Failed to clean database:', err);
    throw err;
  } finally {
    await sql.end();
  }

  // Optional Storage cleanup (Local Floci S3)
  const s3Endpoint = process.env['S3_ENDPOINT'] ?? 'http://localhost:4566';
  const s3Bucket = process.env['S3_BUCKET_NAME'] ?? 'hh-media-dev';
  try {
    const ping = await fetch(`${s3Endpoint}/${s3Bucket}`, { method: 'HEAD' }).catch(() => null);
    if (ping && ping.ok) {
      console.log(`  ✓ Storage bucket verified: ${s3Bucket}`);
    }
  } catch {
    // Storage clean is best-effort for local environment
  }

  console.log('✨ Local environment database clean complete!');
}

// Direct CLI invocation guard
if (typeof process !== 'undefined' && process.argv[1] && /clean\.(ts|js)$/.test(process.argv[1])) {
  cleanDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error during clean:', err);
      process.exit(1);
    });
}
