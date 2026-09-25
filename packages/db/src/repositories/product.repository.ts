import { and, asc, eq, sql } from 'drizzle-orm';

import {
  type CreateProductInput,
  DEFAULT_LEGAL_METROLOGY,
  type ProductCustomizationRule,
  type PublicProductDetail,
  type PublicProductListItem,
  type PublicVariantItem
} from '@hh/domain';

import {
  categories,
  inventoryLevels,
  type Product,
  productImages,
  products,
  type ProductVariant,
  productVariants
} from '../schema';

import type { DatabaseClient } from '../index';

export async function listPublishedProducts(
  db: DatabaseClient,
  storeId: string,
  options: { categorySlug?: string | undefined } = {}
): Promise<PublicProductListItem[]> {
  const conditions = [eq(products.storeId, storeId), eq(products.status, 'published')];

  if (options.categorySlug) {
    conditions.push(
      sql`(${categories.slug} = ${options.categorySlug} OR ${products.categoryId} IN (
        SELECT c_sub.id FROM ${categories} c_sub WHERE c_sub.parent_id = (
          SELECT c_parent.id FROM ${categories} c_parent WHERE c_parent.slug = ${options.categorySlug} AND c_parent.store_id = ${storeId} LIMIT 1
        )
      ))`
    );
  }

  const publishedProducts = await db
    .select({
      id: products.id,
      slug: products.slug,
      title: products.title,
      department: products.department,
      isCustomizable: products.isCustomizable,
      tags: products.tags,
      categoryName: categories.name,
      startingPriceMinor: sql<number>`COALESCE((
        SELECT MIN(${productVariants.priceMinor})
        FROM ${productVariants}
        WHERE ${productVariants.productId} = ${products.id}
          AND ${productVariants.isActive} = true
      ), 0)::int`,
      currency: sql<string>`COALESCE((
        SELECT ${productVariants.currency}
        FROM ${productVariants}
        WHERE ${productVariants.productId} = ${products.id}
          AND ${productVariants.isActive} = true
        ORDER BY ${productVariants.sortOrder} ASC
        LIMIT 1
      ), 'INR')`,
      primaryImageUrl: sql<string | null>`(
        SELECT ${productImages.url}
        FROM ${productImages}
        WHERE ${productImages.productId} = ${products.id}
        ORDER BY ${productImages.sortOrder} ASC
        LIMIT 1
      )`,
      secondaryImageUrl: sql<string | null>`(
        SELECT ${productImages.url}
        FROM ${productImages}
        WHERE ${productImages.productId} = ${products.id}
        ORDER BY ${productImages.sortOrder} ASC
        LIMIT 1 OFFSET 1
      )`,
      compareAtPriceMinor: sql<number | null>`(
        SELECT ${productVariants.compareAtPriceMinor}
        FROM ${productVariants}
        WHERE ${productVariants.productId} = ${products.id}
          AND ${productVariants.isActive} = true
        ORDER BY ${productVariants.sortOrder} ASC
        LIMIT 1
      )`,
      activeVariantCount: sql<number>`(
        SELECT COUNT(*)::int
        FROM ${productVariants}
        WHERE ${productVariants.productId} = ${products.id}
          AND ${productVariants.isActive} = true
      )`,
      firstVariantId: sql<string | null>`(
        SELECT ${productVariants.id}
        FROM ${productVariants}
        WHERE ${productVariants.productId} = ${products.id}
          AND ${productVariants.isActive} = true
        ORDER BY ${productVariants.sortOrder} ASC
        LIMIT 1
      )`,
      createdAt: products.createdAt,
      totalAvailable: sql<number>`COALESCE((
        SELECT SUM(GREATEST(0, ${inventoryLevels.onHand} - ${inventoryLevels.reserved}))
        FROM ${inventoryLevels}
        INNER JOIN ${productVariants} ON ${inventoryLevels.variantId} = ${productVariants.id}
        WHERE ${productVariants.productId} = ${products.id}
          AND ${productVariants.isActive} = true
      ), 0)::int`
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(asc(products.createdAt));

  return publishedProducts.map((prod) => {
    const totalAvail = Number(prod.totalAvailable ?? 0);
    const startPrice = Number(prod.startingPriceMinor ?? 0);
    const compPrice = prod.compareAtPriceMinor != null ? Number(prod.compareAtPriceMinor) : null;
    const isSale = compPrice != null && compPrice > startPrice;
    const isLow = totalAvail > 0 && totalAvail <= 5;
    const isNew = prod.createdAt
      ? Date.now() - new Date(prod.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000
      : false;
    const variantCount = Number(prod.activeVariantCount ?? 1);

    return {
      id: prod.id,
      slug: prod.slug,
      title: prod.title,
      department: prod.department ?? undefined,
      isCustomizable: prod.isCustomizable ?? false,
      tags: (prod.tags as string[]) ?? [],
      startingPriceMinor: startPrice,
      compareAtPriceMinor: compPrice,
      currency: prod.currency || 'INR',
      primaryImageUrl: prod.primaryImageUrl ?? null,
      secondaryImageUrl: prod.secondaryImageUrl ?? null,
      categoryName: prod.categoryName ?? null,
      isAvailable: totalAvail > 0,
      totalAvailable: totalAvail,
      firstVariantId: prod.firstVariantId ?? null,
      hasMultipleVariants: variantCount > 1,
      isOnSale: isSale,
      isLowStock: isLow,
      isNew
    };
  });
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
      department: products.department,
      isCustomizable: products.isCustomizable,
      customizationConfig: products.customizationConfig,
      specifications: products.specifications,
      tags: products.tags,
      seoTitle: products.seoTitle,
      seoDescription: products.seoDescription,
      countryOfOrigin: products.countryOfOrigin,
      netQuantity: products.netQuantity,
      commodityName: products.commodityName,
      manufacturerName: products.manufacturerName,
      manufacturerAddress: products.manufacturerAddress,
      packerName: products.packerName,
      packerAddress: products.packerAddress,
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
      options: productVariants.options,
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
      options: (v.options as { name: string; value: string }[]) ?? undefined,
      isAvailable: available > 0,
      availableQuantity: available
    };
  });

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    description: product.description,
    department: product.department ?? undefined,
    currency: variants[0]?.currency ?? 'INR',
    isCustomizable: product.isCustomizable ?? false,
    customizationConfig: (product.customizationConfig as ProductCustomizationRule | null) ?? null,
    specifications: (product.specifications as Record<string, string | number | boolean>) ?? {},
    tags: (product.tags as string[]) ?? [],
    countryOfOrigin:
      product.countryOfOrigin ??
      (product.specifications?.['country_of_origin'] as string) ??
      DEFAULT_LEGAL_METROLOGY.countryOfOrigin,
    netQuantity:
      product.netQuantity ??
      (product.specifications?.['net_quantity'] as string) ??
      DEFAULT_LEGAL_METROLOGY.netQuantity,
    commodityName:
      product.commodityName ??
      (product.specifications?.['commodity_name'] as string) ??
      product.title ??
      DEFAULT_LEGAL_METROLOGY.commodityName,
    manufacturerDetails: product.manufacturerName
      ? {
          name: product.manufacturerName,
          address: product.manufacturerAddress ?? DEFAULT_LEGAL_METROLOGY.manufacturer.address,
          email: DEFAULT_LEGAL_METROLOGY.manufacturer.email,
          phone: DEFAULT_LEGAL_METROLOGY.manufacturer.phone
        }
      : DEFAULT_LEGAL_METROLOGY.manufacturer,
    packerDetails: product.packerName
      ? {
          name: product.packerName,
          address: product.packerAddress ?? DEFAULT_LEGAL_METROLOGY.packer?.address ?? ''
        }
      : DEFAULT_LEGAL_METROLOGY.packer,
    consumerCareDetails: DEFAULT_LEGAL_METROLOGY.consumerCare,
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
        department: input.department ?? 'unisex',
        slug: input.slug,
        title: input.title,
        description: input.description,
        status: input.status,
        isCustomizable: input.isCustomizable ?? false,
        customizationConfig: input.customizationConfig ?? null,
        specifications: input.specifications ?? {},
        tags: input.tags ?? [],
        countryOfOrigin: input.countryOfOrigin ?? 'India',
        netQuantity: input.netQuantity ?? '1 N',
        commodityName: input.commodityName ?? null,
        manufacturerName: input.manufacturerName ?? null,
        manufacturerAddress: input.manufacturerAddress ?? null,
        packerName: input.packerName ?? null,
        packerAddress: input.packerAddress ?? null,
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
          options: v.options ?? [],
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

    if (input.images && input.images.length > 0) {
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
