import { and, eq, gte, inArray, sql } from 'drizzle-orm';

import { NotFoundError } from '@hh/domain';
import {
  buildTimeframeDateRange,
  calculateAov,
  calculateRepeatRate,
  type ExecutiveInsightsData,
  type InsightTimeframe
} from '@hh/domain';

import { inventoryLevels } from '../schema/inventory';
import { orderItems, orders } from '../schema/orders';
import { stores } from '../schema/stores';

import type { DatabaseClient } from '../index';

/**
 * Retrieves executive insights, financial scoreboard, customer frequency metrics,
 * and product sales velocity for a given store and timeframe.
 */
export async function getExecutiveInsights(
  db: DatabaseClient,
  storeSlug: string,
  timeframe: InsightTimeframe = 'week'
): Promise<ExecutiveInsightsData> {
  const [store] = await db.select().from(stores).where(eq(stores.slug, storeSlug)).limit(1);
  if (!store) {
    throw new NotFoundError('Store', storeSlug);
  }

  const { startDate } = buildTimeframeDateRange(timeframe);

  // 1. Sales & Volume Scoreboard
  const salesConditions = [
    eq(orders.storeId, store.id),
    inArray(orders.status, ['paid', 'processing', 'completed']),
    eq(orders.paymentStatus, 'captured')
  ];

  if (startDate) {
    salesConditions.push(gte(orders.createdAt, startDate));
  }

  const [salesAgg] = await db
    .select({
      revenue: sql<string>`COALESCE(SUM(${orders.totalMinor}), 0)`,
      count: sql<string>`COUNT(${orders.id})`
    })
    .from(orders)
    .where(and(...salesConditions));

  const revenueMinor = parseInt(salesAgg?.revenue ?? '0', 10);
  const orderCount = parseInt(salesAgg?.count ?? '0', 10);
  const aovMinor = calculateAov(revenueMinor, orderCount);

  // Pending packing & dispatch count (Orders paid/processing but not yet shipped)
  const [pendingAgg] = await db
    .select({
      count: sql<string>`COUNT(${orders.id})`
    })
    .from(orders)
    .where(
      and(
        eq(orders.storeId, store.id),
        inArray(orders.status, ['paid', 'processing']),
        inArray(orders.fulfillmentStatus, ['unfulfilled', 'partially_fulfilled'])
      )
    );

  const pendingFulfillmentCount = parseInt(pendingAgg?.count ?? '0', 10);

  // 2. Customer Frequency & Repeat Intelligence
  // Analyzes customer loyalty across all captured orders in the store
  const customerRows = await db
    .select({
      email: orders.customerEmail,
      name: sql<string>`MAX(${orders.customerName})`,
      phone: sql<string>`MAX(${orders.customerPhone})`,
      orderCount: sql<string>`COUNT(${orders.id})`,
      totalSpend: sql<string>`COALESCE(SUM(${orders.totalMinor}), 0)`,
      firstOrderAt: sql<string>`MIN(${orders.createdAt})`,
      lastOrderAt: sql<string>`MAX(${orders.createdAt})`
    })
    .from(orders)
    .where(
      and(
        eq(orders.storeId, store.id),
        inArray(orders.status, ['paid', 'processing', 'completed']),
        eq(orders.paymentStatus, 'captured')
      )
    )
    .groupBy(orders.customerEmail)
    .orderBy(sql`COUNT(${orders.id}) DESC`, sql`COALESCE(SUM(${orders.totalMinor}), 0) DESC`);

  const totalCustomers = customerRows.length;
  const repeatCustomers = customerRows.filter((r) => parseInt(r.orderCount, 10) > 1).length;
  const repeatRatePercentage = calculateRepeatRate(repeatCustomers, totalCustomers);

  const topCustomers = customerRows.slice(0, 10).map((r) => {
    const oCount = parseInt(r.orderCount, 10);
    return {
      customerEmail: r.email,
      customerName: r.name || 'Patron',
      customerPhone: r.phone || '',
      orderCount: oCount,
      totalSpendMinor: parseInt(r.totalSpend, 10),
      firstOrderAt: r.firstOrderAt
        ? new Date(r.firstOrderAt).toISOString()
        : new Date().toISOString(),
      lastOrderAt: r.lastOrderAt ? new Date(r.lastOrderAt).toISOString() : new Date().toISOString(),
      isRepeatCustomer: oCount > 1
    };
  });

  // 3. Product Velocity Leaderboard
  const velocityConditions = [
    eq(orders.storeId, store.id),
    inArray(orders.status, ['paid', 'processing', 'completed']),
    eq(orders.paymentStatus, 'captured')
  ];

  if (startDate) {
    velocityConditions.push(gte(orders.createdAt, startDate));
  }

  const velocityRows = await db
    .select({
      variantId: orderItems.variantId,
      productName: orderItems.productNameSnapshot,
      variantTitle: orderItems.variantNameSnapshot,
      sku: orderItems.skuSnapshot,
      unitsSold: sql<string>`COALESCE(SUM(${orderItems.quantity}), 0)`,
      revenue: sql<string>`COALESCE(SUM(${orderItems.totalPriceMinor}), 0)`,
      currentOnHand: sql<string>`COALESCE(MAX(${inventoryLevels.onHand}), 0)`,
      currentReserved: sql<string>`COALESCE(MAX(${inventoryLevels.reserved}), 0)`
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .leftJoin(inventoryLevels, eq(orderItems.variantId, inventoryLevels.variantId))
    .where(and(...velocityConditions))
    .groupBy(
      orderItems.variantId,
      orderItems.productNameSnapshot,
      orderItems.variantNameSnapshot,
      orderItems.skuSnapshot
    )
    .orderBy(
      sql`COALESCE(SUM(${orderItems.quantity}), 0) DESC`,
      sql`COALESCE(SUM(${orderItems.totalPriceMinor}), 0) DESC`
    )
    .limit(10);

  const productVelocity = velocityRows.map((r) => ({
    productId: r.variantId ?? '',
    productTitle: r.productName,
    variantTitle: r.variantTitle,
    sku: r.sku,
    unitsSold: parseInt(r.unitsSold, 10),
    revenueMinor: parseInt(r.revenue, 10),
    currentStock: Math.max(0, parseInt(r.currentOnHand, 10) - parseInt(r.currentReserved, 10))
  }));

  // 4. Acquisition & Instagram Attribution Intelligence
  const attributionOrders = await db
    .select({
      totalMinor: orders.totalMinor,
      attribution: orders.attribution
    })
    .from(orders)
    .where(and(...salesConditions));

  const channelMap = new Map<string, { count: number; revenueMinor: number }>();
  const campaignMap = new Map<string, { source: string; count: number; revenueMinor: number }>();

  for (const row of attributionOrders) {
    const attr = row.attribution;
    const source = (attr?.source || 'direct').toLowerCase();
    const campaign = attr?.campaign;

    const currentChannel = channelMap.get(source) ?? { count: 0, revenueMinor: 0 };
    channelMap.set(source, {
      count: currentChannel.count + 1,
      revenueMinor: currentChannel.revenueMinor + row.totalMinor
    });

    if (campaign) {
      const currentCampaign = campaignMap.get(campaign) ?? { source, count: 0, revenueMinor: 0 };
      campaignMap.set(campaign, {
        source,
        count: currentCampaign.count + 1,
        revenueMinor: currentCampaign.revenueMinor + row.totalMinor
      });
    }
  }

  const totalAttributedRevenue = Array.from(channelMap.values()).reduce(
    (sum, c) => sum + c.revenueMinor,
    0
  );

  const channels = Array.from(channelMap.entries())
    .map(([source, data]) => ({
      source,
      orderCount: data.count,
      revenueMinor: data.revenueMinor,
      percentage:
        totalAttributedRevenue > 0
          ? Math.round((data.revenueMinor / totalAttributedRevenue) * 100)
          : 0
    }))
    .sort((a, b) => b.revenueMinor - a.revenueMinor);

  const topCampaigns = Array.from(campaignMap.entries())
    .map(([campaign, data]) => ({
      campaign,
      source: data.source,
      orderCount: data.count,
      revenueMinor: data.revenueMinor
    }))
    .sort((a, b) => b.revenueMinor - a.revenueMinor)
    .slice(0, 5);

  return {
    timeframe,
    sales: {
      revenueMinor,
      orderCount,
      aovMinor,
      pendingFulfillmentCount
    },
    customers: {
      totalCustomers,
      repeatCustomers,
      repeatRatePercentage,
      topCustomers
    },
    productVelocity,
    attribution: {
      channels,
      topCampaigns
    }
  };
}
