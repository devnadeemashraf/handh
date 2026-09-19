import { and, desc, eq } from 'drizzle-orm';

import type { WishlistItem } from '@hh/domain';

import { type WishlistItemRecord, wishlistItems } from '../schema';

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
