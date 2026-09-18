import { eq } from 'drizzle-orm';
import { stores, storeDomains, type Store } from '../schema';
import type { CreateStoreInput } from '@hh/domain';
import type { DatabaseClient } from '../index';

export async function findStoreById(db: DatabaseClient, id: string): Promise<Store | null> {
  const result = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
  return result[0] ?? null;
}

export async function findStoreBySlug(db: DatabaseClient, slug: string): Promise<Store | null> {
  const result = await db.select().from(stores).where(eq(stores.slug, slug)).limit(1);
  return result[0] ?? null;
}

export async function findStoreByHostname(
  db: DatabaseClient,
  hostname: string
): Promise<Store | null> {
  const domainRecord = await db
    .select({ store: stores })
    .from(storeDomains)
    .innerJoin(stores, eq(storeDomains.storeId, stores.id))
    .where(eq(storeDomains.hostname, hostname))
    .limit(1);

  return domainRecord[0]?.store ?? null;
}

export async function createStore(db: DatabaseClient, input: CreateStoreInput): Promise<Store> {
  const [created] = await db
    .insert(stores)
    .values({
      slug: input.slug,
      name: input.name,
      description: input.description,
      defaultCurrency: input.defaultCurrency,
      isActive: input.isActive,
      settings: input.settings
    })
    .returning();

  if (!created) {
    throw new Error('Failed to create store record');
  }

  return created;
}
