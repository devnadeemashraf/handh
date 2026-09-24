import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDbClient } from './index';
import {
  adjustStock,
  createCategory,
  createPendingCheckoutOrder,
  createProductWithVariants,
  createStore,
  listAdminInventory,
  listInventoryAuditLogs,
  sweepExpiredReservations,
  updateProductStatus,
  updateVariantPrice
} from './repositories';
import {
  inventoryLevels,
  inventoryReservations,
  orders,
  outboxEvents,
  productVariants
} from './schema';
import { cleanupTestStore, closeDbClient } from './test-db-helper';

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

  describe('sweepExpiredReservations (E-COM-043, E-COM-117)', () => {
    it('releases expired holds, restores reserved inventory, cancels stale pending orders, and records outbox events', async () => {
      // 1. Create a pending order that holds 3 units of variantId
      const idempotencyKey = randomUUID();
      const order = await createPendingCheckoutOrder(db, {
        storeId,
        items: [{ variantId, quantity: 3 }],
        shippingAddress: {
          fullName: 'Expired Hold Tester',
          phone: '9876543210',
          email: 'sweeper@example.com',
          line1: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'IN'
        },
        idempotencyKey
      });

      // Verify initial hold
      const [invAfterOrder] = await db
        .select()
        .from(inventoryLevels)
        .where(eq(inventoryLevels.variantId, variantId));
      expect(invAfterOrder?.reserved).toBe(3);

      const [resBefore] = await db
        .select()
        .from(inventoryReservations)
        .where(eq(inventoryReservations.orderId, order.orderId));
      expect(resBefore?.status).toBe('active');

      // 2. Artificially expire this reservation (set expiresAt 5 minutes ago)
      const pastDate = new Date(Date.now() - 5 * 60 * 1000);
      await db
        .update(inventoryReservations)
        .set({ expiresAt: pastDate })
        .where(eq(inventoryReservations.id, resBefore!.id));

      // 3. Create a second order whose reservation is NOT expired (expires in 15 mins)
      const activeOrder = await createPendingCheckoutOrder(db, {
        storeId,
        items: [{ variantId, quantity: 2 }],
        shippingAddress: {
          fullName: 'Active Hold Tester',
          phone: '9876543211',
          email: 'active@example.com',
          line1: '456 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          postalCode: '400001',
          country: 'IN'
        },
        idempotencyKey: randomUUID()
      });

      // Reserved stock should now be 3 + 2 = 5
      const [invWithBoth] = await db
        .select()
        .from(inventoryLevels)
        .where(eq(inventoryLevels.variantId, variantId));
      expect(invWithBoth?.reserved).toBe(5);

      // 4. Run the sweeper
      const sweepResult = await sweepExpiredReservations(db);

      // Assert sweeper results
      expect(sweepResult.releasedReservationsCount).toBeGreaterThanOrEqual(1);
      expect(sweepResult.affectedVariantsCount).toBeGreaterThanOrEqual(1);
      expect(sweepResult.cancelledOrdersCount).toBeGreaterThanOrEqual(1);
      expect(sweepResult.orderIds).toContain(order.orderId);
      expect(sweepResult.orderIds).not.toContain(activeOrder.orderId);

      // Verify expired reservation status changed to 'released'
      const [resAfter] = await db
        .select()
        .from(inventoryReservations)
        .where(eq(inventoryReservations.id, resBefore!.id));
      expect(resAfter?.status).toBe('released');

      // Verify active reservation remains 'active'
      const [activeRes] = await db
        .select()
        .from(inventoryReservations)
        .where(eq(inventoryReservations.orderId, activeOrder.orderId));
      expect(activeRes?.status).toBe('active');

      // Verify reserved inventory level decremented by 3 (from 5 down to 2)
      const [invAfterSweep] = await db
        .select()
        .from(inventoryLevels)
        .where(eq(inventoryLevels.variantId, variantId));
      expect(invAfterSweep?.reserved).toBe(2);

      // Verify expired order was transitioned to 'cancelled'
      const [cancelledOrderRow] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, order.orderId));
      expect(cancelledOrderRow?.status).toBe('cancelled');

      // Verify active order remains 'pending_payment'
      const [activeOrderRow] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, activeOrder.orderId));
      expect(activeOrderRow?.status).toBe('pending_payment');

      // Verify outbox event 'order.cancelled' was emitted
      const [outboxEvent] = await db
        .select()
        .from(outboxEvents)
        .where(
          and(
            eq(outboxEvents.eventName, 'order.cancelled'),
            eq(outboxEvents.aggregateId, order.orderId)
          )
        );
      expect(outboxEvent).toBeDefined();
      expect(outboxEvent?.status).toBe('pending');
      expect((outboxEvent?.payload as Record<string, unknown>)?.['reason']).toBe(
        'reservation_expired'
      );

      // 5. Running sweep again immediately should find 0 expired reservations (idempotent vacuum)
      const secondSweepResult = await sweepExpiredReservations(db);
      expect(secondSweepResult.releasedReservationsCount).toBe(0);
      expect(secondSweepResult.cancelledOrdersCount).toBe(0);
      expect(secondSweepResult.orderIds).toEqual([]);

      // Cleanup: release activeOrder reservation so reserved drops back to 0
      await db
        .update(inventoryReservations)
        .set({ status: 'released' })
        .where(eq(inventoryReservations.id, activeRes!.id));
      await db
        .update(inventoryLevels)
        .set({ reserved: 0 })
        .where(eq(inventoryLevels.variantId, variantId));
    });

    it('enforces statutory audit immutability by blocking variant deletion when audit history exists (E-COM-100)', async () => {
      // variantId already has audit log entries created during earlier stock adjustments
      const auditLogsBefore = await listInventoryAuditLogs(db, variantId);
      expect(auditLogsBefore.length).toBeGreaterThan(0);

      // Attempting to delete the product variant row directly MUST fail due to ON DELETE RESTRICT foreign key
      await expect(
        db.delete(productVariants).where(eq(productVariants.id, variantId))
      ).rejects.toThrow(/foreign key|violates foreign key constraint|restrict/i);

      // Verify audit logs remain 100% intact and uncorrupted
      const auditLogsAfter = await listInventoryAuditLogs(db, variantId);
      expect(auditLogsAfter.length).toBe(auditLogsBefore.length);
    });
  });

  afterAll(async () => {
    await cleanupTestStore(db, storeId);
    await closeDbClient(db);
  });
});
