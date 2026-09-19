import { and, asc, eq, inArray } from 'drizzle-orm';

import {
  buildCartSummary,
  type CartItemDetail,
  type CartItemInput,
  type CartSummary
} from '@hh/domain';

import { inventoryLevels, productImages, products, productVariants } from '../schema';

import type { DatabaseClient } from '../index';

export async function validateCartItems(
  db: DatabaseClient,
  storeId: string,
  items: CartItemInput[]
): Promise<CartSummary> {
  if (items.length === 0) {
    return buildCartSummary([], 'INR');
  }

  const variantIds = items.map((i) => i.variantId);

  // 1. Fetch active variants matching requested IDs for published products in the given store
  const rows = await db
    .select({
      variantId: productVariants.id,
      variantTitle: productVariants.title,
      sku: productVariants.sku,
      priceMinor: productVariants.priceMinor,
      compareAtPriceMinor: productVariants.compareAtPriceMinor,
      isVariantActive: productVariants.isActive,
      productId: products.id,
      productSlug: products.slug,
      productTitle: products.title,
      productStatus: products.status,
      onHand: inventoryLevels.onHand,
      reserved: inventoryLevels.reserved
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(inventoryLevels, eq(productVariants.id, inventoryLevels.variantId))
    .where(
      and(
        inArray(productVariants.id, variantIds),
        eq(products.storeId, storeId),
        eq(products.status, 'published'),
        eq(productVariants.isActive, true)
      )
    );

  const variantMap = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    variantMap.set(row.variantId, row);
  }

  // 2. Fetch primary images for all unique products involved
  const productIds = Array.from(new Set(rows.map((r) => r.productId)));
  const imageMap = new Map<string, string>();

  if (productIds.length > 0) {
    const images = await db
      .select({
        productId: productImages.productId,
        url: productImages.url
      })
      .from(productImages)
      .where(inArray(productImages.productId, productIds))
      .orderBy(asc(productImages.sortOrder));

    for (const img of images) {
      if (!imageMap.has(img.productId)) {
        imageMap.set(img.productId, img.url);
      }
    }
  }

  // 3. Assemble detailed cart items in the same order as requested
  const detailedItems: CartItemDetail[] = [];

  for (const item of items) {
    const matched = variantMap.get(item.variantId);

    if (!matched) {
      // Variant not found, deactivated, or unpublished
      detailedItems.push({
        variantId: item.variantId,
        productId: '',
        productSlug: '',
        productTitle: 'Unavailable Item',
        variantTitle: '',
        sku: '',
        priceMinor: 0,
        compareAtPriceMinor: null,
        currency: 'INR',
        primaryImageUrl: null,
        availableQuantity: 0,
        requestedQuantity: item.quantity,
        effectiveQuantity: 0,
        lineTotalMinor: 0,
        isAvailable: false,
        statusNotice: 'unavailable'
      });
      continue;
    }

    const availableQuantity = Math.max(0, (matched.onHand ?? 0) - (matched.reserved ?? 0));
    const primaryImageUrl = imageMap.get(matched.productId) ?? null;

    detailedItems.push({
      variantId: matched.variantId,
      productId: matched.productId,
      productSlug: matched.productSlug,
      productTitle: matched.productTitle,
      variantTitle: matched.variantTitle,
      sku: matched.sku,
      priceMinor: matched.priceMinor,
      compareAtPriceMinor: matched.compareAtPriceMinor ?? null,
      currency: 'INR',
      primaryImageUrl,
      availableQuantity,
      requestedQuantity: item.quantity,
      effectiveQuantity: item.quantity,
      lineTotalMinor: 0, // Computed authoritatively by buildCartSummary
      isAvailable: availableQuantity > 0,
      statusNotice: availableQuantity > 0 ? 'ok' : 'out_of_stock'
    });
  }

  return buildCartSummary(detailedItems, 'INR');
}
