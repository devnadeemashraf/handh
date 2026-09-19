import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { dirname, resolve } from 'path';
import postgres from 'postgres';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrate(): Promise<void> {
  const connectionString =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';

  console.log('Applying database migrations to:', connectionString.replace(/:[^:@]+@/, ':****@'));
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);

  const migrationsFolder = resolve(__dirname, '../migrations');
  await migrate(db, { migrationsFolder });
  await sql.end();

  console.log('✅ Database migrations applied successfully.');
}

runMigrate().catch((err: unknown) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
