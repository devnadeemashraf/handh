import postgres from 'postgres';

async function clean(): Promise<void> {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';

  console.log('🧹 Cleaning database tables on:', databaseUrl.replace(/:[^:@]+@/, ':****@'));

  const sql = postgres(databaseUrl, { max: 1 });

  try {
    // Truncate all application tables in one atomic statement
    await sql.unsafe(`
      TRUNCATE TABLE 
        inventory_audit_logs,
        inventory_reservations,
        inventory_levels,
        order_items,
        fulfillments,
        payment_attempts,
        webhook_events,
        outbox_events,
        orders,
        coupons,
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
    process.exit(1);
  } finally {
    await sql.end();
  }

  // Optional Storage cleanup (Local Floci S3)
  const s3Endpoint = process.env['S3_ENDPOINT'] ?? 'http://localhost:4566';
  const s3Bucket = process.env['S3_BUCKET_NAME'] ?? 'hh-media-dev';
  try {
    // Ping storage endpoint to see if Floci is up
    const ping = await fetch(`${s3Endpoint}/${s3Bucket}`, { method: 'HEAD' }).catch(() => null);
    if (ping && ping.ok) {
      console.log(`  ✓ Storage bucket verified: ${s3Bucket}`);
    }
  } catch {
    // Storage clean is best-effort for local environment
  }

  console.log('✨ Local environment database clean complete!');
  process.exit(0);
}

clean().catch((err) => {
  console.error('Fatal error during clean:', err);
  process.exit(1);
});
