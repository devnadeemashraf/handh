import { and, eq } from 'drizzle-orm';

import { DEFAULT_STOREFRONT_CONFIG, defaultInvoiceTemplate, flattenTaxonomyTree } from '@hh/domain';

import { createDbClient } from './index';
import { createProductWithVariants } from './repositories';
import {
  categories,
  coupons,
  familyMembers,
  fulfillments,
  inventoryLevels,
  orderItems,
  orders,
  paymentAttempts,
  products,
  storeDomains,
  stores,
  userAddresses,
  users,
  wishlistItems
} from './schema';

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
      ...DEFAULT_STOREFRONT_CONFIG,
      hero: {
        ...DEFAULT_STOREFRONT_CONFIG.hero,
        eyebrow: 'H&H Signature Collection',
        title: 'Crafted for Grace & Modesty',
        subtitle:
          'Exquisite handcrafted nose-pieces and accessories designed for refined everyday elegance.',
        ctaText: 'Explore the Collection',
        ctaLink: '#catalog',
        badgeText: 'Handcrafted Heritage • Limited Edition'
      },
      announcement: {
        ...DEFAULT_STOREFRONT_CONFIG.announcement,
        enabled: true,
        text: 'Handcrafted in limited batches • Express courier dispatch across India via India Post & DTDC',
        badge: 'Signature Drop'
      }
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

  // 2. Multi-Vertical Enterprise Taxonomy Seeding (Departments -> Categories -> Sub-Categories)
  console.log('  🌳 Seeding multi-vertical taxonomy tree...');
  const flatTree = flattenTaxonomyTree();
  const pathToCategoryId = new Map<string, string>();

  for (const rec of flatTree) {
    const parentId = rec.parentPath ? (pathToCategoryId.get(rec.parentPath) ?? null) : null;

    const [existingCat] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.storeId, store.id), eq(categories.slug, rec.slug)))
      .limit(1);

    if (existingCat) {
      await db
        .update(categories)
        .set({
          name: rec.name,
          path: rec.path,
          depth: rec.depth,
          parentId: parentId ?? existingCat.parentId,
          applicableFilterKeys: rec.applicableFilterKeys
        })
        .where(eq(categories.id, existingCat.id));
      pathToCategoryId.set(rec.path, existingCat.id);
    } else {
      const [created] = await db
        .insert(categories)
        .values({
          storeId: store.id,
          parentId,
          slug: rec.slug,
          name: rec.name,
          path: rec.path,
          depth: rec.depth,
          description: `${rec.name} collection for H&H.`,
          sortOrder: rec.depth * 10,
          applicableFilterKeys: rec.applicableFilterKeys,
          isActive: true
        })
        .returning();
      pathToCategoryId.set(rec.path, created!.id);
    }
  }
  console.log(`  ✓ Seeded ${flatTree.length} taxonomy categories across 5 departments.`);

  // Maintain backwards-compatible mappings for legacy categories
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
        path: '/accessories',
        depth: 0,
        description: 'Finely crafted accents and statement adornments.',
        sortOrder: 10,
        applicableFilterKeys: ['metal_finish', 'stone_type'],
        isActive: true
      })
      .returning();
    accessoriesCat = created!;
  }

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
        path: '/accessories/jewelry',
        depth: 1,
        description: 'Intricately designed nose pieces, clips, and delicate modest-wear jewelry.',
        sortOrder: 10,
        applicableFilterKeys: ['metal_finish', 'stone_type'],
        isActive: true
      })
      .returning();
    jewelryCat = created!;
  }

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
        path: '/women/essentials/pins-clips',
        depth: 2,
        description: 'Magnetic pins, artisanal brooches, and luxury modest-wear clasps.',
        sortOrder: 20,
        applicableFilterKeys: ['metal_finish', 'stone_type'],
        isActive: true
      })
      .returning();
    hijabCat = created!;
  }

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
        path: '/accessories/rings-bands',
        depth: 1,
        description: 'Hand-hammered silver bands and artisanal brass cuffs.',
        sortOrder: 30,
        applicableFilterKeys: ['metal_purity', 'metal_finish'],
        isActive: true
      })
      .returning();
    ringsCat = created!;
  }

  // 3. Rich Multi-Vertical Product Catalog
  const catalog = [
    // --- NOSE PIECES & CLIPS (Original Collection) ---
    {
      categoryId: jewelryCat.id,
      department: 'accessories',
      slug: 'pearl-glow-nose-piece',
      title: 'Pearl Glow Nose Piece',
      description:
        'An exquisitely crafted nose piece adorned with lustrous pearls and finished in warm gold tones. Designed for graceful wear atop an Abaya or statement modesty.',
      sku: 'HH-ACC-NP-01',
      variantTitle: 'Warm Gold / Pearl',
      priceMinor: 59900,
      initialQuantity: 15,
      imageUrl:
        'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
      isCustomizable: false,
      specifications: { metal_finish: 'Warm Gold Polish', stone_type: 'Freshwater Pearl' },
      tags: ['jewelry', 'nose-piece', 'pearl', 'gold', 'accessories'],
      options: [{ name: 'Finish', value: 'Warm Gold' }]
    },
    {
      categoryId: jewelryCat.id,
      department: 'accessories',
      slug: 'minimalist-silver-nose-piece',
      title: 'Minimalist Silver Nose Piece',
      description:
        'Clean architectural lines with hand-polished 925 sterling silver sheen. Understated luxury engineered for comfortable all-day wear.',
      sku: 'HH-ACC-NP-02',
      variantTitle: '925 Sterling Silver',
      priceMinor: 49900,
      initialQuantity: 8,
      imageUrl:
        'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
      isCustomizable: false,
      specifications: { metal_purity: '925 Sterling Silver', metal_finish: 'High Polish' },
      tags: ['jewelry', 'nose-piece', 'silver', 'minimalist'],
      options: [{ name: 'Material', value: '925 Silver' }]
    },
    {
      categoryId: jewelryCat.id,
      department: 'accessories',
      slug: 'crystal-floral-nose-piece',
      title: 'Crystal Floral Nose Piece',
      description:
        'Intricate floral filigree accented with delicate, light-catching crystals. Adds an ethereal finish to formal occasions.',
      sku: 'HH-ACC-NP-03',
      variantTitle: 'Silver Polish / Clear Crystal',
      priceMinor: 64900,
      initialQuantity: 12,
      imageUrl:
        'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80',
      isCustomizable: false,
      specifications: { metal_finish: 'Silver Polish', stone_type: 'Cubic Zirconia' },
      tags: ['jewelry', 'nose-piece', 'crystal', 'floral'],
      options: [{ name: 'Finish', value: 'Silver Polish' }]
    },
    {
      categoryId: jewelryCat.id,
      department: 'accessories',
      slug: 'vintage-filigree-nose-piece',
      title: 'Vintage Filigree Nose Piece',
      description:
        'Traditional heritage motifs cast in antiqued brass with subtle engravings for an authentic artisanal aesthetic.',
      sku: 'HH-ACC-NP-04',
      variantTitle: 'Antiqued Brass',
      priceMinor: 59900,
      initialQuantity: 5,
      imageUrl:
        'https://images.unsplash.com/photo-1611591475825-9d33bdfc5453?w=800&auto=format&fit=crop&q=80',
      isCustomizable: false,
      specifications: { metal_finish: 'Antiqued Brass' },
      tags: ['jewelry', 'nose-piece', 'vintage', 'filigree'],
      options: [{ name: 'Material', value: 'Antiqued Brass' }]
    },
    {
      categoryId: jewelryCat.id,
      department: 'accessories',
      slug: 'ameera-freshwater-pearl-stud',
      title: 'Ameera Natural Pearl Nose Stud',
      description:
        'Authentic freshwater button pearl mounted on hypoallergenic sterling silver. Subtle, dignified, and luminous.',
      sku: 'HH-ACC-NP-05',
      variantTitle: 'Freshwater Pearl / Silver',
      priceMinor: 79900,
      initialQuantity: 3,
      imageUrl:
        'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&auto=format&fit=crop&q=80',
      isCustomizable: false,
      specifications: { stone_type: 'Freshwater Pearl', metal_purity: '925 Sterling Silver' },
      tags: ['jewelry', 'nose-stud', 'pearl', 'silver'],
      options: [{ name: 'Stone', value: 'Freshwater Pearl' }]
    },
    {
      categoryId: jewelryCat.id,
      department: 'accessories',
      slug: 'zahra-cz-solitaire-ring',
      title: 'Zahra Solitaire CZ Nose Ring',
      description:
        'Brilliant-cut cubic zirconia in a bezel silver setting. Effortless sparkle without overwhelming subtlety.',
      sku: 'HH-ACC-NP-06',
      variantTitle: 'Rhodium Silver / CZ',
      priceMinor: 54900,
      initialQuantity: 0,
      imageUrl:
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80',
      isCustomizable: false,
      specifications: { stone_type: 'Cubic Zirconia', metal_finish: 'Rhodium Plated' },
      tags: ['jewelry', 'nose-ring', 'solitaire', 'cz'],
      options: [{ name: 'Finish', value: 'Rhodium Silver' }]
    },

    // --- HIJAB & ABAYA ACCENTS ---
    {
      categoryId: hijabCat.id,
      department: 'women',
      slug: 'safiya-magnetic-hijab-pins',
      title: 'Safiya Magnetic Hijab Pins (Set of 4)',
      description:
        'Ultra-strong rare-earth magnetic clasps that keep your silk, chiffon, or jersey hijabs flawlessly in place without pin holes.',
      sku: 'HH-ACC-HP-01',
      variantTitle: 'Matte Gold & Gunmetal Pack',
      priceMinor: 39900,
      initialQuantity: 25,
      imageUrl:
        'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800&auto=format&fit=crop&q=80',
      isCustomizable: false,
      specifications: { metal_finish: 'Matte Gold / Gunmetal' },
      tags: ['hijab-accessories', 'magnetic-pins', 'modest-essentials'],
      options: [{ name: 'Pack', value: '4-Piece Set' }]
    },
    {
      categoryId: hijabCat.id,
      department: 'women',
      slug: 'layla-crystal-brooch',
      title: 'Layla Crystal Floral Brooch',
      description:
        'Hand-set micro zircon crystals arranged in a delicate crescent floral spray. The perfect accent for ceremonial Abayas.',
      sku: 'HH-ACC-HP-02',
      variantTitle: 'Champagne Gold / Zircon',
      priceMinor: 89900,
      initialQuantity: 6,
      imageUrl:
        'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&auto=format&fit=crop&q=80',
      isCustomizable: false,
      specifications: { metal_finish: 'Champagne Gold', stone_type: 'Micro Zircon' },
      tags: ['brooch', 'crystal', 'abaya-accents', 'ceremonial'],
      options: [{ name: 'Finish', value: 'Champagne Gold' }]
    },

    // --- RINGS & BANGLES ---
    {
      categoryId: ringsCat.id,
      department: 'accessories',
      slug: 'qamar-crescent-cuff',
      title: 'Qamar Crescent Cuff Bracelet',
      description:
        'Hand-hammered brass cuff bracelet with high-polish 18k gold vermeil finish. Open-ended adjustable fit.',
      sku: 'HH-ACC-JW-01',
      variantTitle: '18k Gold Vermeil',
      priceMinor: 129900,
      initialQuantity: 4,
      imageUrl:
        'https://images.unsplash.com/photo-1611591475825-9d33bdfc5453?w=800&auto=format&fit=crop&q=80',
      isCustomizable: false,
      specifications: { metal_purity: '18k Gold Vermeil', metal_finish: 'Hand-Hammered Polish' },
      tags: ['jewelry', 'bracelet', 'cuff', 'gold'],
      options: [{ name: 'Finish', value: '18k Gold Vermeil' }]
    },
    {
      categoryId: ringsCat.id,
      department: 'accessories',
      slug: 'medina-silver-band',
      title: 'Medina Hand-Hammered Silver Band',
      description:
        'Chiseled solid 925 sterling silver band with organic facets that catch ambient light.',
      sku: 'HH-ACC-JW-02',
      variantTitle: 'Solid 925 Silver',
      priceMinor: 149900,
      initialQuantity: 2,
      imageUrl:
        'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80',
      isCustomizable: false,
      specifications: { metal_purity: '925 Sterling Silver', metal_finish: 'Chiseled Matte' },
      tags: ['jewelry', 'ring', 'silver', 'handcrafted'],
      options: [{ name: 'Size', value: 'Adjustable' }]
    },

    // --- MULTI-VERTICAL EXPANSION: MEN'S APPAREL & FOOTWEAR ---
    {
      categoryId: pathToCategoryId.get('/men/apparel/t-shirts') ?? jewelryCat.id,
      department: 'men',
      slug: 'artisanal-oversized-graphic-tee',
      title: 'Artisanal Oversized Heavyweight Graphic T-Shirt',
      description:
        'Heavyweight 240 GSM combed cotton oversized tee with drop-shoulder silhouette and reinforced ribbed collar. Available as a signature drop or customized with your personal bespoke typography or artwork.',
      sku: 'HH-MEN-TS-01',
      variantTitle: 'Noir Black / L',
      priceMinor: 129900,
      initialQuantity: 30,
      imageUrl:
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      isCustomizable: true,
      customizationConfig: {
        allowCustomText: true,
        allowImageUpload: true,
        maxCharacters: 30,
        surchargeMinor: 15000,
        customizationNotesPlaceholder: 'Specify text or artwork placement (front chest or back)',
        productionDays: 3
      },
      specifications: {
        fabric: 'Combed Cotton',
        gsm: 240,
        fit: 'Oversized Drop Shoulder',
        neckline: 'Crew Neck',
        pattern: 'Graphic Print'
      },
      tags: ['streetwear', 'heavyweight', 'custom-print', 'men', 'apparel'],
      options: [
        { name: 'Color', value: 'Noir Black' },
        { name: 'Size', value: 'L' }
      ]
    },
    {
      categoryId: pathToCategoryId.get('/men/footwear/slip-ons') ?? jewelryCat.id,
      department: 'men',
      slug: 'handcrafted-leather-slip-ons',
      title: 'Handcrafted Buff Leather Slip-On Mules',
      description:
        'Artisanal vegetable-tanned buff leather slip-ons with cushioned arch support, breathable leather lining, and durable rubberized soles for effortless formal and casual elegance.',
      sku: 'HH-MEN-FW-01',
      variantTitle: 'Cognac Tan / EU 42',
      priceMinor: 299900,
      initialQuantity: 10,
      imageUrl:
        'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&auto=format&fit=crop&q=80',
      isCustomizable: false,
      specifications: {
        sole_material: 'Vegetable Tanned Leather & Rubber',
        color: 'Cognac Tan',
        footwear_size: 'EU 42'
      },
      tags: ['footwear', 'leather', 'slip-ons', 'handcrafted', 'luxury'],
      options: [
        { name: 'Color', value: 'Cognac Tan' },
        { name: 'Size', value: 'EU 42' }
      ]
    },

    // --- MULTI-VERTICAL EXPANSION: WOMEN'S MODEST WEAR & ESSENTIALS ---
    {
      categoryId: pathToCategoryId.get('/women/modest-wear/abayas') ?? jewelryCat.id,
      department: 'women',
      slug: 'midnight-velvet-embroidered-abaya',
      title: 'Midnight Royale Velvet Hand-Embroidered Abaya',
      description:
        'Sumptuous midnight black micro-velvet open abaya embellished with delicate antique gold zardozi and thread embroidery along the cuffs and sweeping lapels. Includes matching chiffon sheyla.',
      sku: 'HH-WMN-AB-01',
      variantTitle: 'Midnight Black / Free Size 56"',
      priceMinor: 449900,
      initialQuantity: 6,
      imageUrl:
        'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800&auto=format&fit=crop&q=80',
      isCustomizable: true,
      customizationConfig: {
        allowCustomText: true,
        allowImageUpload: false,
        maxCharacters: 20,
        surchargeMinor: 25000,
        customizationNotesPlaceholder: 'Custom length (e.g. 54", 56", 58") or inner hem monogram',
        productionDays: 5
      },
      specifications: {
        fabric: 'Micro Velvet',
        abaya_length: '56 inches',
        fit: 'Flowing Silhouette',
        color: 'Midnight Black'
      },
      tags: ['abaya', 'modest-wear', 'luxury', 'velvet', 'embroidery'],
      options: [
        { name: 'Color', value: 'Midnight Black' },
        { name: 'Length', value: '56"' }
      ]
    },
    {
      categoryId: pathToCategoryId.get('/women/essentials/eye-veils') ?? jewelryCat.id,
      department: 'women',
      slug: 'breathable-chiffon-eye-veil',
      title: 'Pure Breathable Double-Layer Chiffon Eye Veil',
      description:
        'Ultra-lightweight, skin-friendly Korean chiffon eye veil with discreet ribbon ties and reinforced eye opening. Maximum breathability and graceful modesty.',
      sku: 'HH-WMN-EV-01',
      variantTitle: 'Pitch Black',
      priceMinor: 34900,
      initialQuantity: 20,
      imageUrl:
        'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80',
      isCustomizable: false,
      specifications: {
        fabric: 'Korean Chiffon',
        veil_coverage: 'Double Layer',
        color: 'Pitch Black'
      },
      tags: ['eye-veil', 'niqab', 'modest-essentials', 'chiffon'],
      options: [{ name: 'Color', value: 'Pitch Black' }]
    },

    // --- MULTI-VERTICAL EXPANSION: TECH PROTECTION ---
    {
      categoryId:
        pathToCategoryId.get('/tech/phone-accessories/tempered-glass') ?? accessoriesCat.id,
      department: 'tech',
      slug: '9h-sapphire-edge-tempered-glass',
      title: '9H Sapphire Oleophobic Edge-to-Edge Tempered Glass',
      description:
        'Diamond-hardened 9H sapphire tempered glass with electroplated oleophobic coating, 99.9% optical transparency, and dust-free auto-alignment installation frame.',
      sku: 'HH-TCH-TG-01',
      variantTitle: 'iPhone 15 / 15 Pro',
      priceMinor: 49900,
      initialQuantity: 50,
      imageUrl:
        'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&auto=format&fit=crop&q=80',
      isCustomizable: false,
      specifications: {
        glass_type: '9H Sapphire Tempered',
        device_brand: 'Apple',
        device_model: 'iPhone 15 / 15 Pro'
      },
      tags: ['tempered-glass', 'screen-protector', 'apple', 'iphone', 'tech-protection'],
      options: [{ name: 'Device', value: 'iPhone 15 / 15 Pro' }]
    },
    {
      categoryId: pathToCategoryId.get('/tech/phone-accessories/back-covers') ?? accessoriesCat.id,
      department: 'tech',
      slug: 'custom-printed-matte-shockproof-case',
      title: 'Custom Printed Matte Shockproof Armor Phone Case',
      description:
        'Dual-layer military-grade drop-tested case with anti-scratch matte backplate and shock-absorbing TPU bumper. Personalize with your custom photograph, calligraphy, or monogram.',
      sku: 'HH-TCH-BC-01',
      variantTitle: 'iPhone 15 Pro / Custom Print',
      priceMinor: 79900,
      initialQuantity: 40,
      imageUrl:
        'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&auto=format&fit=crop&q=80',
      isCustomizable: true,
      customizationConfig: {
        allowCustomText: true,
        allowImageUpload: true,
        maxCharacters: 40,
        surchargeMinor: 20000,
        customizationNotesPlaceholder:
          'Upload your high-resolution image (PNG/JPG) or enter desired text/monogram',
        productionDays: 2
      },
      specifications: {
        case_material: 'Hybrid TPU + Polycarbonate',
        case_finish: 'Matte Anti-Scratch',
        device_brand: 'Apple',
        device_model: 'iPhone 15 Pro'
      },
      tags: ['phone-case', 'custom-print', 'back-cover', 'shockproof', 'on-demand'],
      options: [
        { name: 'Device', value: 'iPhone 15 Pro' },
        { name: 'Finish', value: 'Matte Shockproof' }
      ]
    },

    // --- MULTI-VERTICAL EXPANSION: CUSTOM MERCHANDISE ---
    {
      categoryId:
        pathToCategoryId.get('/custom-merch/print-on-demand/custom-bags') ?? accessoriesCat.id,
      department: 'custom-merch',
      slug: 'heavyweight-organic-custom-tote-bag',
      title: 'Heavyweight Organic Canvas Bespoke Tote Bag',
      description:
        'Crafted from 380 GSM GOTS-certified organic unbleached cotton canvas. Reinforced box-stitched handles and interior pocket. Perfect canvas for custom art, brand logos, or personal statements.',
      sku: 'HH-MRC-BG-01',
      variantTitle: 'Natural Ecru / 380 GSM',
      priceMinor: 69900,
      initialQuantity: 25,
      imageUrl:
        'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
      isCustomizable: true,
      customizationConfig: {
        allowCustomText: true,
        allowImageUpload: true,
        maxCharacters: 50,
        surchargeMinor: 15000,
        customizationNotesPlaceholder: 'Specify typography, quotes, or upload graphic artwork',
        productionDays: 2
      },
      specifications: {
        fabric: 'Organic Unbleached Cotton Canvas',
        gsm: 380,
        print_technique: 'Direct-to-Film (DTF) / Screen Print',
        color: 'Natural Ecru'
      },
      tags: ['tote-bag', 'custom-merch', 'organic-cotton', 'canvas', 'on-demand'],
      options: [{ name: 'Color', value: 'Natural Ecru' }]
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
      await db
        .update(products)
        .set({
          categoryId: item.categoryId,
          department: item.department,
          isCustomizable: item.isCustomizable ?? false,
          customizationConfig: item.customizationConfig ?? null,
          specifications: item.specifications ?? {},
          tags: item.tags ?? []
        })
        .where(eq(products.id, existing[0].id));
      console.log(`  ↳ Product metadata updated: ${item.title}`);
      continue;
    }

    const { product, variants } = await createProductWithVariants(db, {
      storeId: store.id,
      categoryId: item.categoryId,
      department: item.department,
      slug: item.slug,
      title: item.title,
      description: item.description,
      status: 'published',
      isCustomizable: item.isCustomizable ?? false,
      customizationConfig: item.customizationConfig ?? null,
      specifications: item.specifications ?? {},
      tags: item.tags ?? [],
      variants: [
        {
          sku: item.sku,
          title: item.variantTitle,
          priceMinor: item.priceMinor,
          currency: 'INR',
          options: item.options ?? [],
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

  // 7. Seed Initial Super Admin & Sample Customer
  await db
    .insert(users)
    .values({
      storeId: store.id,
      phone: '+919999999999',
      phoneVerified: true,
      email: 'admin@handh.in',
      emailVerified: true,
      name: 'H&H Super Admin',
      role: 'super_admin',
      whatsappOptIn: true
    })
    .onConflictDoNothing()
    .returning();

  const [customer] = await db
    .insert(users)
    .values({
      storeId: store.id,
      phone: '+919876543210',
      phoneVerified: true,
      email: 'fatima@example.com',
      emailVerified: true,
      name: 'Fatima Al-Zahra',
      role: 'customer',
      whatsappOptIn: true
    })
    .onConflictDoNothing()
    .returning();

  if (customer) {
    await db.insert(userAddresses).values({
      userId: customer.id,
      label: 'Home',
      recipientName: 'Fatima Al-Zahra',
      phone: '+919876543210',
      line1: 'Flat 402, Royal Palms Apartments',
      line2: 'Banjara Hills Road No. 12',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500034',
      country: 'IN',
      isDefault: true
    });

    await db.insert(familyMembers).values([
      {
        userId: customer.id,
        name: 'Fatima (Self)',
        relationship: 'Self',
        preferences: {
          sizes: { abaya: 'M', hijab: 'Chiffon 75x180' },
          style: {
            preferredColors: ['Emerald Green', 'Royal Gold'],
            modestyLevel: 'full_coverage'
          },
          notes: 'Allergic to nickel plating'
        }
      },
      {
        userId: customer.id,
        name: 'Maryam',
        relationship: 'Daughter',
        preferences: {
          sizes: { abaya: 'S', ring: '6' },
          style: { preferredColors: ['Dusty Rose', 'Pearl White'] }
        }
      }
    ]);

    const firstProduct = await db.select({ id: products.id }).from(products).limit(1);
    if (firstProduct[0]) {
      await db.insert(wishlistItems).values({
        userId: customer.id,
        productId: firstProduct[0].id
      });
    }
  }
  console.log(
    '  ✓ Seeded super_admin (+919999999999) and sample customer (+919876543210) with preferences'
  );

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
