import { eq, and } from 'drizzle-orm';
import { createDbClient } from './index';
import {
  stores,
  storeDomains,
  categories,
  products,
  inventoryLevels,
  orders,
  orderItems,
  fulfillments,
  paymentAttempts,
  coupons
} from './schema';
import { createProductWithVariants } from './repositories';
import { defaultInvoiceTemplate } from '@hh/domain';

async function seed(): Promise<void> {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';

  console.log('🌱 Starting database seeding on:', databaseUrl.replace(/:[^:@]+@/, ':****@'));
  const db = createDbClient(databaseUrl);

  // 1. Create or Find Parent Store (H&H)
  const existingStore = await db.select().from(stores).where(eq(stores.slug, 'hh')).limit(1);

  const initialSettings = {
    contactEmail: 'support@handh.in',
    instagramHandle: 'handh_official',
    enableCoupons: true,
    invoice: defaultInvoiceTemplate,
    storefront: {
      theme: {
        background: '#FDFBF7',
        surface: '#FFFFFF',
        border: '#EBE7DF',
        primaryEmerald: '#0A2E24',
        primaryEmeraldHover: '#07221A',
        accentGold: '#C5A880',
        accentGoldLight: '#F5EFE6',
        textPrimary: '#171A19',
        textSecondary: '#5C6460'
      },
      hero: {
        eyebrow: 'H&H Signature Collection',
        title: 'Crafted for Grace & Modesty',
        subtitle:
          'Exquisite handcrafted nose-pieces and accessories designed for refined everyday elegance.',
        ctaText: 'Explore the Collection',
        ctaLink: '#catalog',
        badgeText: 'Handcrafted Heritage • Limited Edition'
      },
      announcement: {
        enabled: true,
        text: 'Handcrafted in limited batches • Express courier dispatch across India via India Post & DTDC',
        badge: 'Signature Drop'
      },
      reassurances: [
        {
          icon: 'sparkles' as const,
          title: 'Artisanal Craftsmanship',
          description: 'Meticulously shaped in limited quantities for unmatched grace.'
        },
        {
          icon: 'truck' as const,
          title: 'Direct Courier Dispatch',
          description: 'Carefully packaged and shipped with verifiable tracking.'
        },
        {
          icon: 'shield' as const,
          title: 'Secure Online Payments',
          description: 'End-to-end encrypted checkout powered by Razorpay.'
        }
      ]
    }
  };

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
        settings: initialSettings
      })
      .returning();

    store = created!;
    console.log(`  ✓ Created flagship store: ${store.name} (${store.slug})`);

    await db.insert(storeDomains).values({
      storeId: store.id,
      hostname: 'localhost',
      isPrimary: true
    });
  } else {
    await db
      .update(stores)
      .set({
        settings: {
          ...store.settings,
          ...initialSettings,
          invoice: store.settings.invoice ?? defaultInvoiceTemplate
        }
      })
      .where(eq(stores.id, store.id));

    console.log(`  ✓ Updated existing store settings: ${store.name} (${store.slug})`);
  }

  // 2. Standard Taxonomy Categories
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

  // Sub-Category: Jewelry (Nose Pieces & Clips)
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
        name: 'Nose Pieces & Clips',
        description: 'Intricately designed nose pieces, clips, and delicate modest-wear jewelry.',
        sortOrder: 10,
        isActive: true
      })
      .returning();
    jewelryCat = created!;
    console.log(`  ✓ Created sub-category: ${jewelryCat.name} (under ${accessoriesCat.name})`);
  }

  // Sub-Category: Hijab Accents
  let [hijabCat] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.storeId, store.id), eq(categories.slug, 'hijab-accents')))
    .limit(1);

  if (!hijabCat) {
    const [created] = await db
      .insert(categories)
      .values({
        storeId: store.id,
        parentId: accessoriesCat.id,
        slug: 'hijab-accents',
        name: 'Hijab & Abaya Accents',
        description: 'Magnetic pins, artisanal brooches, and luxury modest-wear clasps.',
        sortOrder: 20,
        isActive: true
      })
      .returning();
    hijabCat = created!;
    console.log(`  ✓ Created sub-category: ${hijabCat.name}`);
  }

  // Sub-Category: Statement Rings & Bands
  let [ringsCat] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.storeId, store.id), eq(categories.slug, 'rings-bands')))
    .limit(1);

  if (!ringsCat) {
    const [created] = await db
      .insert(categories)
      .values({
        storeId: store.id,
        parentId: accessoriesCat.id,
        slug: 'rings-bands',
        name: 'Rings & Bangles',
        description: 'Hand-hammered silver bands and artisanal brass cuffs.',
        sortOrder: 30,
        isActive: true
      })
      .returning();
    ringsCat = created!;
    console.log(`  ✓ Created sub-category: ${ringsCat.name}`);
  }

  // 3. Rich Product Catalog (10 Handcrafted Pieces with Diverse Stock Tiers)
  const catalog = [
    // Nose Pieces & Clips
    {
      categoryId: jewelryCat.id,
      slug: 'pearl-glow-nose-piece',
      title: 'Pearl Glow Nose Piece',
      description:
        'An exquisitely crafted nose piece adorned with lustrous pearls and finished in warm gold tones. Designed for graceful wear atop an Abaya or statement modesty.',
      sku: 'HH-ACC-NP-01',
      variantTitle: 'Warm Gold / Pearl',
      priceMinor: 59900,
      initialQuantity: 15, // Abundant stock
      imageUrl:
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80'
    },
    {
      categoryId: jewelryCat.id,
      slug: 'minimalist-silver-nose-piece',
      title: 'Minimalist Silver Nose Piece',
      description:
        'Clean architectural lines with hand-polished 925 sterling silver sheen. Understated luxury engineered for comfortable all-day wear.',
      sku: 'HH-ACC-NP-02',
      variantTitle: '925 Sterling Silver',
      priceMinor: 49900,
      initialQuantity: 8,
      imageUrl:
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80'
    },
    {
      categoryId: jewelryCat.id,
      slug: 'crystal-floral-nose-piece',
      title: 'Crystal Floral Nose Piece',
      description:
        'Intricate floral filigree accented with delicate, light-catching crystals. Adds an ethereal finish to formal occasions.',
      sku: 'HH-ACC-NP-03',
      variantTitle: 'Silver Polish / Clear Crystal',
      priceMinor: 64900,
      initialQuantity: 12,
      imageUrl:
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80'
    },
    {
      categoryId: jewelryCat.id,
      slug: 'vintage-filigree-nose-piece',
      title: 'Vintage Filigree Nose Piece',
      description:
        'Traditional heritage motifs cast in antiqued brass with subtle engravings for an authentic artisanal aesthetic.',
      sku: 'HH-ACC-NP-04',
      variantTitle: 'Antiqued Brass',
      priceMinor: 59900,
      initialQuantity: 5,
      imageUrl:
        'https://images.unsplash.com/photo-1611591475825-9d33bdfc5453?w=800&auto=format&fit=crop&q=80'
    },
    {
      categoryId: jewelryCat.id,
      slug: 'ameera-freshwater-pearl-stud',
      title: 'Ameera Natural Pearl Nose Stud',
      description:
        'Authentic freshwater button pearl mounted on hypoallergenic sterling silver. Subtle, dignified, and luminous.',
      sku: 'HH-ACC-NP-05',
      variantTitle: 'Freshwater Pearl / Silver',
      priceMinor: 79900,
      initialQuantity: 3, // Low Stock (<= 3)
      imageUrl:
        'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&auto=format&fit=crop&q=80'
    },
    {
      categoryId: jewelryCat.id,
      slug: 'zahra-cz-solitaire-ring',
      title: 'Zahra Solitaire CZ Nose Ring',
      description:
        'Brilliant-cut cubic zirconia in a bezel silver setting. Effortless sparkle without overwhelming subtlety.',
      sku: 'HH-ACC-NP-06',
      variantTitle: 'Rhodium Silver / CZ',
      priceMinor: 54900,
      initialQuantity: 0, // Sold Out (0)
      imageUrl:
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80'
    },

    // Hijab & Abaya Accents
    {
      categoryId: hijabCat.id,
      slug: 'safiya-magnetic-hijab-pins',
      title: 'Safiya Magnetic Hijab Pins (Set of 4)',
      description:
        'Ultra-strong rare-earth magnetic clasps that keep your silk, chiffon, or jersey hijabs flawlessly in place without pin holes.',
      sku: 'HH-ACC-HP-01',
      variantTitle: 'Matte Gold & Gunmetal Pack',
      priceMinor: 39900,
      initialQuantity: 25, // Plentiful stock
      imageUrl:
        'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800&auto=format&fit=crop&q=80'
    },
    {
      categoryId: hijabCat.id,
      slug: 'layla-crystal-brooch',
      title: 'Layla Crystal Floral Brooch',
      description:
        'Hand-set micro zircon crystals arranged in a delicate crescent floral spray. The perfect accent for ceremonial Abayas.',
      sku: 'HH-ACC-HP-02',
      variantTitle: 'Champagne Gold / Zircon',
      priceMinor: 89900,
      initialQuantity: 6,
      imageUrl:
        'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&auto=format&fit=crop&q=80'
    },

    // Rings & Bangles
    {
      categoryId: ringsCat.id,
      slug: 'qamar-crescent-cuff',
      title: 'Qamar Crescent Cuff Bracelet',
      description:
        'Hand-hammered brass cuff bracelet with high-polish 18k gold vermeil finish. Open-ended adjustable fit.',
      sku: 'HH-ACC-JW-01',
      variantTitle: '18k Gold Vermeil',
      priceMinor: 129900,
      initialQuantity: 4,
      imageUrl:
        'https://images.unsplash.com/photo-1611591475825-9d33bdfc5453?w=800&auto=format&fit=crop&q=80'
    },
    {
      categoryId: ringsCat.id,
      slug: 'medina-silver-band',
      title: 'Medina Hand-Hammered Silver Band',
      description:
        'Chiseled solid 925 sterling silver band with organic organic facets that catch ambient light.',
      sku: 'HH-ACC-JW-02',
      variantTitle: 'Solid 925 Silver',
      priceMinor: 149900,
      initialQuantity: 2, // Low stock (<= 3)
      imageUrl:
        'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80'
    }
  ];

  const createdVariantMap: Record<string, string> = {};

  for (const item of catalog) {
    const existing = await db
      .select()
      .from(products)
      .where(and(eq(products.storeId, store.id), eq(products.slug, item.slug)))
      .limit(1);

    if (existing[0]) {
      console.log(`  ↳ Product already exists: ${item.title}`);
      continue;
    }

    const { product, variants } = await createProductWithVariants(db, {
      storeId: store.id,
      categoryId: item.categoryId,
      slug: item.slug,
      title: item.title,
      description: item.description,
      status: 'published',
      variants: [
        {
          sku: item.sku,
          title: item.variantTitle,
          priceMinor: item.priceMinor,
          currency: 'INR',
          weightGrams: 20,
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

    createdVariantMap[item.sku] = variants[0]!.id;
    console.log(
      `  ✓ Seeded Product: ${product.title} (${item.sku}, Stock: ${item.initialQuantity}, Price: ₹${item.priceMinor / 100})`
    );
  }

  // 4. Seed Realistic Sample Orders for Admin Testing
  const existingOrders = await db.select().from(orders).limit(1);
  if (existingOrders.length === 0) {
    console.log('  🛒 Seeding realistic sample customer orders...');

    // Order 1: Shipped / Delivered order (Aisha Khan - Bangalore)
    const [shippedOrder] = await db
      .insert(orders)
      .values({
        storeId: store.id,
        orderNumber: 'HH-2026-00001',
        status: 'paid',
        paymentStatus: 'captured',
        fulfillmentStatus: 'shipped',
        currency: 'INR',
        subtotalMinor: 59900,
        shippingMinor: 0,
        discountMinor: 0,
        totalMinor: 59900,
        customerName: 'Aisha Khan',
        customerEmail: 'aisha.khan@example.com',
        customerPhone: '+919876543210',
        shippingAddress: {
          line1: 'Flat 402, Green Glen Heights, Bellandur',
          line2: 'Near Outer Ring Road',
          city: 'Bangalore',
          state: 'Karnataka',
          postalCode: '560103',
          country: 'India'
        }
      })
      .returning();

    if (shippedOrder) {
      await db.insert(orderItems).values({
        orderId: shippedOrder.id,
        variantId: createdVariantMap['HH-ACC-NP-01'] ?? null,
        skuSnapshot: 'HH-ACC-NP-01',
        productNameSnapshot: 'Pearl Glow Nose Piece',
        variantNameSnapshot: 'Warm Gold / Pearl',
        unitPriceMinor: 59900,
        quantity: 1,
        totalPriceMinor: 59900
      });

      await db.insert(paymentAttempts).values({
        orderId: shippedOrder.id,
        provider: 'razorpay',
        providerPaymentId: 'pay_sample_bangalore_01',
        providerOrderId: 'order_rzp_sample_01',
        amountMinor: 59900,
        currency: 'INR',
        status: 'captured'
      });

      await db.insert(fulfillments).values({
        orderId: shippedOrder.id,
        courierProvider: 'dtdc',
        trackingNumber: 'DTDC98765432IN',
        trackingReference: 'TRK-2026-0001',
        shippingProviderId: 'dtdc',
        status: 'shipped',
        pickupToken: 'PKP-DTDC-2026-01',
        latestEvent: 'Out for delivery at Bangalore Delivery Hub'
      });

      console.log('    ✓ Seeded Shipped Order: HH-2026-00001 (Aisha Khan - Bangalore)');
    }

    // Order 2: "To Pack" Order (Zoya Farooqui - Hyderabad)
    const [toPackOrder] = await db
      .insert(orders)
      .values({
        storeId: store.id,
        orderNumber: 'HH-2026-00002',
        status: 'paid',
        paymentStatus: 'captured',
        fulfillmentStatus: 'unfulfilled',
        currency: 'INR',
        subtotalMinor: 89800,
        shippingMinor: 0,
        discountMinor: 0,
        totalMinor: 89800,
        customerName: 'Zoya Farooqui',
        customerEmail: 'zoya.farooqui@example.com',
        customerPhone: '+919812345678',
        shippingAddress: {
          line1: 'House No. 12-2-417, Mehdipatnam',
          city: 'Hyderabad',
          state: 'Telangana',
          postalCode: '500028',
          country: 'India'
        }
      })
      .returning();

    if (toPackOrder) {
      await db.insert(orderItems).values([
        {
          orderId: toPackOrder.id,
          variantId: createdVariantMap['HH-ACC-NP-02'] ?? null,
          skuSnapshot: 'HH-ACC-NP-02',
          productNameSnapshot: 'Minimalist Silver Nose Piece',
          variantNameSnapshot: '925 Sterling Silver',
          unitPriceMinor: 49900,
          quantity: 1,
          totalPriceMinor: 49900
        },
        {
          orderId: toPackOrder.id,
          variantId: createdVariantMap['HH-ACC-HP-01'] ?? null,
          skuSnapshot: 'HH-ACC-HP-01',
          productNameSnapshot: 'Safiya Magnetic Hijab Pins (Set of 4)',
          variantNameSnapshot: 'Matte Gold & Gunmetal Pack',
          unitPriceMinor: 39900,
          quantity: 1,
          totalPriceMinor: 39900
        }
      ]);

      await db.insert(paymentAttempts).values({
        orderId: toPackOrder.id,
        provider: 'razorpay',
        providerPaymentId: 'pay_sample_hyd_02',
        providerOrderId: 'order_rzp_sample_02',
        amountMinor: 89800,
        currency: 'INR',
        status: 'captured'
      });

      console.log('    ✓ Seeded "To Pack" Order: HH-2026-00002 (Zoya Farooqui - Hyderabad)');
    }
  }

  // 5. Seed Promotional Coupons
  const existingCoupons = await db.select().from(coupons).where(eq(coupons.storeId, store.id));
  if (existingCoupons.length === 0) {
    await db.insert(coupons).values([
      {
        storeId: store.id,
        code: 'WELCOME10',
        discountType: 'percentage',
        value: 10,
        minOrderValueMinor: 50000,
        maxDiscountMinor: 20000,
        usageLimit: 200,
        isActive: true
      },
      {
        storeId: store.id,
        code: 'ROYAL150',
        discountType: 'fixed',
        value: 15000,
        minOrderValueMinor: 99900,
        usageLimit: 100,
        isActive: true
      }
    ]);
    console.log('  ✓ Seeded promotional coupons: WELCOME10 (10% off) and ROYAL150 (₹150 off)');
  }

  // Sanity check
  const inventorySum = await db.select().from(inventoryLevels);
  const totalOnHand = inventorySum.reduce((acc, row) => acc + row.onHand, 0);

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(
    `✨ Seeding Complete! Total live inventory: ${totalOnHand} pieces across ${catalog.length} SKUs.`
  );
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  process.exit(0);
}

seed().catch((err: unknown) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
