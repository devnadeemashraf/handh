import { and, asc, desc, eq } from 'drizzle-orm';

import type {
  AdminInventoryItem,
  AdminInventorySummary,
  InventoryAuditLogItem,
  StockAdjustmentInput,
  UpdateProductStatusInput,
  UpdateVariantPriceInput
} from '@hh/domain';

import {
  type InventoryAuditLog,
  inventoryAuditLogs,
  type InventoryLevel,
  inventoryLevels,
  productImages,
  products,
  type ProductStatus,
  productVariants
} from '../schema';

import type { DatabaseClient } from '../index';

export async function listAdminInventory(
  db: DatabaseClient,
  storeId?: string
): Promise<{ items: AdminInventoryItem[]; summary: AdminInventorySummary }> {
  const baseConditions = [];
  if (storeId) {
    baseConditions.push(eq(products.storeId, storeId));
  }

  const variantRows = await db
    .select({
      productId: products.id,
      productTitle: products.title,
      productSlug: products.slug,
      productStatus: products.status,
      variantId: productVariants.id,
      variantSku: productVariants.sku,
      variantTitle: productVariants.title,
      priceMinor: productVariants.priceMinor,
      compareAtPriceMinor: productVariants.compareAtPriceMinor,
      currency: productVariants.currency,
      onHand: inventoryLevels.onHand,
      reserved: inventoryLevels.reserved,
      updatedAt: inventoryLevels.updatedAt
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(inventoryLevels, eq(productVariants.id, inventoryLevels.variantId))
    .where(baseConditions.length > 0 ? and(...baseConditions) : undefined)
    .orderBy(asc(products.title), asc(productVariants.sortOrder));

  const items: AdminInventoryItem[] = [];
  let totalOnHand = 0;
  let totalReserved = 0;
  let totalAvailable = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  for (const row of variantRows) {
    const primaryImg = await db
      .select({ url: productImages.url })
      .from(productImages)
      .where(eq(productImages.productId, row.productId))
      .orderBy(asc(productImages.sortOrder))
      .limit(1);

    const onHand = row.onHand ?? 0;
    const reserved = row.reserved ?? 0;
    const available = Math.max(0, onHand - reserved);
    const isLowStock = available <= 3 && available > 0;
    const isOutOfStock = available <= 0;

    totalOnHand += onHand;
    totalReserved += reserved;
    totalAvailable += available;
    if (isLowStock) lowStockCount++;
    if (isOutOfStock) outOfStockCount++;

    const item: AdminInventoryItem = {
      productId: row.productId,
      productTitle: row.productTitle,
      productSlug: row.productSlug,
      productStatus: row.productStatus,
      variantId: row.variantId,
      variantSku: row.variantSku,
      variantTitle: row.variantTitle,
      priceMinor: Number(row.priceMinor),
      currency: row.currency,
      onHand,
      reserved,
      available,
      isLowStock,
      isOutOfStock,
      updatedAt: (row.updatedAt ?? new Date()).toISOString()
    };

    if (row.compareAtPriceMinor !== null && row.compareAtPriceMinor !== undefined) {
      item.compareAtPriceMinor = Number(row.compareAtPriceMinor);
    }
    if (primaryImg[0]?.url) {
      item.primaryImageUrl = primaryImg[0].url;
    }

    items.push(item);
  }

  const summary: AdminInventorySummary = {
    totalVariants: items.length,
    totalOnHand,
    totalReserved,
    totalAvailable,
    lowStockCount,
    outOfStockCount
  };

  return { items, summary };
}

export async function adjustStock(
  db: DatabaseClient,
  input: StockAdjustmentInput
): Promise<{ level: InventoryLevel; auditLog: InventoryAuditLog }> {
  return await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(inventoryLevels)
      .where(eq(inventoryLevels.variantId, input.variantId))
      .for('update');

    let currentOnHand: number;
    let currentReserved: number;

    if (!existing[0]) {
      const [inserted] = await tx
        .insert(inventoryLevels)
        .values({
          variantId: input.variantId,
          onHand: 0,
          reserved: 0
        })
        .returning();
      currentOnHand = inserted!.onHand;
      currentReserved = inserted!.reserved;
    } else {
      currentOnHand = existing[0].onHand;
      currentReserved = existing[0].reserved;
    }

    const newOnHand = currentOnHand + input.delta;

    if (newOnHand < 0) {
      throw new Error(`Inventory adjustment would result in negative on-hand stock (${newOnHand})`);
    }

    if (newOnHand < currentReserved) {
      throw new Error(
        `Cannot adjust stock below reserved units (${newOnHand} < ${currentReserved} reserved for active orders)`
      );
    }

    const [updatedLevel] = await tx
      .update(inventoryLevels)
      .set({
        onHand: newOnHand,
        updatedAt: new Date()
      })
      .where(eq(inventoryLevels.variantId, input.variantId))
      .returning();

    const [auditLog] = await tx
      .insert(inventoryAuditLogs)
      .values({
        variantId: input.variantId,
        previousOnHand: currentOnHand,
        newOnHand,
        delta: input.delta,
        reason: input.reason,
        note: input.note ?? null
      })
      .returning();

    return {
      level: updatedLevel!,
      auditLog: auditLog!
    };
  });
}

