import { eq } from 'drizzle-orm';

import { NotFoundError, resolveServiceControl, resolveStorefrontConfig } from '@hh/domain';

import type { CreateStoreInput, ServiceControlConfig, StorefrontConfig } from '@hh/domain';

import { type Store, storeDomains, stores } from '../schema';

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

/**
 * Retrieves the current operational status and service circuit breaker config.
 */
export async function getStoreServiceControl(
  db: DatabaseClient,
  slug: string
): Promise<ServiceControlConfig> {
  const store = await findStoreBySlug(db, slug);
  if (!store) {
    throw new NotFoundError('Store', slug);
  }
  return resolveServiceControl(
    (store.settings as Record<string, unknown> | undefined)?.['serviceControl']
  );
}

/**
 * Atomically updates operational status, checkout/payment killswitches, and customer notices.
 */
export async function updateStoreServiceControl(
  db: DatabaseClient,
  slug: string,
  settings: Record<string, unknown>
): Promise<ServiceControlConfig> {
  const store = await findStoreBySlug(db, slug);
  if (!store) {
    throw new NotFoundError('Store', slug);
  }

  const current = resolveServiceControl(
    (store.settings as Record<string, unknown> | undefined)?.['serviceControl']
  );
  const updated = resolveServiceControl({
    ...current,
    ...settings
  });

  await db
    .update(stores)
    .set({
      settings: {
        ...store.settings,
        serviceControl: updated
      },
      updatedAt: new Date()
    })
    .where(eq(stores.id, store.id));

  return updated;
}

/**
 * Retrieves the current Server-Driven UI StorefrontConfig.
 */
export async function getStorefrontConfig(
  db: DatabaseClient,
  slug: string
): Promise<StorefrontConfig> {
  const store = await findStoreBySlug(db, slug);
  if (!store) {
    throw new NotFoundError('Store', slug);
  }
  return resolveStorefrontConfig(
    (store.settings as Record<string, unknown> | undefined)?.['storefront']
  );
}

/**
 * Atomically updates Server-Driven UI StorefrontConfig (announcements, hero banner, reassurance badges).
 */
export async function updateStorefrontConfig(
  db: DatabaseClient,
  slug: string,
  settings: Record<string, unknown>
): Promise<StorefrontConfig> {
  const store = await findStoreBySlug(db, slug);
  if (!store) {
    throw new NotFoundError('Store', slug);
  }

  const current = resolveStorefrontConfig(
    (store.settings as Record<string, unknown> | undefined)?.['storefront']
  );
  const updated = resolveStorefrontConfig({
    ...current,
    ...settings
  });

  await db
    .update(stores)
    .set({
      settings: {
        ...store.settings,
        storefront: updated
      },
      updatedAt: new Date()
    })
    .where(eq(stores.id, store.id));

  return updated;
}
