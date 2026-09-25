import { and, eq } from 'drizzle-orm';

import { DEFAULT_STOREFRONT_CONFIG, defaultInvoiceTemplate, flattenTaxonomyTree } from '@hh/domain';

import { createDbClient } from './index';
import { createProductWithVariants } from './repositories';
import {
  adminUsers,
  categories,
  coupons,
  familyMembers,
  fulfillments,
  inventoryLevels,
  orderItems,
  orders,
  paymentAttempts,
  productImages,
  products,
  productVariants,
  storeDomains,
  stores,
  userAddresses,
  users,
  wishlistItems
} from './schema';
import { hashPassword } from './services/admin-auth.service';

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
  const cat = {
    abayas: pathToCategoryId.get('/women/modest-wear/abayas') ?? jewelryCat.id,
    kurtis: pathToCategoryId.get('/women/modest-wear/kurtis') ?? jewelryCat.id,
    coords: pathToCategoryId.get('/women/modest-wear/co-ords') ?? jewelryCat.id,
    hijabs: pathToCategoryId.get('/women/essentials/hijabs') ?? jewelryCat.id,
    pinsClips: pathToCategoryId.get('/women/essentials/pins-clips') ?? hijabCat.id,
    nosePieces: pathToCategoryId.get('/women/essentials/nose-pieces') ?? jewelryCat.id,
    eyeVeils: pathToCategoryId.get('/women/essentials/eye-veils') ?? jewelryCat.id,
    innerCaps: pathToCategoryId.get('/women/essentials/inner-caps') ?? jewelryCat.id,
    noseStuds: pathToCategoryId.get('/women/jewelry/nose-studs') ?? jewelryCat.id,
    rings: pathToCategoryId.get('/women/jewelry/rings') ?? ringsCat.id,
    bracelets: pathToCategoryId.get('/women/jewelry/bracelets') ?? ringsCat.id,
    necklaces: pathToCategoryId.get('/women/jewelry/necklaces') ?? ringsCat.id,
    tshirts: pathToCategoryId.get('/men/apparel/t-shirts') ?? jewelryCat.id,
    shirts: pathToCategoryId.get('/men/apparel/shirts') ?? jewelryCat.id,
    joggers: pathToCategoryId.get('/men/apparel/joggers') ?? jewelryCat.id,
    footwear: pathToCategoryId.get('/men/footwear/slip-ons') ?? jewelryCat.id,
    attars: pathToCategoryId.get('/lifestyle/fragrance/attars') ?? accessoriesCat.id,
    candles: pathToCategoryId.get('/lifestyle/fragrance/candles') ?? accessoriesCat.id,
    temperedGlass: pathToCategoryId.get('/tech/protection/tempered-glass') ?? accessoriesCat.id,
    phoneCases: pathToCategoryId.get('/tech/cases/custom-printed') ?? accessoriesCat.id,
    toteBags: pathToCategoryId.get('/custom-studio/merch/tote-bags') ?? accessoriesCat.id,
    hoodies: pathToCategoryId.get('/custom-studio/apparel/hoodies') ?? accessoriesCat.id
  };

  interface CatalogVariantSpec {
    sku: string;
    title: string;
    priceMinor: number;
    compareAtPriceMinor?: number;
    currency?: 'INR';
    options?: { name: string; value: string }[];
    weightGrams?: number;
    sortOrder?: number;
    isActive?: boolean;
    initialQuantity: number;
  }

  interface CatalogImageSpec {
    storageKey: string;
    url: string;
    altText: string;
    sortOrder: number;
  }

  interface CatalogEntry {
    categoryId: string;
    department: string;
    slug: string;
    title: string;
    description: string;
    sku: string;
    variantTitle?: string;
    priceMinor?: number;
    compareAtPriceMinor?: number;
    initialQuantity?: number;
    imageUrl?: string;
    images?: CatalogImageSpec[];
    variants?: CatalogVariantSpec[];
    isCustomizable?: boolean;
    customizationConfig?: Record<string, unknown> | null;
    specifications?: Record<string, string | number | boolean>;
    tags?: string[];
    options?: { name: string; value: string }[];
    countryOfOrigin?: string;
    netQuantity?: string;
    commodityName?: string;
    manufacturerName?: string;
    manufacturerAddress?: string;
    packerName?: string;
    packerAddress?: string;
    seoTitle?: string;
    seoDescription?: string;
  }

  const catalog: CatalogEntry[] = [
    // =========================================================================
    // 1. ATELIER ABAYAS & MODEST WEAR (Women / Modest Wear)
    // =========================================================================
    {
      categoryId: cat.abayas,
      department: 'women',
      slug: 'midnight-velvet-embroidered-abaya',
      title: 'Midnight Royale Velvet Hand-Embroidered Abaya',
      description:
        'Sumptuous midnight black micro-velvet open abaya embellished with delicate antique gold zardozi and thread embroidery along the cuffs and sweeping lapels. Includes matching chiffon sheyla.',
      sku: 'HH-WMN-AB-01',
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
      tags: ['abaya', 'modest-wear', 'luxury', 'velvet', 'embroidery', 'featured'],
      commodityName: 'Women Modest Apparel',
      netQuantity: '1 N (Abaya with Sheyla)',
      variants: [
        {
          sku: 'HH-WMN-AB-01-54',
          title: 'Midnight Black / 54"',
          priceMinor: 449900,
          compareAtPriceMinor: 599900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Midnight Black' },
            { name: 'Length', value: '54"' }
          ],
          initialQuantity: 8
        },
        {
          sku: 'HH-WMN-AB-01-56',
          title: 'Midnight Black / 56"',
          priceMinor: 449900,
          compareAtPriceMinor: 599900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Midnight Black' },
            { name: 'Length', value: '56"' }
          ],
          initialQuantity: 14
        },
        {
          sku: 'HH-WMN-AB-01-58',
          title: 'Midnight Black / 58"',
          priceMinor: 449900,
          compareAtPriceMinor: 599900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Midnight Black' },
            { name: 'Length', value: '58"' }
          ],
          initialQuantity: 6
        }
      ],
      images: [
        {
          storageKey: 'products/midnight-velvet-embroidered-abaya-1.jpg',
          url: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800&auto=format&fit=crop&q=80',
          altText: 'Midnight Royale Velvet Hand-Embroidered Abaya Front View',
          sortOrder: 0
        },
        {
          storageKey: 'products/midnight-velvet-embroidered-abaya-2.jpg',
          url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
          altText: 'Midnight Royale Velvet Hand-Embroidered Abaya Embroidery Detail',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.abayas,
      department: 'women',
      slug: 'noir-medina-silk-pleated-abaya',
      title: 'Noir Medina Silk Accordion Pleated Abaya',
      description:
        'Woven from premium high-density Medina silk with refined accordion pleats cascading from the yoke. Features discreet concealed magnetic snaps and sweeping architectural movement.',
      sku: 'HH-WMN-AB-02',
      specifications: {
        fabric: 'Medina Silk',
        abaya_length: '56 inches',
        fit: 'A-Line Pleated',
        color: 'Noir Black'
      },
      tags: ['abaya', 'modest-wear', 'new-arrival', 'silk', 'featured'],
      commodityName: 'Women Modest Apparel',
      netQuantity: '1 N (Abaya with Sheyla)',
      variants: [
        {
          sku: 'HH-WMN-AB-02-54',
          title: 'Noir Black / 54"',
          priceMinor: 599900,
          compareAtPriceMinor: 749900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Noir Black' },
            { name: 'Length', value: '54"' }
          ],
          initialQuantity: 10
        },
        {
          sku: 'HH-WMN-AB-02-56',
          title: 'Noir Black / 56"',
          priceMinor: 599900,
          compareAtPriceMinor: 749900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Noir Black' },
            { name: 'Length', value: '56"' }
          ],
          initialQuantity: 15
        },
        {
          sku: 'HH-WMN-AB-02-58',
          title: 'Noir Black / 58"',
          priceMinor: 599900,
          compareAtPriceMinor: 749900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Noir Black' },
            { name: 'Length', value: '58"' }
          ],
          initialQuantity: 8
        }
      ],
      images: [
        {
          storageKey: 'products/noir-medina-silk-pleated-abaya-1.jpg',
          url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80',
          altText: 'Noir Medina Silk Accordion Pleated Abaya Full Silhouette',
          sortOrder: 0
        },
        {
          storageKey: 'products/noir-medina-silk-pleated-abaya-2.jpg',
          url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
          altText: 'Noir Medina Silk Accordion Pleated Abaya Fabric Drape',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.abayas,
      department: 'women',
      slug: 'sandstone-tailored-linen-kimono-abaya',
      title: 'Sandstone Tailored Belgian Linen Kimono Abaya',
      description:
        'Earth-toned 100% Belgian flax linen tailored with a modern kimono silhouette, deep side welt pockets, and wide cuffed sleeves. Ideal for warm climates and understated modest layering.',
      sku: 'HH-WMN-AB-03',
      specifications: {
        fabric: '100% Belgian Linen',
        abaya_length: '54 inches',
        fit: 'Kimono Overcoat',
        color: 'Sandstone Beige'
      },
      tags: ['abaya', 'linen', 'minimalist', 'bestseller'],
      commodityName: 'Women Modest Apparel',
      netQuantity: '1 N',
      variants: [
        {
          sku: 'HH-WMN-AB-03-S',
          title: 'Sandstone / Small (52")',
          priceMinor: 489900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Sandstone' },
            { name: 'Size', value: 'S (52")' }
          ],
          initialQuantity: 9
        },
        {
          sku: 'HH-WMN-AB-03-M',
          title: 'Sandstone / Medium (54")',
          priceMinor: 489900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Sandstone' },
            { name: 'Size', value: 'M (54")' }
          ],
          initialQuantity: 16
        },
        {
          sku: 'HH-WMN-AB-03-L',
          title: 'Sandstone / Large (56")',
          priceMinor: 489900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Sandstone' },
            { name: 'Size', value: 'L (56")' }
          ],
          initialQuantity: 11
        }
      ],
      images: [
        {
          storageKey: 'products/sandstone-tailored-linen-kimono-abaya-1.jpg',
          url: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&auto=format&fit=crop&q=80',
          altText: 'Sandstone Tailored Belgian Linen Kimono Abaya Model View',
          sortOrder: 0
        },
        {
          storageKey: 'products/sandstone-tailored-linen-kimono-abaya-2.jpg',
          url: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop&q=80',
          altText: 'Sandstone Tailored Belgian Linen Kimono Abaya Linen Texture',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.abayas,
      department: 'women',
      slug: 'emerald-zardozi-festive-velvet-abaya',
      title: 'Emerald Zardozi Festive Velvet Open Abaya',
      description:
        'Rich jewel-toned forest emerald micro-velvet adorned with hand-beaded antique gold zardozi along the bell sleeves and lapel. A ceremonial statement piece made for festive gatherings and eid.',
      sku: 'HH-WMN-AB-04',
      specifications: {
        fabric: 'Micro Velvet',
        fit: 'Flared Lapel Open',
        color: 'Emerald Green',
        abaya_length: '56 inches'
      },
      tags: ['abaya', 'ceremonial', 'velvet', 'zardozi', 'luxury'],
      commodityName: 'Women Modest Apparel',
      netQuantity: '1 N (Abaya with Sheyla)',
      variants: [
        {
          sku: 'HH-WMN-AB-04-54',
          title: 'Emerald Green / 54"',
          priceMinor: 799900,
          compareAtPriceMinor: 999900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Emerald Green' },
            { name: 'Length', value: '54"' }
          ],
          initialQuantity: 6
        },
        {
          sku: 'HH-WMN-AB-04-56',
          title: 'Emerald Green / 56"',
          priceMinor: 799900,
          compareAtPriceMinor: 999900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Emerald Green' },
            { name: 'Length', value: '56"' }
          ],
          initialQuantity: 8
        }
      ],
      images: [
        {
          storageKey: 'products/emerald-zardozi-festive-velvet-abaya-1.jpg',
          url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
          altText: 'Emerald Zardozi Festive Velvet Open Abaya Studio Shot',
          sortOrder: 0
        },
        {
          storageKey: 'products/emerald-zardozi-festive-velvet-abaya-2.jpg',
          url: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=800&auto=format&fit=crop&q=80',
          altText: 'Emerald Zardozi Festive Velvet Open Abaya Sleeve Detail',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.abayas,
      department: 'women',
      slug: 'mauve-blush-crepe-closed-abaya',
      title: 'Mauve Blush Textured Crepe Closed Abaya',
      description:
        'Subtle mauve-tinted heavy crepe closed abaya with concealed front zipper and gathered elastic cuffs. Non-sheer, wrinkle-resistant everyday luxury.',
      sku: 'HH-WMN-AB-05',
      specifications: {
        fabric: 'Nida Crepe',
        fit: 'Straight Closed',
        color: 'Mauve Blush',
        abaya_length: '54 inches'
      },
      tags: ['abaya', 'crepe', 'casual', 'everyday'],
      commodityName: 'Women Modest Apparel',
      netQuantity: '1 N',
      variants: [
        {
          sku: 'HH-WMN-AB-05-54',
          title: 'Mauve Blush / 54"',
          priceMinor: 379900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Mauve Blush' },
            { name: 'Length', value: '54"' }
          ],
          initialQuantity: 3
        },
        {
          sku: 'HH-WMN-AB-05-56',
          title: 'Mauve Blush / 56"',
          priceMinor: 379900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Mauve Blush' },
            { name: 'Length', value: '56"' }
          ],
          initialQuantity: 2
        }
      ],
      images: [
        {
          storageKey: 'products/mauve-blush-crepe-closed-abaya-1.jpg',
          url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
          altText: 'Mauve Blush Textured Crepe Closed Abaya Full View',
          sortOrder: 0
        },
        {
          storageKey: 'products/mauve-blush-crepe-closed-abaya-2.jpg',
          url: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&auto=format&fit=crop&q=80',
          altText: 'Mauve Blush Textured Crepe Closed Abaya Fabric Texture',
          sortOrder: 1
        }
      ]
    },

    // =========================================================================
    // 2. CHIFFON & SILK HIJABS (Women / Hijab & Modest Essentials)
    // =========================================================================
    {
      categoryId: cat.hijabs,
      department: 'women',
      slug: 'mulberry-silk-satin-luxe-hijab',
      title: 'Mulberry Silk Satin Luxe Hijab',
      description:
        'Pure 100% 19-momme Mulberry silk with a subtle lustrous sheen on the exterior and a gentle matte non-slip interior. Finished with hand-rolled bespoke hems.',
      sku: 'HH-WMN-HJ-01',
      specifications: {
        fabric: '100% Mulberry Silk',
        dimensions: '75 x 190 cm',
        hem: 'Hand-Rolled'
      },
      tags: ['hijab', 'mulberry-silk', 'luxury', 'featured', 'new-arrival'],
      commodityName: 'Silk Scarf',
      netQuantity: '1 N',
      variants: [
        {
          sku: 'HH-WMN-HJ-01-CH',
          title: 'Champagne Ivory',
          priceMinor: 189900,
          compareAtPriceMinor: 249900,
          currency: 'INR',
          options: [{ name: 'Color', value: 'Champagne Ivory' }],
          initialQuantity: 20
        },
        {
          sku: 'HH-WMN-HJ-01-SG',
          title: 'Sage Green',
          priceMinor: 189900,
          compareAtPriceMinor: 249900,
          currency: 'INR',
          options: [{ name: 'Color', value: 'Sage Green' }],
          initialQuantity: 15
        },
        {
          sku: 'HH-WMN-HJ-01-DR',
          title: 'Dusty Rose',
          priceMinor: 189900,
          compareAtPriceMinor: 249900,
          currency: 'INR',
          options: [{ name: 'Color', value: 'Dusty Rose' }],
          initialQuantity: 18
        }
      ],
      images: [
        {
          storageKey: 'products/mulberry-silk-satin-luxe-hijab-1.jpg',
          url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80',
          altText: 'Mulberry Silk Satin Luxe Hijab Draped in Natural Light',
          sortOrder: 0
        },
        {
          storageKey: 'products/mulberry-silk-satin-luxe-hijab-2.jpg',
          url: 'https://images.unsplash.com/photo-1601762603339-fd61e28b698a?w=800&auto=format&fit=crop&q=80',
          altText: 'Mulberry Silk Satin Luxe Hijab Styled on Model',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.hijabs,
      department: 'women',
      slug: 'modal-cotton-everyday-hijab',
      title: 'Modal Cotton Everyday Featherlight Hijab',
      description:
        'Sustainably sourced beechwood modal cotton offering unmatched breathability and natural drape without snagging. Requires no undercap or styling pins for casual wear.',
      sku: 'HH-WMN-HJ-02',
      specifications: {
        fabric: 'Beechwood Modal Cotton',
        dimensions: '80 x 200 cm',
        hem: 'Precision Eyelash Fringe'
      },
      tags: ['hijab', 'modal-cotton', 'everyday', 'breathable', 'bestseller'],
      commodityName: 'Modal Hijab',
      netQuantity: '1 N',
      variants: [
        {
          sku: 'HH-WMN-HJ-02-MC',
          title: 'Mocha Taupe',
          priceMinor: 89900,
          currency: 'INR',
          options: [{ name: 'Color', value: 'Mocha Taupe' }],
          initialQuantity: 30
        },
        {
          sku: 'HH-WMN-HJ-02-CH',
          title: 'Soft Charcoal',
          priceMinor: 89900,
          currency: 'INR',
          options: [{ name: 'Color', value: 'Soft Charcoal' }],
          initialQuantity: 25
        },
        {
          sku: 'HH-WMN-HJ-02-DS',
          title: 'Desert Sand',
          priceMinor: 89900,
          currency: 'INR',
          options: [{ name: 'Color', value: 'Desert Sand' }],
          initialQuantity: 28
        }
      ],
      images: [
        {
          storageKey: 'products/modal-cotton-everyday-hijab-1.jpg',
          url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
          altText: 'Modal Cotton Everyday Featherlight Hijab Texture',
          sortOrder: 0
        },
        {
          storageKey: 'products/modal-cotton-everyday-hijab-2.jpg',
          url: 'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?w=800&auto=format&fit=crop&q=80',
          altText: 'Modal Cotton Everyday Featherlight Hijab Flat Lay',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.hijabs,
      department: 'women',
      slug: 'crinkle-chiffon-occasion-hijab',
      title: 'Crinkle Chiffon Hand-Hemmed Occasion Hijab',
      description:
        'Delicately textured crinkle georgette chiffon that drapes with graceful volume and remains completely slip-free. Hand-dyed in small artisan lots.',
      sku: 'HH-WMN-HJ-03',
      specifications: {
        fabric: 'Georgette Chiffon',
        dimensions: '70 x 185 cm',
        hem: 'Baby Overlock'
      },
      tags: ['hijab', 'chiffon', 'crinkle', 'occasion'],
      commodityName: 'Chiffon Hijab',
      netQuantity: '1 N',
      variants: [
        {
          sku: 'HH-WMN-HJ-03-CR',
          title: 'Caramel Warm',
          priceMinor: 119900,
          currency: 'INR',
          options: [{ name: 'Color', value: 'Caramel Warm' }],
          initialQuantity: 18
        },
        {
          sku: 'HH-WMN-HJ-03-PW',
          title: 'Pearl White',
          priceMinor: 119900,
          currency: 'INR',
          options: [{ name: 'Color', value: 'Pearl White' }],
          initialQuantity: 16
        }
      ],
      images: [
        {
          storageKey: 'products/crinkle-chiffon-occasion-hijab-1.jpg',
          url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80',
          altText: 'Crinkle Chiffon Occasion Hijab Flow',
          sortOrder: 0
        },
        {
          storageKey: 'products/crinkle-chiffon-occasion-hijab-2.jpg',
          url: 'https://images.unsplash.com/photo-1601762603339-fd61e28b698a?w=800&auto=format&fit=crop&q=80',
          altText: 'Crinkle Chiffon Occasion Hijab Draped Styling',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.hijabs,
      department: 'women',
      slug: 'seamless-bamboo-jersey-hijab',
      title: 'Seamless Bamboo Jersey Stretch Hijab',
      description:
        'Silky smooth 4-way stretch bamboo rayon jersey. Naturally antibacterial, thermal regulating, and gentle on sensitive hair and skin.',
      sku: 'HH-WMN-HJ-04',
      specifications: {
        fabric: 'Bamboo Rayon Jersey',
        dimensions: '65 x 175 cm',
        hem: 'Seamless Laser Cut'
      },
      tags: ['hijab', 'jersey', 'bamboo', 'comfort'],
      commodityName: 'Jersey Hijab',
      netQuantity: '1 N',
      variants: [
        {
          sku: 'HH-WMN-HJ-04-HG',
          title: 'Heather Grey',
          priceMinor: 99900,
          currency: 'INR',
          options: [{ name: 'Color', value: 'Heather Grey' }],
          initialQuantity: 22
        },
        {
          sku: 'HH-WMN-HJ-04-JB',
          title: 'Jet Black',
          priceMinor: 99900,
          currency: 'INR',
          options: [{ name: 'Color', value: 'Jet Black' }],
          initialQuantity: 30
        }
      ],
      images: [
        {
          storageKey: 'products/seamless-bamboo-jersey-hijab-1.jpg',
          url: 'https://images.unsplash.com/photo-1584030373081-f37b7bb4fa8e?w=800&auto=format&fit=crop&q=80',
          altText: 'Seamless Bamboo Jersey Stretch Hijab Soft Drape',
          sortOrder: 0
        },
        {
          storageKey: 'products/seamless-bamboo-jersey-hijab-2.jpg',
          url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
          altText: 'Seamless Bamboo Jersey Stretch Hijab Fabric Detail',
          sortOrder: 1
        }
      ]
    },

    // =========================================================================
    // 3. HIJAB ACCENTS & BROOCHES (Women / Hijab & Modest Essentials)
    // =========================================================================
    {
      categoryId: cat.pinsClips,
      department: 'women',
      slug: 'safiya-magnetic-hijab-pins',
      title: 'Safiya Magnetic Hijab Pins (Set of 4)',
      description:
        'Ultra-strong rare-earth magnetic clasps that keep your silk, chiffon, or jersey hijabs flawlessly in place without pin holes.',
      sku: 'HH-ACC-HP-01',
      specifications: { metal_finish: 'Matte Gold / Gunmetal', magnet_type: 'N52 Neodymium' },
      tags: ['hijab-accessories', 'magnetic-pins', 'modest-essentials', 'bestseller'],
      commodityName: 'Magnetic Hijab Clasp',
      netQuantity: '1 N (Set of 4)',
      variants: [
        {
          sku: 'HH-ACC-HP-01-A',
          title: 'Matte Gold & Gunmetal Pack',
          priceMinor: 39900,
          currency: 'INR',
          options: [{ name: 'Pack', value: 'Matte Gold & Gunmetal' }],
          initialQuantity: 25
        },
        {
          sku: 'HH-ACC-HP-01-B',
          title: 'Rose Gold & Rhodium Silver Pack',
          priceMinor: 39900,
          currency: 'INR',
          options: [{ name: 'Pack', value: 'Rose Gold & Silver' }],
          initialQuantity: 20
        }
      ],
      images: [
        {
          storageKey: 'products/safiya-magnetic-hijab-pins-1.jpg',
          url: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800&auto=format&fit=crop&q=80',
          altText: 'Safiya Magnetic Hijab Pins Set of 4 in Gift Box',
          sortOrder: 0
        },
        {
          storageKey: 'products/safiya-magnetic-hijab-pins-2.jpg',
          url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
          altText: 'Safiya Magnetic Hijab Pins Precision Finish',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.pinsClips,
      department: 'women',
      slug: 'layla-crystal-brooch',
      title: 'Layla Crystal Floral Brooch',
      description:
        'Hand-set micro zircon crystals arranged in a delicate crescent floral spray. The perfect accent for ceremonial Abayas and evening shawls.',
      sku: 'HH-ACC-HP-02',
      variantTitle: 'Champagne Gold / Zircon',
      priceMinor: 89900,
      initialQuantity: 8,
      specifications: { metal_finish: 'Champagne Gold', stone_type: 'Micro Zircon' },
      tags: ['brooch', 'crystal', 'abaya-accents', 'ceremonial'],
      commodityName: 'Fashion Brooch',
      netQuantity: '1 N',
      options: [{ name: 'Finish', value: 'Champagne Gold' }],
      images: [
        {
          storageKey: 'products/layla-crystal-brooch-1.jpg',
          url: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&auto=format&fit=crop&q=80',
          altText: 'Layla Crystal Floral Brooch Jewelry Detail',
          sortOrder: 0
        },
        {
          storageKey: 'products/layla-crystal-brooch-2.jpg',
          url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80',
          altText: 'Layla Crystal Floral Brooch Styled on Fabric',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.pinsClips,
      department: 'women',
      slug: 'ottoman-crescent-heritage-brooch',
      title: 'Ottoman Crescent Heritage Brooch Pin',
      description:
        'Hand-cast micro filigree crescent adorned with a teardrop freshwater pearl and 18K antique gold vermeil finish. Designed to fasten ceremonial shawls and abayas without damaging delicate threads.',
      sku: 'HH-ACC-HP-03',
      variantTitle: '18K Antique Gold / Pearl',
      priceMinor: 74900,
      compareAtPriceMinor: 99900,
      initialQuantity: 12,
      specifications: {
        metal_finish: '18K Antique Gold Vermeil',
        stone_type: 'Freshwater Pearl'
      },
      tags: ['brooch', 'heritage', 'gold-vermeil', 'pearl', 'new-arrival'],
      commodityName: 'Fashion Brooch',
      netQuantity: '1 N',
      options: [{ name: 'Finish', value: '18K Antique Gold Vermeil' }],
      images: [
        {
          storageKey: 'products/ottoman-crescent-heritage-brooch-1.jpg',
          url: 'https://images.unsplash.com/photo-1611591475825-9d33bdfc5453?w=800&auto=format&fit=crop&q=80',
          altText: 'Ottoman Crescent Heritage Brooch Pin Antique Polish',
          sortOrder: 0
        },
        {
          storageKey: 'products/ottoman-crescent-heritage-brooch-2.jpg',
          url: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&auto=format&fit=crop&q=80',
          altText: 'Ottoman Crescent Heritage Brooch Pearl Detail',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.pinsClips,
      department: 'women',
      slug: 'snag-free-matte-velvet-magnets',
      title: 'Snag-Free Matte Velvet Hijab Magnets (Pack of 6)',
      description:
        'N52 neodymium ultra-strength magnets encased in soft-touch silicone matte finish. Zero snagging on pure silks and gauzy chiffons.',
      sku: 'HH-ACC-HP-04',
      specifications: {
        magnet_type: 'N52 Neodymium',
        finish: 'Soft-Touch Matte Silicone'
      },
      tags: ['magnetic-pins', 'snag-free', 'modest-essentials'],
      commodityName: 'Magnetic Hijab Pins',
      netQuantity: '1 N (Set of 6)',
      variants: [
        {
          sku: 'HH-ACC-HP-04-A',
          title: 'Nude Palette Pack (6 pcs)',
          priceMinor: 54900,
          currency: 'INR',
          options: [{ name: 'Pack', value: 'Nude Palette (6 pcs)' }],
          initialQuantity: 35
        },
        {
          sku: 'HH-ACC-HP-04-B',
          title: 'Monochrome Black & Slate (6 pcs)',
          priceMinor: 54900,
          currency: 'INR',
          options: [{ name: 'Pack', value: 'Monochrome Pack (6 pcs)' }],
          initialQuantity: 30
        }
      ],
      images: [
        {
          storageKey: 'products/snag-free-matte-velvet-magnets-1.jpg',
          url: 'https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=800&auto=format&fit=crop&q=80',
          altText: 'Snag-Free Matte Velvet Hijab Magnets Pack of 6',
          sortOrder: 0
        },
        {
          storageKey: 'products/snag-free-matte-velvet-magnets-2.jpg',
          url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
          altText: 'Snag-Free Matte Velvet Hijab Magnets Precision Alignment',
          sortOrder: 1
        }
      ]
    },

    // =========================================================================
    // 4. MODEST CO-ORDS & KURTIS (Women / Modest Wear)
    // =========================================================================
    {
      categoryId: cat.coords,
      department: 'women',
      slug: 'monochrome-linen-tunic-trouser-coord',
      title: 'Monochrome Belgian Linen Tunic & Trouser Co-Ord Set',
      description:
        'Relaxed two-piece modest ensemble featuring a high-slit tunic and pleated wide-leg trousers crafted from enzyme-washed European flax linen. Fully opaque and effortless.',
      sku: 'HH-WMN-CO-01',
      specifications: {
        fabric: '100% Enzyme-Washed Linen',
        fit: 'Relaxed High Slit',
        pattern: 'Solid Monochrome'
      },
      tags: ['co-ords', 'modest-wear', 'linen', 'tailored', 'new-arrival'],
      commodityName: 'Women Co-Ord Set',
      netQuantity: '1 N (Tunic & Trouser)',
      variants: [
        {
          sku: 'HH-WMN-CO-01-S',
          title: 'Sandstone Ecru / S',
          priceMinor: 499900,
          compareAtPriceMinor: 649900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Sandstone Ecru' },
            { name: 'Size', value: 'S' }
          ],
          initialQuantity: 10
        },
        {
          sku: 'HH-WMN-CO-01-M',
          title: 'Sandstone Ecru / M',
          priceMinor: 499900,
          compareAtPriceMinor: 649900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Sandstone Ecru' },
            { name: 'Size', value: 'M' }
          ],
          initialQuantity: 15
        },
        {
          sku: 'HH-WMN-CO-01-L',
          title: 'Sandstone Ecru / L',
          priceMinor: 499900,
          compareAtPriceMinor: 649900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Sandstone Ecru' },
            { name: 'Size', value: 'L' }
          ],
          initialQuantity: 8
        }
      ],
      images: [
        {
          storageKey: 'products/monochrome-linen-tunic-trouser-coord-1.jpg',
          url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
          altText: 'Monochrome Belgian Linen Tunic Trouser Co-Ord Full Silhouette',
          sortOrder: 0
        },
        {
          storageKey: 'products/monochrome-linen-tunic-trouser-coord-2.jpg',
          url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop&q=80',
          altText: 'Monochrome Belgian Linen Tunic Trouser Co-Ord Fabric Drape',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.coords,
      department: 'women',
      slug: 'aura-draped-raw-silk-tunic-suit',
      title: 'Aura Draped Raw Silk Tunic Suit',
      description:
        'Sculptural asymmetric raw silk tunic paired with slim cigarette trousers. Hand-embroidered tonal thread details along the mandarin collar.',
      sku: 'HH-WMN-CO-02',
      specifications: {
        fabric: 'Raw Silk Blend',
        fit: 'Asymmetric Drape',
        color: 'Dusty Sage'
      },
      tags: ['co-ords', 'raw-silk', 'tunic', 'luxury'],
      commodityName: 'Women Tunic Suit',
      netQuantity: '1 N (Tunic & Trouser)',
      variants: [
        {
          sku: 'HH-WMN-CO-02-M',
          title: 'Dusty Sage / M',
          priceMinor: 549900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Dusty Sage' },
            { name: 'Size', value: 'M' }
          ],
          initialQuantity: 7
        },
        {
          sku: 'HH-WMN-CO-02-L',
          title: 'Dusty Sage / L',
          priceMinor: 549900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Dusty Sage' },
            { name: 'Size', value: 'L' }
          ],
          initialQuantity: 9
        }
      ],
      images: [
        {
          storageKey: 'products/aura-draped-raw-silk-tunic-suit-1.jpg',
          url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&auto=format&fit=crop&q=80',
          altText: 'Aura Draped Raw Silk Tunic Suit Editorial View',
          sortOrder: 0
        },
        {
          storageKey: 'products/aura-draped-raw-silk-tunic-suit-2.jpg',
          url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
          altText: 'Aura Draped Raw Silk Tunic Suit Collar Stitching',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.kurtis,
      department: 'women',
      slug: 'handcrafted-chanderi-zari-kurti',
      title: 'Handcrafted Chanderi Zari Embroidered Kurti',
      description:
        'Traditional Chanderi handloom cotton-silk kurti featuring delicate gold zari buta work across the yoke, deep side pockets, and fine mulmul lining.',
      sku: 'HH-WMN-KR-01',
      specifications: {
        fabric: 'Chanderi Cotton-Silk',
        fit: 'Straight Silhouette',
        craftsmanship: 'Handloom Zari Weave'
      },
      tags: ['kurtis', 'chanderi', 'handloom', 'zari', 'modest-wear'],
      commodityName: 'Women Kurti',
      netQuantity: '1 N',
      variants: [
        {
          sku: 'HH-WMN-KR-01-S',
          title: 'Ivory & Gold / S',
          priceMinor: 349900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Ivory & Gold' },
            { name: 'Size', value: 'S' }
          ],
          initialQuantity: 10
        },
        {
          sku: 'HH-WMN-KR-01-M',
          title: 'Ivory & Gold / M',
          priceMinor: 349900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Ivory & Gold' },
            { name: 'Size', value: 'M' }
          ],
          initialQuantity: 14
        },
        {
          sku: 'HH-WMN-KR-01-L',
          title: 'Ivory & Gold / L',
          priceMinor: 349900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Ivory & Gold' },
            { name: 'Size', value: 'L' }
          ],
          initialQuantity: 12
        }
      ],
      images: [
        {
          storageKey: 'products/handcrafted-chanderi-zari-kurti-1.jpg',
          url: 'https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?w=800&auto=format&fit=crop&q=80',
          altText: 'Handcrafted Chanderi Zari Embroidered Kurti Studio Front',
          sortOrder: 0
        },
        {
          storageKey: 'products/handcrafted-chanderi-zari-kurti-2.jpg',
          url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop&q=80',
          altText: 'Handcrafted Chanderi Zari Embroidered Kurti Weave Texture',
          sortOrder: 1
        }
      ]
    },

    // =========================================================================
    // 5. NOSE PIECES, CLIPS & STUD JEWELRY (Accessories / Nose Pieces & Clips)
    // =========================================================================
    {
      categoryId: cat.nosePieces,
      department: 'accessories',
      slug: 'pearl-glow-nose-piece',
      title: 'Pearl Glow Nose Piece',
      description:
        'An exquisitely crafted nose piece adorned with lustrous pearls and finished in warm gold tones. Designed for graceful wear atop an Abaya or statement modesty.',
      sku: 'HH-ACC-NP-01',
      variantTitle: 'Warm Gold / Pearl',
      priceMinor: 59900,
      initialQuantity: 15,
      specifications: { metal_finish: 'Warm Gold Polish', stone_type: 'Freshwater Pearl' },
      tags: ['jewelry', 'nose-piece', 'pearl', 'gold', 'accessories', 'featured'],
      commodityName: 'Fashion Jewelry Nose Piece',
      netQuantity: '1 N',
      options: [{ name: 'Finish', value: 'Warm Gold' }],
      images: [
        {
          storageKey: 'products/pearl-glow-nose-piece-1.jpg',
          url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
          altText: 'Pearl Glow Nose Piece in Warm Gold',
          sortOrder: 0
        },
        {
          storageKey: 'products/pearl-glow-nose-piece-2.jpg',
          url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
          altText: 'Pearl Glow Nose Piece Macro Pearl Setting',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.nosePieces,
      department: 'accessories',
      slug: 'minimalist-silver-nose-piece',
      title: 'Minimalist Silver Nose Piece',
      description:
        'Clean architectural lines with hand-polished 925 sterling silver sheen. Understated luxury engineered for comfortable all-day wear.',
      sku: 'HH-ACC-NP-02',
      variantTitle: '925 Sterling Silver',
      priceMinor: 49900,
      initialQuantity: 8,
      specifications: { metal_purity: '925 Sterling Silver', metal_finish: 'High Polish' },
      tags: ['jewelry', 'nose-piece', 'silver', 'minimalist'],
      commodityName: 'Silver Nose Piece',
      netQuantity: '1 N',
      options: [{ name: 'Material', value: '925 Silver' }],
      images: [
        {
          storageKey: 'products/minimalist-silver-nose-piece-1.jpg',
          url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&auto=format&fit=crop&q=80',
          altText: 'Minimalist Silver Nose Piece Studio Display',
          sortOrder: 0
        },
        {
          storageKey: 'products/minimalist-silver-nose-piece-2.jpg',
          url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
          altText: 'Minimalist Silver Nose Piece Architectural Curve',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.nosePieces,
      department: 'accessories',
      slug: 'crystal-floral-nose-piece',
      title: 'Crystal Floral Nose Piece',
      description:
        'Intricate floral filigree accented with delicate, light-catching crystals. Adds an ethereal finish to formal occasions.',
      sku: 'HH-ACC-NP-03',
      variantTitle: 'Silver Polish / Clear Crystal',
      priceMinor: 64900,
      initialQuantity: 12,
      specifications: { metal_finish: 'Silver Polish', stone_type: 'Cubic Zirconia' },
      tags: ['jewelry', 'nose-piece', 'crystal', 'floral'],
      commodityName: 'Fashion Jewelry Nose Piece',
      netQuantity: '1 N',
      options: [{ name: 'Finish', value: 'Silver Polish' }],
      images: [
        {
          storageKey: 'products/crystal-floral-nose-piece-1.jpg',
          url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80',
          altText: 'Crystal Floral Nose Piece Filigree Detail',
          sortOrder: 0
        },
        {
          storageKey: 'products/crystal-floral-nose-piece-2.jpg',
          url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80',
          altText: 'Crystal Floral Nose Piece Macro Crystal Facet',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.nosePieces,
      department: 'accessories',
      slug: 'vintage-filigree-nose-piece',
      title: 'Vintage Filigree Nose Piece',
      description:
        'Traditional heritage motifs cast in antiqued brass with subtle engravings for an authentic artisanal aesthetic.',
      sku: 'HH-ACC-NP-04',
      variantTitle: 'Antiqued Brass',
      priceMinor: 59900,
      initialQuantity: 100,
      specifications: { metal_finish: 'Antiqued Brass' },
      tags: ['jewelry', 'nose-piece', 'vintage', 'filigree'],
      commodityName: 'Brass Nose Piece',
      netQuantity: '1 N',
      options: [{ name: 'Material', value: 'Antiqued Brass' }],
      images: [
        {
          storageKey: 'products/vintage-filigree-nose-piece-1.jpg',
          url: 'https://images.unsplash.com/photo-1611591475825-9d33bdfc5453?w=800&auto=format&fit=crop&q=80',
          altText: 'Vintage Filigree Nose Piece Antique Brass',
          sortOrder: 0
        },
        {
          storageKey: 'products/vintage-filigree-nose-piece-2.jpg',
          url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80',
          altText: 'Vintage Filigree Nose Piece Hand Engraved Motif',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.noseStuds,
      department: 'accessories',
      slug: 'ameera-freshwater-pearl-stud',
      title: 'Ameera Natural Pearl Nose Stud',
      description:
        'Authentic freshwater button pearl mounted on hypoallergenic sterling silver. Subtle, dignified, and luminous.',
      sku: 'HH-ACC-NP-05',
      variantTitle: 'Freshwater Pearl / Silver',
      priceMinor: 79900,
      initialQuantity: 100,
      specifications: { stone_type: 'Freshwater Pearl', metal_purity: '925 Sterling Silver' },
      tags: ['jewelry', 'nose-stud', 'pearl', 'silver', 'bestseller'],
      commodityName: 'Silver Pearl Stud',
      netQuantity: '1 N',
      options: [{ name: 'Stone', value: 'Freshwater Pearl' }],
      images: [
        {
          storageKey: 'products/ameera-freshwater-pearl-stud-1.jpg',
          url: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&auto=format&fit=crop&q=80',
          altText: 'Ameera Natural Pearl Nose Stud Display',
          sortOrder: 0
        },
        {
          storageKey: 'products/ameera-freshwater-pearl-stud-2.jpg',
          url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
          altText: 'Ameera Natural Pearl Nose Stud Pearl Lustre',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.noseStuds,
      department: 'accessories',
      slug: 'zahra-cz-solitaire-ring',
      title: 'Zahra Solitaire CZ Nose Ring',
      description:
        'Brilliant-cut cubic zirconia in a bezel silver setting. Effortless sparkle without overwhelming subtlety.',
      sku: 'HH-ACC-NP-06',
      variantTitle: 'Rhodium Silver / CZ',
      priceMinor: 54900,
      initialQuantity: 0,
      specifications: { stone_type: 'Cubic Zirconia', metal_finish: 'Rhodium Plated' },
      tags: ['jewelry', 'nose-ring', 'solitaire', 'cz'],
      commodityName: 'Silver Nose Ring',
      netQuantity: '1 N',
      options: [{ name: 'Finish', value: 'Rhodium Silver' }],
      images: [
        {
          storageKey: 'products/zahra-cz-solitaire-ring-1.jpg',
          url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&auto=format&fit=crop&q=80',
          altText: 'Zahra Solitaire CZ Nose Ring Macro View',
          sortOrder: 0
        },
        {
          storageKey: 'products/zahra-cz-solitaire-ring-2.jpg',
          url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80',
          altText: 'Zahra Solitaire CZ Nose Ring Bezel Setting',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.nosePieces,
      department: 'accessories',
      slug: 'crescent-moon-vermeil-nose-clip',
      title: 'Crescent Moon 18K Gold Vermeil Nose Clip',
      description:
        'Delicate clip-on nose piece crafted in 18K gold vermeil over sterling silver. Designed for non-pierced elegance with gentle cushioned spring tension.',
      sku: 'HH-ACC-NP-07',
      variantTitle: '18K Yellow Gold Vermeil',
      priceMinor: 69900,
      compareAtPriceMinor: 89900,
      initialQuantity: 18,
      specifications: {
        metal_purity: '18K Gold Vermeil',
        metal_finish: 'High Polish',
        piercing_required: 'No (Clip-on)'
      },
      tags: ['jewelry', 'nose-clip', 'clip-on', 'gold-vermeil', 'new-arrival'],
      commodityName: 'Gold Vermeil Nose Clip',
      netQuantity: '1 N',
      options: [{ name: 'Finish', value: '18K Gold Vermeil' }],
      images: [
        {
          storageKey: 'products/crescent-moon-vermeil-nose-clip-1.jpg',
          url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
          altText: 'Crescent Moon 18K Gold Vermeil Nose Clip',
          sortOrder: 0
        },
        {
          storageKey: 'products/crescent-moon-vermeil-nose-clip-2.jpg',
          url: 'https://images.unsplash.com/photo-1611591475825-9d33bdfc5453?w=800&auto=format&fit=crop&q=80',
          altText: 'Crescent Moon 18K Gold Vermeil Crescent Arch',
          sortOrder: 1
        }
      ]
    },

    // =========================================================================
    // 6. RINGS & BANGLES (Accessories / Rings & Bangles)
    // =========================================================================
    {
      categoryId: cat.bracelets,
      department: 'accessories',
      slug: 'qamar-crescent-cuff',
      title: 'Qamar Crescent Cuff Bracelet',
      description:
        'Hand-hammered brass cuff bracelet with high-polish 18k gold vermeil finish. Open-ended adjustable fit.',
      sku: 'HH-ACC-JW-01',
      variantTitle: '18k Gold Vermeil',
      priceMinor: 129900,
      initialQuantity: 4,
      specifications: { metal_purity: '18k Gold Vermeil', metal_finish: 'Hand-Hammered Polish' },
      tags: ['jewelry', 'bracelet', 'cuff', 'gold'],
      commodityName: 'Vermeil Cuff Bracelet',
      netQuantity: '1 N',
      options: [{ name: 'Finish', value: '18k Gold Vermeil' }],
      images: [
        {
          storageKey: 'products/qamar-crescent-cuff-1.jpg',
          url: 'https://images.unsplash.com/photo-1611591475825-9d33bdfc5453?w=800&auto=format&fit=crop&q=80',
          altText: 'Qamar Crescent Cuff Bracelet Display',
          sortOrder: 0
        },
        {
          storageKey: 'products/qamar-crescent-cuff-2.jpg',
          url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80',
          altText: 'Qamar Crescent Cuff Bracelet Hand Hammered Texture',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.rings,
      department: 'accessories',
      slug: 'medina-silver-band',
      title: 'Medina Hand-Hammered Silver Band',
      description:
        'Chiseled solid 925 sterling silver band with organic facets that catch ambient light.',
      sku: 'HH-ACC-JW-02',
      variantTitle: 'Solid 925 Silver',
      priceMinor: 149900,
      initialQuantity: 5,
      specifications: { metal_purity: '925 Sterling Silver', metal_finish: 'Chiseled Matte' },
      tags: ['jewelry', 'ring', 'silver', 'handcrafted'],
      commodityName: 'Silver Ring Band',
      netQuantity: '1 N',
      options: [{ name: 'Size', value: 'Adjustable' }],
      images: [
        {
          storageKey: 'products/medina-silver-band-1.jpg',
          url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80',
          altText: 'Medina Hand-Hammered Silver Band Ring',
          sortOrder: 0
        },
        {
          storageKey: 'products/medina-silver-band-2.jpg',
          url: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800&auto=format&fit=crop&q=80',
          altText: 'Medina Hand-Hammered Silver Band Macro Chisel',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.rings,
      department: 'accessories',
      slug: 'chevron-diamond-cut-stackable-rings',
      title: 'Chevron Diamond-Cut Stackable Ring Trio',
      description:
        'Set of three interlocking chevron bands crafted in 925 sterling silver with micro diamond-cut facets that scintillate with every gesture. Wear solo or stacked.',
      sku: 'HH-ACC-JW-03',
      specifications: {
        metal_purity: '925 Sterling Silver',
        metal_finish: 'Diamond-Cut Facets'
      },
      tags: ['jewelry', 'ring', 'silver', 'stackable', 'new-arrival'],
      commodityName: 'Silver Ring Set',
      netQuantity: '1 N (Set of 3)',
      variants: [
        {
          sku: 'HH-ACC-JW-03-06',
          title: 'Size 6 (16.5 mm)',
          priceMinor: 129900,
          compareAtPriceMinor: 169900,
          currency: 'INR',
          options: [{ name: 'Ring Size', value: '6' }],
          initialQuantity: 12
        },
        {
          sku: 'HH-ACC-JW-03-07',
          title: 'Size 7 (17.3 mm)',
          priceMinor: 129900,
          compareAtPriceMinor: 169900,
          currency: 'INR',
          options: [{ name: 'Ring Size', value: '7' }],
          initialQuantity: 15
        },
        {
          sku: 'HH-ACC-JW-03-08',
          title: 'Size 8 (18.1 mm)',
          priceMinor: 129900,
          compareAtPriceMinor: 169900,
          currency: 'INR',
          options: [{ name: 'Ring Size', value: '8' }],
          initialQuantity: 10
        }
      ],
      images: [
        {
          storageKey: 'products/chevron-diamond-cut-stackable-rings-1.jpg',
          url: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800&auto=format&fit=crop&q=80',
          altText: 'Chevron Diamond-Cut Stackable Ring Trio on Velvet',
          sortOrder: 0
        },
        {
          storageKey: 'products/chevron-diamond-cut-stackable-rings-2.jpg',
          url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80',
          altText: 'Chevron Diamond-Cut Stackable Ring Trio Geometry',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.bracelets,
      department: 'accessories',
      slug: 'artisanal-chiseled-brass-kada-cuff',
      title: 'Artisanal Chiseled Brass Kada Cuff',
      description:
        'Heavyweight architectural brass kada featuring hand-chiseled geometric fluting and sealed with micro-wax to prevent tarnish. Solid yet easily adjustable.',
      sku: 'HH-ACC-JW-04',
      variantTitle: 'Antique Chiseled Brass',
      priceMinor: 159900,
      initialQuantity: 3,
      specifications: {
        metal_finish: 'Hand-Chiseled Antique Brass',
        weight: '45 grams'
      },
      tags: ['jewelry', 'cuff', 'kada', 'brass', 'handcrafted'],
      commodityName: 'Brass Kada Cuff',
      netQuantity: '1 N',
      options: [{ name: 'Finish', value: 'Antique Chiseled' }],
      images: [
        {
          storageKey: 'products/artisanal-chiseled-brass-kada-cuff-1.jpg',
          url: 'https://images.unsplash.com/photo-1611591475825-9d33bdfc5453?w=800&auto=format&fit=crop&q=80',
          altText: 'Artisanal Chiseled Brass Kada Cuff Display',
          sortOrder: 0
        },
        {
          storageKey: 'products/artisanal-chiseled-brass-kada-cuff-2.jpg',
          url: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&auto=format&fit=crop&q=80',
          altText: 'Artisanal Chiseled Brass Kada Cuff Fluting Detail',
          sortOrder: 1
        }
      ]
    },

    // =========================================================================
    // 7. MENSWEAR & FOOTWEAR (Men / Apparel & Footwear)
    // =========================================================================
    {
      categoryId: cat.tshirts,
      department: 'men',
      slug: 'artisanal-oversized-graphic-tee',
      title: 'Artisanal Oversized Heavyweight Graphic T-Shirt',
      description:
        'Heavyweight 240 GSM combed cotton oversized tee with drop-shoulder silhouette and reinforced ribbed collar. Available as a signature drop or customized with your personal bespoke typography or artwork.',
      sku: 'HH-MEN-TS-01',
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
      commodityName: 'Men T-Shirt',
      netQuantity: '1 N',
      variants: [
        {
          sku: 'HH-MEN-TS-01-M',
          title: 'Noir Black / M',
          priceMinor: 129900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Noir Black' },
            { name: 'Size', value: 'M' }
          ],
          initialQuantity: 20
        },
        {
          sku: 'HH-MEN-TS-01-L',
          title: 'Noir Black / L',
          priceMinor: 129900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Noir Black' },
            { name: 'Size', value: 'L' }
          ],
          initialQuantity: 30
        },
        {
          sku: 'HH-MEN-TS-01-XL',
          title: 'Noir Black / XL',
          priceMinor: 129900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Noir Black' },
            { name: 'Size', value: 'XL' }
          ],
          initialQuantity: 15
        }
      ],
      images: [
        {
          storageKey: 'products/artisanal-oversized-graphic-tee-1.jpg',
          url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
          altText: 'Artisanal Oversized Heavyweight Graphic T-Shirt Front View',
          sortOrder: 0
        },
        {
          storageKey: 'products/artisanal-oversized-graphic-tee-2.jpg',
          url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&auto=format&fit=crop&q=80',
          altText: 'Artisanal Oversized Heavyweight Graphic T-Shirt Back Profile',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.shirts,
      department: 'men',
      slug: 'linen-mandarin-collar-kurta-shirt',
      title: 'Pure Belgian Linen Mandarin Collar Kurta-Shirt',
      description:
        'Tailored pure linen tunic shirt with a mandarin band collar, concealed mother-of-pearl placket, and relaxed side vents. Clean modest architectural cut.',
      sku: 'HH-MEN-SH-01',
      specifications: {
        fabric: '100% Belgian Linen',
        collar_type: 'Mandarin Band',
        fit: 'Tailored Relaxed'
      },
      tags: ['men', 'apparel', 'kurta', 'linen', 'bestseller'],
      commodityName: 'Men Linen Kurta-Shirt',
      netQuantity: '1 N',
      variants: [
        {
          sku: 'HH-MEN-SH-01-M',
          title: 'Off-White Ecru / M',
          priceMinor: 249900,
          compareAtPriceMinor: 319900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Off-White Ecru' },
            { name: 'Size', value: 'M' }
          ],
          initialQuantity: 15
        },
        {
          sku: 'HH-MEN-SH-01-L',
          title: 'Off-White Ecru / L',
          priceMinor: 249900,
          compareAtPriceMinor: 319900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Off-White Ecru' },
            { name: 'Size', value: 'L' }
          ],
          initialQuantity: 20
        },
        {
          sku: 'HH-MEN-SH-01-XL',
          title: 'Off-White Ecru / XL',
          priceMinor: 249900,
          compareAtPriceMinor: 319900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Off-White Ecru' },
            { name: 'Size', value: 'XL' }
          ],
          initialQuantity: 12
        }
      ],
      images: [
        {
          storageKey: 'products/linen-mandarin-collar-kurta-shirt-1.jpg',
          url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
          altText: 'Pure Belgian Linen Mandarin Collar Kurta-Shirt Model View',
          sortOrder: 0
        },
        {
          storageKey: 'products/linen-mandarin-collar-kurta-shirt-2.jpg',
          url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
          altText: 'Pure Belgian Linen Mandarin Collar Kurta-Shirt Fabric Texture',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.footwear,
      department: 'men',
      slug: 'handcrafted-leather-slip-ons',
      title: 'Handcrafted Buff Leather Slip-On Mules',
      description:
        'Artisanal vegetable-tanned buff leather slip-ons with cushioned arch support, breathable leather lining, and durable rubberized soles for effortless formal and casual elegance.',
      sku: 'HH-MEN-FW-01',
      specifications: {
        sole_material: 'Vegetable Tanned Leather & Rubber',
        color: 'Cognac Tan'
      },
      tags: ['footwear', 'leather', 'slip-ons', 'handcrafted', 'luxury'],
      commodityName: 'Leather Footwear',
      netQuantity: '1 Pair',
      variants: [
        {
          sku: 'HH-MEN-FW-01-41',
          title: 'Cognac Tan / EU 41',
          priceMinor: 299900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Cognac Tan' },
            { name: 'Size', value: 'EU 41' }
          ],
          initialQuantity: 8
        },
        {
          sku: 'HH-MEN-FW-01-42',
          title: 'Cognac Tan / EU 42',
          priceMinor: 299900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Cognac Tan' },
            { name: 'Size', value: 'EU 42' }
          ],
          initialQuantity: 10
        },
        {
          sku: 'HH-MEN-FW-01-43',
          title: 'Cognac Tan / EU 43',
          priceMinor: 299900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Cognac Tan' },
            { name: 'Size', value: 'EU 43' }
          ],
          initialQuantity: 12
        }
      ],
      images: [
        {
          storageKey: 'products/handcrafted-leather-slip-ons-1.jpg',
          url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&auto=format&fit=crop&q=80',
          altText: 'Handcrafted Buff Leather Slip-On Mules Studio View',
          sortOrder: 0
        },
        {
          storageKey: 'products/handcrafted-leather-slip-ons-2.jpg',
          url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
          altText: 'Handcrafted Buff Leather Slip-On Mules Sole Stitching',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.joggers,
      department: 'men',
      slug: 'french-terry-relaxed-joggers',
      title: 'French Terry Minimalist Relaxed Joggers',
      description:
        '380 GSM loopback French terry trousers with elastic waistband, tonal cotton drawcord, and concealed zipper hip pockets for seamless daily carry.',
      sku: 'HH-MEN-JG-01',
      specifications: {
        fabric: '100% Combed Cotton French Terry',
        gsm: 380,
        fit: 'Tapered Relaxed'
      },
      tags: ['men', 'apparel', 'joggers', 'streetwear'],
      commodityName: 'Men Joggers',
      netQuantity: '1 N',
      variants: [
        {
          sku: 'HH-MEN-JG-01-M',
          title: 'Heather Stone / M',
          priceMinor: 189900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Heather Stone' },
            { name: 'Size', value: 'M' }
          ],
          initialQuantity: 14
        },
        {
          sku: 'HH-MEN-JG-01-L',
          title: 'Heather Stone / L',
          priceMinor: 189900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Heather Stone' },
            { name: 'Size', value: 'L' }
          ],
          initialQuantity: 18
        }
      ],
      images: [
        {
          storageKey: 'products/french-terry-relaxed-joggers-1.jpg',
          url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&auto=format&fit=crop&q=80',
          altText: 'French Terry Minimalist Relaxed Joggers Model View',
          sortOrder: 0
        },
        {
          storageKey: 'products/french-terry-relaxed-joggers-2.jpg',
          url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
          altText: 'French Terry Minimalist Relaxed Joggers Pocket Detail',
          sortOrder: 1
        }
      ]
    },

    // =========================================================================
    // 8. ARTISANAL FRAGRANCES & AMBIENCE (Home & Lifestyle)
    // =========================================================================
    {
      categoryId: cat.attars,
      department: 'lifestyle',
      slug: 'royal-taif-rose-ambergris-attar',
      title: 'Royal Taif Rose & Ambergris Alcohol-Free Attar',
      description:
        'Rare hydro-distilled Taif mountain roses blended with white ambergris and aged Indian sandalwood base. Alcohol-free concentrated perfume oil with 14-hour sillage.',
      sku: 'HH-LFS-AT-01',
      specifications: {
        olfactory_family: 'Floral Oriental',
        volume: '12 ml',
        carrier: 'Sandalwood Base (No Alcohol)'
      },
      tags: ['fragrance', 'attar', 'alcohol-free', 'taif-rose', 'luxury', 'featured'],
      commodityName: 'Concentrated Perfume Oil',
      netQuantity: '1 N (12 ml)',
      variants: [
        {
          sku: 'HH-LFS-AT-01-6M',
          title: '6ml Crystal Flacon',
          priceMinor: 129900,
          compareAtPriceMinor: 169900,
          currency: 'INR',
          options: [{ name: 'Volume', value: '6 ml' }],
          initialQuantity: 25
        },
        {
          sku: 'HH-LFS-AT-01-12',
          title: '12ml Royal Crystal Flacon',
          priceMinor: 219900,
          compareAtPriceMinor: 279900,
          currency: 'INR',
          options: [{ name: 'Volume', value: '12 ml' }],
          initialQuantity: 20
        }
      ],
      images: [
        {
          storageKey: 'products/royal-taif-rose-ambergris-attar-1.jpg',
          url: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=800&auto=format&fit=crop&q=80',
          altText: 'Royal Taif Rose & Ambergris Alcohol-Free Attar Flacon',
          sortOrder: 0
        },
        {
          storageKey: 'products/royal-taif-rose-ambergris-attar-2.jpg',
          url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&auto=format&fit=crop&q=80',
          altText: 'Royal Taif Rose & Ambergris Attar Presentation Box',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.attars,
      department: 'lifestyle',
      slug: 'smoky-cambodian-oud-attar',
      title: 'Smoky Cambodian Oud & Aged Cedar Attar',
      description:
        'Intense resinous dark Cambodian agarwood enriched with Atlas cedar and smoky birch tar. Rich, deep, and meditative.',
      sku: 'HH-LFS-AT-02',
      specifications: {
        olfactory_family: 'Woody Oriental / Oud',
        volume: '12 ml'
      },
      tags: ['fragrance', 'oud', 'attar', 'agarwood', 'premium'],
      commodityName: 'Concentrated Perfume Oil',
      netQuantity: '1 N (12 ml)',
      variants: [
        {
          sku: 'HH-LFS-AT-02-6M',
          title: '6ml Roll-on',
          priceMinor: 199900,
          currency: 'INR',
          options: [{ name: 'Volume', value: '6 ml' }],
          initialQuantity: 15
        },
        {
          sku: 'HH-LFS-AT-02-12',
          title: '12ml Crystal Vial',
          priceMinor: 349900,
          currency: 'INR',
          options: [{ name: 'Volume', value: '12 ml' }],
          initialQuantity: 18
        }
      ],
      images: [
        {
          storageKey: 'products/smoky-cambodian-oud-attar-1.jpg',
          url: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&auto=format&fit=crop&q=80',
          altText: 'Smoky Cambodian Oud & Aged Cedar Attar Crystal Bottle',
          sortOrder: 0
        },
        {
          storageKey: 'products/smoky-cambodian-oud-attar-2.jpg',
          url: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=800&auto=format&fit=crop&q=80',
          altText: 'Smoky Cambodian Oud & Aged Cedar Attar Amber Fluid',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.candles,
      department: 'lifestyle',
      slug: 'midnight-amber-smoked-oud-candle',
      title: 'Midnight Amber & Smoked Oud Scented Soy Candle',
      description:
        'Hand-poured 100% natural soy wax candle infused with amber resin, dark vanilla, and smoked agarwood. Clean-burning wooden wick creates a soothing fireplace crackle.',
      sku: 'HH-LFS-CD-01',
      variantTitle: 'Amber Glass Tumbler (280g)',
      priceMinor: 149900,
      initialQuantity: 24,
      specifications: {
        wax_type: '100% Soy Wax',
        burn_time: '55 Hours',
        weight: '280 grams'
      },
      tags: ['candles', 'soy-wax', 'home-fragrance', 'ambience'],
      commodityName: 'Scented Candle',
      netQuantity: '1 N (280 g)',
      options: [{ name: 'Container', value: '280g Amber Glass Tumbler' }],
      images: [
        {
          storageKey: 'products/midnight-amber-smoked-oud-candle-1.jpg',
          url: 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=80',
          altText: 'Midnight Amber & Smoked Oud Scented Soy Candle Glow',
          sortOrder: 0
        },
        {
          storageKey: 'products/midnight-amber-smoked-oud-candle-2.jpg',
          url: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=800&auto=format&fit=crop&q=80',
          altText: 'Midnight Amber & Smoked Oud Scented Soy Candle Wooden Wick',
          sortOrder: 1
        }
      ]
    },

    // =========================================================================
    // 9. TECH PROTECTION & ON-DEMAND MERCH (Tech & Custom Studio)
    // =========================================================================
    {
      categoryId: cat.temperedGlass,
      department: 'tech',
      slug: '9h-sapphire-edge-tempered-glass',
      title: '9H Sapphire Oleophobic Edge-to-Edge Tempered Glass',
      description:
        'Diamond-hardened 9H sapphire tempered glass with electroplated oleophobic coating, 99.9% optical transparency, and dust-free auto-alignment installation frame.',
      sku: 'HH-TCH-TG-01',
      specifications: {
        glass_type: '9H Sapphire Tempered',
        device_brand: 'Apple'
      },
      tags: ['tempered-glass', 'screen-protector', 'apple', 'tech-protection'],
      commodityName: 'Mobile Screen Protector',
      netQuantity: '1 N',
      variants: [
        {
          sku: 'HH-TCH-TG-01',
          title: 'iPhone 15 / 15 Pro',
          priceMinor: 49900,
          currency: 'INR',
          options: [{ name: 'Device', value: 'iPhone 15 / 15 Pro' }],
          initialQuantity: 50
        },
        {
          sku: 'HH-TCH-TG-02',
          title: 'iPhone 15 Pro Max',
          priceMinor: 49900,
          currency: 'INR',
          options: [{ name: 'Device', value: 'iPhone 15 Pro Max' }],
          initialQuantity: 40
        }
      ],
      images: [
        {
          storageKey: 'products/9h-sapphire-edge-tempered-glass-1.jpg',
          url: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&auto=format&fit=crop&q=80',
          altText: '9H Sapphire Oleophobic Edge-to-Edge Tempered Glass Box',
          sortOrder: 0
        },
        {
          storageKey: 'products/9h-sapphire-edge-tempered-glass-2.jpg',
          url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&auto=format&fit=crop&q=80',
          altText: '9H Sapphire Oleophobic Tempered Glass Installation Alignment',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.phoneCases,
      department: 'tech',
      slug: 'custom-printed-matte-shockproof-case',
      title: 'Custom Printed Matte Shockproof Armor Phone Case',
      description:
        'Dual-layer military-grade drop-tested case with anti-scratch matte backplate and shock-absorbing TPU bumper. Personalize with your custom photograph, calligraphy, or monogram.',
      sku: 'HH-TCH-BC-01',
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
      commodityName: 'Mobile Phone Case',
      netQuantity: '1 N',
      variants: [
        {
          sku: 'HH-TCH-BC-01',
          title: 'iPhone 15 Pro / Custom Print',
          priceMinor: 79900,
          currency: 'INR',
          options: [
            { name: 'Device', value: 'iPhone 15 Pro' },
            { name: 'Finish', value: 'Matte Shockproof' }
          ],
          initialQuantity: 40
        }
      ],
      images: [
        {
          storageKey: 'products/custom-printed-matte-shockproof-case-1.jpg',
          url: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=800&auto=format&fit=crop&q=80',
          altText: 'Custom Printed Matte Shockproof Armor Phone Case Design',
          sortOrder: 0
        },
        {
          storageKey: 'products/custom-printed-matte-shockproof-case-2.jpg',
          url: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&auto=format&fit=crop&q=80',
          altText: 'Custom Printed Matte Shockproof Armor Phone Case Bumper Corner',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.toteBags,
      department: 'custom-merch',
      slug: 'heavyweight-organic-custom-tote-bag',
      title: 'Heavyweight Organic Canvas Bespoke Tote Bag',
      description:
        'Crafted from 380 GSM GOTS-certified organic unbleached cotton canvas. Reinforced box-stitched handles and interior pocket. Perfect canvas for custom art, brand logos, or personal statements.',
      sku: 'HH-MRC-BG-01',
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
      commodityName: 'Canvas Tote Bag',
      netQuantity: '1 N',
      variants: [
        {
          sku: 'HH-MRC-BG-01',
          title: 'Natural Ecru / 380 GSM',
          priceMinor: 69900,
          currency: 'INR',
          options: [{ name: 'Color', value: 'Natural Ecru' }],
          initialQuantity: 25
        }
      ],
      images: [
        {
          storageKey: 'products/heavyweight-organic-custom-tote-bag-1.jpg',
          url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
          altText: 'Heavyweight Organic Canvas Bespoke Tote Bag Lifestyle View',
          sortOrder: 0
        },
        {
          storageKey: 'products/heavyweight-organic-custom-tote-bag-2.jpg',
          url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
          altText: 'Heavyweight Organic Canvas Bespoke Tote Bag Stitching Detail',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.hoodies,
      department: 'custom-merch',
      slug: 'bespoke-arabic-calligraphy-hoodie',
      title: 'Bespoke Arabic Calligraphy Heavyweight Fleece Hoodie',
      description:
        '420 GSM ultra-heavyweight combed cotton fleece hoodie featuring double-layer hood and kangaroo pocket. Customizable with personalized Arabic calligraphy embroidered or puff-printed on the chest.',
      sku: 'HH-MRC-HD-01',
      isCustomizable: true,
      customizationConfig: {
        allowCustomText: true,
        allowImageUpload: true,
        maxCharacters: 25,
        surchargeMinor: 25000,
        customizationNotesPlaceholder: 'Provide Arabic name/phrase or English for transliteration',
        productionDays: 3
      },
      specifications: {
        fabric: '100% Combed Cotton Fleece',
        gsm: 420,
        fit: 'Oversized Boxy Silhouette'
      },
      tags: ['hoodie', 'custom-studio', 'heavyweight', 'streetwear', 'calligraphy', 'new-arrival'],
      commodityName: 'Fleece Hoodie',
      netQuantity: '1 N',
      variants: [
        {
          sku: 'HH-MRC-HD-01-M',
          title: 'Vintage Bone / M',
          priceMinor: 279900,
          compareAtPriceMinor: 349900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Vintage Bone' },
            { name: 'Size', value: 'M' }
          ],
          initialQuantity: 12
        },
        {
          sku: 'HH-MRC-HD-01-L',
          title: 'Vintage Bone / L',
          priceMinor: 279900,
          compareAtPriceMinor: 349900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Vintage Bone' },
            { name: 'Size', value: 'L' }
          ],
          initialQuantity: 18
        },
        {
          sku: 'HH-MRC-HD-01-XL',
          title: 'Vintage Bone / XL',
          priceMinor: 279900,
          compareAtPriceMinor: 349900,
          currency: 'INR',
          options: [
            { name: 'Color', value: 'Vintage Bone' },
            { name: 'Size', value: 'XL' }
          ],
          initialQuantity: 10
        }
      ],
      images: [
        {
          storageKey: 'products/bespoke-arabic-calligraphy-hoodie-1.jpg',
          url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
          altText: 'Bespoke Arabic Calligraphy Heavyweight Fleece Hoodie Model View',
          sortOrder: 0
        },
        {
          storageKey: 'products/bespoke-arabic-calligraphy-hoodie-2.jpg',
          url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
          altText: 'Bespoke Arabic Calligraphy Heavyweight Fleece Hoodie Fabric Texture',
          sortOrder: 1
        }
      ]
    },
    {
      categoryId: cat.eyeVeils,
      department: 'women',
      slug: 'breathable-chiffon-eye-veil',
      title: 'Pure Breathable Double-Layer Chiffon Eye Veil',
      description:
        'Ultra-lightweight, skin-friendly Korean chiffon eye veil with discreet ribbon ties and reinforced eye opening. Maximum breathability and graceful modesty.',
      sku: 'HH-WMN-EV-01',
      variantTitle: 'Pitch Black',
      priceMinor: 34900,
      initialQuantity: 20,
      specifications: {
        fabric: 'Korean Chiffon',
        veil_coverage: 'Double Layer',
        color: 'Pitch Black'
      },
      tags: ['eye-veil', 'niqab', 'modest-essentials', 'chiffon'],
      commodityName: 'Chiffon Eye Veil',
      netQuantity: '1 N',
      options: [{ name: 'Color', value: 'Pitch Black' }],
      images: [
        {
          storageKey: 'products/breathable-chiffon-eye-veil-1.jpg',
          url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80',
          altText: 'Pure Breathable Double-Layer Chiffon Eye Veil',
          sortOrder: 0
        },
        {
          storageKey: 'products/breathable-chiffon-eye-veil-2.jpg',
          url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
          altText: 'Pure Breathable Double-Layer Chiffon Eye Veil Texture',
          sortOrder: 1
        }
      ]
    }
  ];

  const createdVariantMap: Record<string, string> = {};

  for (const item of catalog) {
    const existing = await db
      .select()
      .from(products)
      .where(and(eq(products.storeId, store.id), eq(products.slug, item.slug)))
      .limit(1);

    const variantsList = item.variants ?? [
      {
        sku: item.sku,
        title: item.variantTitle ?? 'Standard',
        priceMinor: item.priceMinor ?? 59900,
        compareAtPriceMinor: item.compareAtPriceMinor,
        currency: 'INR' as const,
        options: item.options ?? [],
        weightGrams: 50,
        sortOrder: 0,
        isActive: true,
        initialQuantity: item.initialQuantity ?? 10
      }
    ];

    const imagesList = item.images ?? [
      {
        storageKey: `products/${item.slug}-1.jpg`,
        url:
          item.imageUrl ??
          'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
        altText: item.title,
        sortOrder: 0
      }
    ];

    if (existing[0]) {
      await db
        .update(products)
        .set({
          categoryId: item.categoryId,
          department: item.department,
          title: item.title,
          description: item.description,
          status: 'published',
          isCustomizable: item.isCustomizable ?? false,
          customizationConfig: item.customizationConfig ?? null,
          specifications: item.specifications ?? {},
          tags: item.tags ?? [],
          countryOfOrigin: item.countryOfOrigin ?? 'India',
          netQuantity: item.netQuantity ?? '1 N',
          commodityName: item.commodityName ?? item.title
        })
        .where(eq(products.id, existing[0].id));

      for (const v of variantsList) {
        const [existingVariant] = await db
          .select()
          .from(productVariants)
          .where(eq(productVariants.sku, v.sku))
          .limit(1);

        if (existingVariant) {
          createdVariantMap[v.sku] = existingVariant.id;
          await db
            .update(productVariants)
            .set({
              title: v.title,
              priceMinor: v.priceMinor,
              compareAtPriceMinor: v.compareAtPriceMinor ?? null,
              options: v.options ?? []
            })
            .where(eq(productVariants.id, existingVariant.id));
        } else {
          const [newVariant] = await db
            .insert(productVariants)
            .values({
              productId: existing[0].id,
              sku: v.sku,
              title: v.title,
              priceMinor: v.priceMinor,
              compareAtPriceMinor: v.compareAtPriceMinor ?? null,
              currency: v.currency ?? 'INR',
              options: v.options ?? [],
              weightGrams: v.weightGrams ?? 50,
              sortOrder: v.sortOrder ?? 0,
              isActive: v.isActive ?? true
            })
            .returning();
          if (newVariant) {
            createdVariantMap[v.sku] = newVariant.id;
            await db.insert(inventoryLevels).values({
              variantId: newVariant.id,
              onHand: v.initialQuantity,
              reserved: 0
            });
          }
        }
      }

      const existingImages = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, existing[0].id));

      if (existingImages.length === 0) {
        for (const img of imagesList) {
          await db.insert(productImages).values({
            productId: existing[0].id,
            storageKey: img.storageKey,
            url: img.url,
            altText: img.altText,
            sortOrder: img.sortOrder
          });
        }
      }

      console.log(`  ↳ Product updated: ${item.title} (${item.slug})`);
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
      countryOfOrigin: item.countryOfOrigin ?? 'India',
      netQuantity: item.netQuantity ?? '1 N',
      commodityName: item.commodityName ?? item.title,
      manufacturerName: item.manufacturerName ?? 'H&H Atelier Private Limited',
      manufacturerAddress:
        item.manufacturerAddress ??
        'Plot 42, H&H Craft Studio, Okhla Industrial Area Phase III, New Delhi 110020',
      packerName: item.packerName ?? 'H&H Fulfilment Centre',
      packerAddress:
        item.packerAddress ?? 'Warehouse Unit 7, Bangalore Logistics Park, Karnataka 560067',
      seoTitle: item.seoTitle ?? `${item.title} | H&H Atelier`,
      seoDescription: item.seoDescription ?? item.description.slice(0, 160),
      variants: variantsList,
      images: imagesList
    });

    for (const v of variants) {
      createdVariantMap[v.sku] = v.id;
    }

    console.log(
      `  ✓ Seeded Product: ${product.title} (${variants[0]?.sku}, Price: ₹${(variants[0]?.priceMinor ?? 0) / 100})`
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
        taxMinor: 9137,
        cgstMinor: 0,
        sgstMinor: 0,
        igstMinor: 9137,
        taxableAmountMinor: 50763,
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
        taxMinor: 13698,
        cgstMinor: 6849,
        sgstMinor: 6849,
        igstMinor: 0,
        taxableAmountMinor: 76102,
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
  const adminPasswordHash = await hashPassword('hh_admin_master_password_2026');
  await db
    .insert(adminUsers)
    .values({
      storeId: store.id,
      email: 'admin@handh.in',
      name: 'H&H Super Admin',
      passwordHash: adminPasswordHash,
      role: 'super_admin',
      isActive: true,
      failedLoginAttempts: 0
    })
    .onConflictDoNothing();

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