export async function updateVariantPrice(
  db: DatabaseClient,
  input: UpdateVariantPriceInput
): Promise<void> {
  const result = await db
    .update(productVariants)
    .set({
      priceMinor: input.priceMinor,
      updatedAt: new Date()
    })
    .where(eq(productVariants.id, input.variantId))
    .returning({ id: productVariants.id });

  if (result.length === 0) {
    throw new Error(`Product variant not found: ${input.variantId}`);
  }
}

export async function updateProductStatus(
  db: DatabaseClient,
  input: UpdateProductStatusInput
): Promise<void> {
  const result = await db
    .update(products)
    .set({
      status: input.status as ProductStatus,
      updatedAt: new Date()
    })
    .where(eq(products.id, input.productId))
    .returning({ id: products.id });

  if (result.length === 0) {
    throw new Error(`Product not found: ${input.productId}`);
  }
}

export async function listInventoryAuditLogs(
  db: DatabaseClient,
  variantId?: string,
  limit = 50
): Promise<InventoryAuditLogItem[]> {
  const baseConditions = [];
  if (variantId) {
    baseConditions.push(eq(inventoryAuditLogs.variantId, variantId));
  }

  const rows = await db
    .select({
      id: inventoryAuditLogs.id,
      variantId: inventoryAuditLogs.variantId,
      variantSku: productVariants.sku,
      productTitle: products.title,
      previousOnHand: inventoryAuditLogs.previousOnHand,
      newOnHand: inventoryAuditLogs.newOnHand,
      delta: inventoryAuditLogs.delta,
      reason: inventoryAuditLogs.reason,
      note: inventoryAuditLogs.note,
      createdAt: inventoryAuditLogs.createdAt
    })
    .from(inventoryAuditLogs)
    .innerJoin(productVariants, eq(inventoryAuditLogs.variantId, productVariants.id))
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(baseConditions.length > 0 ? and(...baseConditions) : undefined)
    .orderBy(desc(inventoryAuditLogs.createdAt))
    .limit(limit);

  return rows.map((r) => {
    const item: InventoryAuditLogItem = {
      id: r.id,
      variantId: r.variantId,
      variantSku: r.variantSku,
      productTitle: r.productTitle,
      previousOnHand: r.previousOnHand,
      newOnHand: r.newOnHand,
      delta: r.delta,
      reason: r.reason,
      createdAt: r.createdAt.toISOString()
    };
    if (r.note) {
      item.note = r.note;
    }
    return item;
  });
}
