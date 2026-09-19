import { and, asc, desc, eq, inArray } from 'drizzle-orm';

import type {
  CurrencyCode,
  WishlistItem,
  WishlistItemWithDetails,
  WishlistProductInfo
} from '@hh/domain';

import {
  productImages,
  products,
  productVariants,
  type WishlistItemRecord,
  wishlistItems
} from '../schema';

import type { DatabaseClient } from '../index';

export function toDomainWishlistItem(record: WishlistItemRecord): WishlistItem {
  return {
    id: record.id,
    userId: record.userId,
    productId: record.productId,
    variantId: record.variantId,
    addedAt: record.addedAt.toISOString()
  };
}

export async function listWishlistItems(
  db: DatabaseClient,
  userId: string
): Promise<WishlistItem[]> {
  const rows = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId))
    .orderBy(desc(wishlistItems.addedAt));

  return rows.map(toDomainWishlistItem);
}

export async function listWishlistItemsWithDetails(
  db: DatabaseClient,
  userId: string
): Promise<WishlistItemWithDetails[]> {
  const rows = await db
    .select()
    .from(wishlistItems)
    .where(eq(wishlistItems.userId, userId))
    .orderBy(desc(wishlistItems.addedAt));

  if (rows.length === 0) {
    return [];
  }

  const productIds = Array.from(new Set(rows.map((r) => r.productId)));

  const [prods, variants, images] = await Promise.all([
    db.select().from(products).where(inArray(products.id, productIds)),
    db
      .select()
      .from(productVariants)
      .where(
        and(inArray(productVariants.productId, productIds), eq(productVariants.isActive, true))
      )
      .orderBy(asc(productVariants.sortOrder)),
    db
      .select()
      .from(productImages)
      .where(inArray(productImages.productId, productIds))
      .orderBy(asc(productImages.sortOrder))
  ]);

  const productMap = new Map<string, (typeof prods)[number]>();
  for (const prod of prods) {
    productMap.set(prod.id, prod);
  }

  const defaultVariantMap = new Map<string, (typeof variants)[number]>();
  for (const v of variants) {
    if (!defaultVariantMap.has(v.productId)) {
      defaultVariantMap.set(v.productId, v);
    }
  }

  const primaryImageMap = new Map<string, string>();
  for (const img of images) {
    if (!primaryImageMap.has(img.productId)) {
      primaryImageMap.set(img.productId, img.url);
    }
  }

  return rows.map((row) => {
    const item = toDomainWishlistItem(row);
    const prod = productMap.get(row.productId);
    if (!prod) {
      return { ...item, product: null };
    }

    const matchedVariant = row.variantId
      ? variants.find((v) => v.id === row.variantId) || defaultVariantMap.get(row.productId)
      : defaultVariantMap.get(row.productId);

    const productInfo: WishlistProductInfo = {
      id: prod.id,
      title: prod.title,
      slug: prod.slug,
      priceMinor: matchedVariant ? matchedVariant.priceMinor : 0,
      compareAtPriceMinor: matchedVariant?.compareAtPriceMinor ?? null,
      currency: (matchedVariant?.currency as CurrencyCode) ?? 'INR',
      imageUrl: primaryImageMap.get(prod.id) ?? null,
      isAvailable: Boolean(matchedVariant && matchedVariant.isActive),
      defaultVariantId: matchedVariant?.id
    };

    return {
      ...item,
      product: productInfo
    };
  });
}

export async function addToWishlist(
  db: DatabaseClient,
  userId: string,
  productId: string,
  variantId?: string | undefined
): Promise<WishlistItem> {
  const [created] = await db
    .insert(wishlistItems)
    .values({
      userId,
      productId,
      ...(variantId !== undefined ? { variantId } : {})
    })
    .onConflictDoUpdate({
      target: [wishlistItems.userId, wishlistItems.productId],
      set: {
        ...(variantId !== undefined ? { variantId } : {}),
        addedAt: new Date()
      }
    })
    .returning();

  if (!created) {
    throw new Error('Failed to add item to wishlist.');
  }

  return toDomainWishlistItem(created);
}

export async function removeFromWishlist(
  db: DatabaseClient,
  userId: string,
  productId: string
): Promise<void> {
  await db
    .delete(wishlistItems)
    .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)));
}

export async function isInWishlist(
  db: DatabaseClient,
  userId: string,
  productId: string
): Promise<boolean> {
  const rows = await db
    .select({ id: wishlistItems.id })
    .from(wishlistItems)
    .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)))
    .limit(1);

  return rows.length > 0;
}
