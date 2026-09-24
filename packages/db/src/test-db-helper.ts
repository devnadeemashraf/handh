import { eq, inArray } from 'drizzle-orm';

import { cleanDatabase } from './clean';
import { closeDbClient, closeSharedDbClients } from './index';
import {
  categories,
  coupons,
  fulfillments,
  inventoryAuditLogs,
  inventoryLevels,
  inventoryReservations,
  orderItems,
  orders,
  paymentAttempts,
  productImages,
  products,
  productVariants,
  storeDomains,
  stores
} from './schema';

import type { DatabaseClient } from './index';

export { closeDbClient, closeSharedDbClients };

/**
 * Completely purges all database entities belonging to a specific test store.
 * Eliminates residual cross-test pollution and maintains strict isolation across test runs.
 */
export async function cleanupTestStore(db: DatabaseClient, storeId: string): Promise<void> {
  // 1. Collect all orders for this store
  const storeOrders = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.storeId, storeId));
  const orderIds = storeOrders.map((o) => o.id);

  if (orderIds.length > 0) {
    await db.delete(inventoryReservations).where(inArray(inventoryReservations.orderId, orderIds));
    await db.delete(paymentAttempts).where(inArray(paymentAttempts.orderId, orderIds));
    await db.delete(fulfillments).where(inArray(fulfillments.orderId, orderIds));
    await db.delete(orderItems).where(inArray(orderItems.orderId, orderIds));
    await db.delete(orders).where(eq(orders.storeId, storeId));
  }

  // 2. Collect all products and variants for this store
  const storeProducts = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.storeId, storeId));
  const productIds = storeProducts.map((p) => p.id);

  if (productIds.length > 0) {
    const storeVariants = await db
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(inArray(productVariants.productId, productIds));
    const variantIds = storeVariants.map((v) => v.id);

    if (variantIds.length > 0) {
      await db.delete(inventoryAuditLogs).where(inArray(inventoryAuditLogs.variantId, variantIds));
      await db
        .delete(inventoryReservations)
        .where(inArray(inventoryReservations.variantId, variantIds));
      await db.delete(inventoryLevels).where(inArray(inventoryLevels.variantId, variantIds));
    }

    await db.delete(productImages).where(inArray(productImages.productId, productIds));
    await db.delete(productVariants).where(inArray(productVariants.productId, productIds));
    await db.delete(products).where(eq(products.storeId, storeId));
  }

  // 3. Purge supporting store configurations and categories
  await db.delete(categories).where(eq(categories.storeId, storeId));
  await db.delete(coupons).where(eq(coupons.storeId, storeId));
  await db.delete(storeDomains).where(eq(storeDomains.storeId, storeId));
  await db.delete(stores).where(eq(stores.id, storeId));
}

/**
 * Truncates all database tables in the local development/test database.
 * Automatically injects the destructive truncate bypass token for non-interactive test harnesses.
 */
export async function truncateTestDatabase(databaseUrl?: string): Promise<void> {
  const previousToken = process.env['ALLOW_DESTRUCTIVE_DB_TRUNCATE'];
  try {
    process.env['ALLOW_DESTRUCTIVE_DB_TRUNCATE'] = 'true';
    await cleanDatabase(databaseUrl);
  } finally {
    if (previousToken !== undefined) {
      process.env['ALLOW_DESTRUCTIVE_DB_TRUNCATE'] = previousToken;
    } else {
      delete process.env['ALLOW_DESTRUCTIVE_DB_TRUNCATE'];
    }
  }
}
