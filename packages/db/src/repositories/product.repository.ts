import { eq, and, asc, min } from 'drizzle-orm';
import {
  products,
  productVariants,
  productImages,
  categories,
  inventoryLevels,
  type Product,
  type ProductVariant
} from '../schema';
import type {
  CreateProductInput,
  PublicProductListItem,
  PublicProductDetail,
  PublicVariantItem
} from '@hh/domain';
import type { DatabaseClient } from '../index';

export async function listPublishedProducts(
  db: DatabaseClient,
  storeId: string,
  options: { categorySlug?: string } = {}
): Promise<PublicProductListItem[]> {
  const baseConditions = [eq(products.storeId, storeId), eq(products.status, 'published')];

  if (options.categorySlug) {
    const matchedCategory = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.storeId, storeId), eq(categories.slug, options.categorySlug)))
      .limit(1);

    if (matchedCategory[0]) {
      baseConditions.push(eq(products.categoryId, matchedCategory[0].id));
    }
  }

  const publishedProducts = await db
    .select({
      id: products.id,
      slug: products.slug,
      title: products.title,
      categoryName: categories.name
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...baseConditions));

  const items: PublicProductListItem[] = [];

  for (const prod of publishedProducts) {
    // Get lowest price and primary image
    const variantStats = await db
      .select({ minPrice: min(productVariants.priceMinor) })
      .from(productVariants)
      .where(and(eq(productVariants.productId, prod.id), eq(productVariants.isActive, true)));

    const image = await db
      .select({ url: productImages.url })
      .from(productImages)
      .where(eq(productImages.productId, prod.id))
      .orderBy(asc(productImages.sortOrder))
      .limit(1);

    // Check availability
    const inventory = await db
      .select({
        onHand: inventoryLevels.onHand,
        reserved: inventoryLevels.reserved
      })
      .from(inventoryLevels)
      .innerJoin(productVariants, eq(inventoryLevels.variantId, productVariants.id))
      .where(and(eq(productVariants.productId, prod.id), eq(productVariants.isActive, true)));

    const totalAvailable = inventory.reduce(
      (sum, row) => sum + Math.max(0, row.onHand - row.reserved),
      0
    );

    items.push({
      id: prod.id,
      slug: prod.slug,
      title: prod.title,
      startingPriceMinor: Number(variantStats[0]?.minPrice ?? 0),
      currency: 'INR',
      primaryImageUrl: image[0]?.url ?? null,
      categoryName: prod.categoryName ?? null,
      isAvailable: totalAvailable > 0
    });
  }

  return items;
}

export async function findProductBySlug(
  db: DatabaseClient,
  storeId: string,
  slug: string
): Promise<PublicProductDetail | null> {
  const productRows = await db
    .select({
      id: products.id,
      slug: products.slug,
      title: products.title,
      description: products.description,
      seoTitle: products.seoTitle,
      seoDescription: products.seoDescription,
      categoryId: categories.id,
      categorySlug: categories.slug,
      categoryName: categories.name
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(eq(products.storeId, storeId), eq(products.slug, slug)))
    .limit(1);

  const product = productRows[0];
  if (!product) return null;

  const variants = await db
    .select({
      id: productVariants.id,
      sku: productVariants.sku,
      title: productVariants.title,
      priceMinor: productVariants.priceMinor,
      compareAtPriceMinor: productVariants.compareAtPriceMinor,
      currency: productVariants.currency,
      onHand: inventoryLevels.onHand,
      reserved: inventoryLevels.reserved
    })
    .from(productVariants)
    .leftJoin(inventoryLevels, eq(productVariants.id, inventoryLevels.variantId))
    .where(and(eq(productVariants.productId, product.id), eq(productVariants.isActive, true)))
    .orderBy(asc(productVariants.sortOrder));

  const images = await db
    .select({
      id: productImages.id,
      url: productImages.url,
      altText: productImages.altText,
      sortOrder: productImages.sortOrder
    })
    .from(productImages)
    .where(eq(productImages.productId, product.id))
    .orderBy(asc(productImages.sortOrder));

  const publicVariants: PublicVariantItem[] = variants.map((v) => {
    const onHand = v.onHand ?? 0;
    const reserved = v.reserved ?? 0;
    const available = Math.max(0, onHand - reserved);

    return {
      id: v.id,
      sku: v.sku,
      title: v.title,
      priceMinor: Number(v.priceMinor),
      compareAtPriceMinor: v.compareAtPriceMinor ? Number(v.compareAtPriceMinor) : null,
      currency: v.currency,
      isAvailable: available > 0,
      availableQuantity: available
    };
  });

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    currency: variants[0]?.currency ?? 'INR',
    category: product.categoryId
      ? {
          id: product.categoryId,
          slug: product.categorySlug!,
          name: product.categoryName!
        }
      : null,
    variants: publicVariants,
    images,
    seo: {
      title: product.seoTitle,
      description: product.seoDescription
    }
  };
}

export async function createProductWithVariants(
  db: DatabaseClient,
  input: CreateProductInput
): Promise<{ product: Product; variants: ProductVariant[] }> {
  return await db.transaction(async (tx) => {
    const [createdProduct] = await tx
      .insert(products)
      .values({
        storeId: input.storeId,
        categoryId: input.categoryId,
        slug: input.slug,
        title: input.title,
        description: input.description,
        status: input.status,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription
      })
      .returning();

    if (!createdProduct) {
      throw new Error('Failed to create product record');
    }

    const createdVariants: ProductVariant[] = [];

    for (const v of input.variants) {
      const [createdVariant] = await tx
        .insert(productVariants)
        .values({
          productId: createdProduct.id,
          sku: v.sku,
          title: v.title,
          priceMinor: v.priceMinor,
          compareAtPriceMinor: v.compareAtPriceMinor,
          currency: v.currency,
          weightGrams: v.weightGrams,
          sortOrder: v.sortOrder,
          isActive: v.isActive
        })
        .returning();

      if (!createdVariant) {
        throw new Error(`Failed to create variant for SKU: ${v.sku}`);
      }

      // Initialize atomic inventory level record
      await tx.insert(inventoryLevels).values({
        variantId: createdVariant.id,
        onHand: v.initialQuantity,
        reserved: 0
      });

      createdVariants.push(createdVariant);
    }

    if (input.images.length > 0) {
      await tx.insert(productImages).values(
        input.images.map((img) => ({
          productId: createdProduct.id,
          storageKey: img.storageKey,
          url: img.url,
          altText: img.altText,
          sortOrder: img.sortOrder
        }))
      );
    }

    return {
      product: createdProduct,
      variants: createdVariants
    };
  });
}
