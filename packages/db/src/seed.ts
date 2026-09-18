import { eq, and } from 'drizzle-orm';
import { createDbClient } from './index';
import { stores, storeDomains, categories, products, inventoryLevels } from './schema';
import { createProductWithVariants } from './repositories';

async function seed(): Promise<void> {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';

  console.log('🌱 Starting database seeding on:', databaseUrl.replace(/:[^:@]+@/, ':****@'));
  const db = createDbClient(databaseUrl);

  // 1. Create or Find Parent Store (H&H)
  const existingStore = await db.select().from(stores).where(eq(stores.slug, 'hh')).limit(1);

  let store = existingStore[0];
  if (!store) {
    const [created] = await db
      .insert(stores)
      .values({
        slug: 'hh',
        name: 'H&H',
        description: 'Curated luxury essentials and refined accessories.',
        defaultCurrency: 'INR',
        isActive: true,
        settings: {
          contactEmail: 'support@handh.com',
          instagramHandle: 'handh_official',
          enableCoupons: true
        }
      })
      .returning();

    store = created!;
    console.log(`  ✓ Created flagship store: ${store.name} (${store.slug})`);

    // Bind primary local domain
    await db.insert(storeDomains).values({
      storeId: store.id,
      hostname: 'localhost',
      isPrimary: true
    });
  } else {
    console.log(`  ✓ Found existing store: ${store.name} (${store.slug})`);
  }

  // 2. Standard Taxonomy Categories
  // Top-Level Category: Accessories
  let [accessoriesCat] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.storeId, store.id), eq(categories.slug, 'accessories')))
    .limit(1);

  if (!accessoriesCat) {
    const [created] = await db
      .insert(categories)
      .values({
        storeId: store.id,
        slug: 'accessories',
        name: 'Accessories',
        description: 'Finely crafted accents and statement adornments.',
        sortOrder: 10,
        isActive: true
      })
      .returning();
    accessoriesCat = created!;
    console.log(`  ✓ Created top-level category: ${accessoriesCat.name}`);
  }

  // Sub-Category: Jewelry (under Accessories)
  let [jewelryCat] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.storeId, store.id), eq(categories.slug, 'jewelry')))
    .limit(1);

  if (!jewelryCat) {
    const [created] = await db
      .insert(categories)
      .values({
        storeId: store.id,
        parentId: accessoriesCat.id,
        slug: 'jewelry',
        name: 'Jewelry',
        description: 'Intricately designed nose pieces, pins, and delicate jewelry.',
        sortOrder: 10,
        isActive: true
      })
      .returning();
    jewelryCat = created!;
    console.log(`  ✓ Created sub-category: ${jewelryCat.name} (under ${accessoriesCat.name})`);
  }

  // Top-Level Category: Apparel & Clothing (Future categories hook)
  const existingApparel = await db
    .select()
    .from(categories)
    .where(and(eq(categories.storeId, store.id), eq(categories.slug, 'clothing')))
    .limit(1);

  if (!existingApparel[0]) {
    await db.insert(categories).values({
      storeId: store.id,
      slug: 'clothing',
      name: 'Apparel & Clothing',
      description: 'Signature abayas, hijabs, printed caps, and modest collections.',
      sortOrder: 20,
      isActive: true
    });
    console.log('  ✓ Created top-level category: Apparel & Clothing');
  }

  // 3. Seed Initial 4 Signature Nose-Piece Products (5 pieces each = 20 total)
  const initialProducts = [
    {
      slug: 'pearl-glow-nose-piece',
      title: 'Pearl Glow Nose Piece',
      description:
        'An exquisitely crafted nose piece adorned with lustrous pearls and finished in warm gold tones. Designed for graceful wear atop an Abaya or statement modesty.',
      sku: 'HH-ACC-NP-01',
      priceMinor: 59900, // ₹599.00
      initialQuantity: 5,
      imageUrl:
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80'
    },
    {
      slug: 'minimalist-silver-nose-piece',
      title: 'Minimalist Silver Nose Piece',
      description:
        'Clean architectural lines with hand-polished silver sheen. Understated luxury engineered for comfortable all-day wear.',
      sku: 'HH-ACC-NP-02',
      priceMinor: 59900, // ₹599.00
      initialQuantity: 5,
      imageUrl:
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80'
    },
    {
      slug: 'crystal-floral-nose-piece',
      title: 'Crystal Floral Nose Piece',
      description:
        'Intricate floral filigree accented with delicate, light-catching crystals. Adds an ethereal finish to formal occasions.',
      sku: 'HH-ACC-NP-03',
      priceMinor: 59900, // ₹599.00
      initialQuantity: 5,
      imageUrl:
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80'
    },
    {
      slug: 'vintage-filigree-nose-piece',
      title: 'Vintage Filigree Nose Piece',
      description:
        'Traditional heritage motifs cast in antiqued brass with subtle engravings for an authentic artisanal aesthetic.',
      sku: 'HH-ACC-NP-04',
      priceMinor: 59900, // ₹599.00
      initialQuantity: 5,
      imageUrl:
        'https://images.unsplash.com/photo-1611591475825-9d33bdfc5453?w=800&auto=format&fit=crop&q=80'
    }
  ];

  for (const item of initialProducts) {
    const existing = await db
      .select()
      .from(products)
      .where(and(eq(products.storeId, store.id), eq(products.slug, item.slug)))
      .limit(1);

    if (existing[0]) {
      console.log(`  ↳ Product already exists: ${item.title}`);
      continue;
    }

    const { product } = await createProductWithVariants(db, {
      storeId: store.id,
      categoryId: jewelryCat.id,
      slug: item.slug,
      title: item.title,
      description: item.description,
      status: 'published',
      variants: [
        {
          sku: item.sku,
          title: 'Standard',
          priceMinor: item.priceMinor,
          currency: 'INR',
          weightGrams: 15,
          sortOrder: 0,
          isActive: true,
          initialQuantity: item.initialQuantity
        }
      ],
      images: [
        {
          storageKey: `products/${item.slug}.jpg`,
          url: item.imageUrl,
          altText: item.title,
          sortOrder: 0
        }
      ]
    });

    console.log(
      `  ✓ Seeded Product: ${product.title} (SKU: ${item.sku}, Stock: ${item.initialQuantity}, Price: ₹${item.priceMinor / 100})`
    );
  }

  // Total inventory sanity check
  const inventorySum = await db.select().from(inventoryLevels);
  const totalOnHand = inventorySum.reduce((acc, row) => acc + row.onHand, 0);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✨ Seeding Complete! Total live inventory in database: ${totalOnHand} pieces.`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  process.exit(0);
}

seed().catch((err: unknown) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
