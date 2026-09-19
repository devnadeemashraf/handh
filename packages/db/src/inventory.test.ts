import { describe, it, expect, beforeAll } from 'vitest';
import { createDbClient } from './index';
import {
  createStore,
  createCategory,
  createProductWithVariants,
  listAdminInventory,
  adjustStock,
  updateVariantPrice,
  updateProductStatus,
  listInventoryAuditLogs
} from './repositories';
import { inventoryLevels } from './schema';
import { eq } from 'drizzle-orm';

describe('Inventory Repository Integration', () => {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  const db = createDbClient(databaseUrl);

  const testStoreSlug = `inv-test-store-${Date.now()}`;
  let storeId: string;
  let productId: string;
  let variantId: string;

  beforeAll(async () => {
    const store = await createStore(db, {
      slug: testStoreSlug,
      name: 'Inventory Operations Store',
      defaultCurrency: 'INR',
      isActive: true,
      settings: {}
    });
    storeId = store.id;

    const category = await createCategory(db, {
      storeId,
      slug: 'accessories',
      name: 'Accessories',
      sortOrder: 1,
      isActive: true
    });

    const { product, variants } = await createProductWithVariants(db, {
      storeId,
      categoryId: category.id,
      slug: `inv-test-np-${Date.now()}`,
      title: 'Artisan Silver Nose Ring',
      description: 'Hand-hammered 925 silver nose ring',
      status: 'published',
      variants: [
        {
          sku: `SKU-INV-${Date.now()}`,
          title: '925 Silver',
          priceMinor: 49900,
          currency: 'INR',
          weightGrams: 5,
          sortOrder: 1,
          isActive: true,
          initialQuantity: 5
        }
      ],
      images: []
    });

    productId = product.id;
    variantId = variants[0]!.id;
  });

  it('lists admin inventory and calculates available stock and summary metrics', async () => {
    const result = await listAdminInventory(db, storeId);

    expect(result.items.length).toBe(1);
    const item = result.items[0]!;
    expect(item.productId).toBe(productId);
    expect(item.variantId).toBe(variantId);
    expect(item.onHand).toBe(5);
    expect(item.reserved).toBe(0);
    expect(item.available).toBe(5);
    expect(item.isLowStock).toBe(false); // 5 > 3
    expect(item.isOutOfStock).toBe(false);

    expect(result.summary.totalVariants).toBe(1);
    expect(result.summary.totalOnHand).toBe(5);
    expect(result.summary.totalAvailable).toBe(5);
  });

  it('adjusts stock positively and writes to audit log', async () => {
    const { level, auditLog } = await adjustStock(db, {
      variantId,
      delta: 10,
      reason: 'manual_restock',
      note: 'Batch received from artisan workshop'
    });

    expect(level.onHand).toBe(15);
    expect(auditLog.variantId).toBe(variantId);
    expect(auditLog.previousOnHand).toBe(5);
    expect(auditLog.newOnHand).toBe(15);
    expect(auditLog.delta).toBe(10);
    expect(auditLog.reason).toBe('manual_restock');
    expect(auditLog.note).toBe('Batch received from artisan workshop');
  });

  it('adjusts stock negatively for damaged items', async () => {
    const { level, auditLog } = await adjustStock(db, {
      variantId,
      delta: -3,
      reason: 'damaged',
      note: 'Transit damage'
    });

    expect(level.onHand).toBe(12);
    expect(auditLog.previousOnHand).toBe(15);
    expect(auditLog.newOnHand).toBe(12);
    expect(auditLog.delta).toBe(-3);
    expect(auditLog.reason).toBe('damaged');
  });

  it('rejects adjustment that causes on-hand to become negative', async () => {
    await expect(
      adjustStock(db, {
        variantId,
        delta: -50,
        reason: 'manual_correction'
      })
    ).rejects.toThrow(/negative on-hand stock/i);
  });

  it('rejects adjustment that causes on-hand to drop below reserved units', async () => {
    // Current onHand is 12. Set reserved = 10 (which is <= 12, satisfying chk_inventory_no_overselling)
    await db
      .update(inventoryLevels)
      .set({ reserved: 10 })
      .where(eq(inventoryLevels.variantId, variantId));

    // Trying to reduce onHand by 5 would result in newOnHand = 7 < 10 reserved.
    await expect(
      adjustStock(db, {
        variantId,
        delta: -5,
        reason: 'manual_correction'
      })
    ).rejects.toThrow(/below reserved units/i);

    // Reset reserved = 0
    await db
      .update(inventoryLevels)
      .set({ reserved: 0 })
      .where(eq(inventoryLevels.variantId, variantId));
  });

  it('updates variant price in minor units', async () => {
    await updateVariantPrice(db, {
      variantId,
      priceMinor: 59900
    });

    const result = await listAdminInventory(db, storeId);
    const item = result.items.find((i) => i.variantId === variantId);
    expect(item?.priceMinor).toBe(59900);
  });

  it('updates product status between published, draft, and archived', async () => {
    await updateProductStatus(db, {
      productId,
      status: 'draft'
    });

    let result = await listAdminInventory(db, storeId);
    let item = result.items.find((i) => i.productId === productId);
    expect(item?.productStatus).toBe('draft');

    await updateProductStatus(db, {
      productId,
      status: 'published'
    });

    result = await listAdminInventory(db, storeId);
    item = result.items.find((i) => i.productId === productId);
    expect(item?.productStatus).toBe('published');
  });

  it('lists inventory audit logs for the variant', async () => {
    const logs = await listInventoryAuditLogs(db, variantId);

    expect(logs.length).toBeGreaterThanOrEqual(2);
    expect(logs[0]?.variantId).toBe(variantId);
    expect(logs[0]?.productTitle).toBe('Artisan Silver Nose Ring');
  });
});
