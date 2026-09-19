export interface TaxonomyCategoryNode {
  slug: string;
  name: string;
  path: string;
  depth: number;
  description?: string;
  applicableFilterKeys: string[];
  subcategories?: TaxonomyCategoryNode[];
}

export interface TaxonomyDepartment {
  slug: string;
  name: string;
  path: string;
  description: string;
  categories: TaxonomyCategoryNode[];
}

/**
 * Exhaustive enterprise taxonomy tree for H&H brand.
 * Supports Men, Women, Tech Protection, Custom Print Studio, and Home & Lifestyle.
 */
export const DEFAULT_TAXONOMY: TaxonomyDepartment[] = [
  // 1. Department: Men
  {
    slug: 'men',
    name: 'Men',
    path: '/men',
    description: 'Refined menswear, relaxed streetwear essentials, and handcrafted footwear.',
    categories: [
      {
        slug: 'apparel',
        name: 'Apparel',
        path: '/men/apparel',
        depth: 1,
        applicableFilterKeys: ['size', 'color', 'fit', 'fabric', 'gsm'],
        subcategories: [
          {
            slug: 't-shirts',
            name: 'T-Shirts & Polos',
            path: '/men/apparel/t-shirts',
            depth: 2,
            applicableFilterKeys: ['size', 'color', 'fit', 'fabric', 'gsm', 'pattern', 'neckline']
          },
          {
            slug: 'shirts',
            name: 'Shirts (Casual & Formal)',
            path: '/men/apparel/shirts',
            depth: 2,
            applicableFilterKeys: ['size', 'color', 'fit', 'fabric', 'pattern', 'collar_type']
          },
          {
            slug: 'joggers',
            name: 'Joggers & Sweatpants',
            path: '/men/apparel/joggers',
            depth: 2,
            applicableFilterKeys: ['size', 'color', 'fit', 'fabric', 'gsm']
          },
          {
            slug: 'hoodies',
            name: 'Hoodies & Sweatshirts',
            path: '/men/apparel/hoodies',
            depth: 2,
            applicableFilterKeys: ['size', 'color', 'fit', 'gsm']
          },
          {
            slug: 'loungewear',
            name: 'Shorts & Loungewear',
            path: '/men/apparel/loungewear',
            depth: 2,
            applicableFilterKeys: ['size', 'color', 'fabric']
          }
        ]
      },
      {
        slug: 'footwear',
        name: 'Footwear',
        path: '/men/footwear',
        depth: 1,
        applicableFilterKeys: ['footwear_size', 'color', 'sole_material'],
        subcategories: [
          {
            slug: 'slip-ons',
            name: 'Artisanal Slip-ons & Mules',
            path: '/men/footwear/slip-ons',
            depth: 2,
            applicableFilterKeys: ['footwear_size', 'color', 'sole_material', 'occasion']
          },
          {
            slug: 'slides',
            name: 'Slides & Sandals',
            path: '/men/footwear/slides',
            depth: 2,
            applicableFilterKeys: ['footwear_size', 'color', 'sole_material']
          }
        ]
      },
      {
        slug: 'accessories',
        name: 'Accessories',
        path: '/men/accessories',
        depth: 1,
        applicableFilterKeys: ['color', 'material'],
        subcategories: [
          {
            slug: 'caps',
            name: 'Caps & Headwear',
            path: '/men/accessories/caps',
            depth: 2,
            applicableFilterKeys: ['color', 'material']
          },
          {
            slug: 'wallets',
            name: 'Wallets & Cardholders',
            path: '/men/accessories/wallets',
            depth: 2,
            applicableFilterKeys: ['color', 'material']
          },
          {
            slug: 'belts',
            name: 'Belts & Daily Essentials',
            path: '/men/accessories/belts',
            depth: 2,
            applicableFilterKeys: ['size', 'color', 'material']
          }
        ]
      }
    ]
  },

  // 2. Department: Women
  {
    slug: 'women',
    name: 'Women',
    path: '/women',
    description: 'Curated modest wear, heritage abayas, artisanal jewelry, and daily essentials.',
    categories: [
      {
        slug: 'modest-wear',
        name: 'Modest Wear & Heritage',
        path: '/women/modest-wear',
        depth: 1,
        applicableFilterKeys: ['size', 'color', 'fabric'],
        subcategories: [
          {
            slug: 'abayas',
            name: 'Abayas (Open, Closed, Kimono)',
            path: '/women/modest-wear/abayas',
            depth: 2,
            applicableFilterKeys: ['size', 'abaya_length', 'color', 'fabric']
          },
          {
            slug: 'kurtis',
            name: 'Kurtis & Tunics',
            path: '/women/modest-wear/kurtis',
            depth: 2,
            applicableFilterKeys: ['size', 'color', 'fabric', 'fit']
          },
          {
            slug: 'co-ords',
            name: 'Co-ord Sets & Jumpsuits',
            path: '/women/modest-wear/co-ords',
            depth: 2,
            applicableFilterKeys: ['size', 'color', 'fabric', 'fit']
          }
        ]
      },
      {
        slug: 'essentials',
        name: 'Hijab & Modest Essentials',
        path: '/women/essentials',
        depth: 1,
        applicableFilterKeys: ['color', 'fabric'],
        subcategories: [
          {
            slug: 'hijabs',
            name: 'Hijabs & Scarves',
            path: '/women/essentials/hijabs',
            depth: 2,
            applicableFilterKeys: ['fabric', 'color']
          },
          {
            slug: 'nose-pieces',
            name: 'Abaya Nose Pieces & Niqabs',
            path: '/women/essentials/nose-pieces',
            depth: 2,
            applicableFilterKeys: ['color', 'fabric', 'veil_coverage']
          },
          {
            slug: 'eye-veils',
            name: 'Eye Veils',
            path: '/women/essentials/eye-veils',
            depth: 2,
            applicableFilterKeys: ['color', 'fabric']
          },
          {
            slug: 'inner-caps',
            name: 'Inner Caps & Underscarves',
            path: '/women/essentials/inner-caps',
            depth: 2,
            applicableFilterKeys: ['fabric', 'color']
          },
          {
            slug: 'pins-clips',
            name: 'Magnetic Pins & Hijab Clips',
            path: '/women/essentials/pins-clips',
            depth: 2,
            applicableFilterKeys: ['metal_finish', 'stone_type']
          }
        ]
      },
      {
        slug: 'tops',
        name: 'Tops & Casuals',
        path: '/women/tops',
        depth: 1,
        applicableFilterKeys: ['size', 'color', 'fit', 'fabric'],
        subcategories: [
          {
            slug: 'graphic-tees',
            name: 'Graphic Tees & Tops',
            path: '/women/tops/graphic-tees',
            depth: 2,
            applicableFilterKeys: ['size', 'color', 'fit', 'fabric', 'gsm']
          },
          {
            slug: 'hoodies',
            name: 'Hoodies & Sweatshirts',
            path: '/women/tops/hoodies',
            depth: 2,
            applicableFilterKeys: ['size', 'color', 'fit', 'gsm']
          }
        ]
      },
      {
        slug: 'footwear',
        name: 'Footwear & Slip-ons',
        path: '/women/footwear',
        depth: 1,
        applicableFilterKeys: ['footwear_size', 'color', 'sole_material'],
        subcategories: [
          {
            slug: 'slip-ons',
            name: 'Artisanal Slip-ons & Mules',
            path: '/women/footwear/slip-ons',
            depth: 2,
            applicableFilterKeys: ['footwear_size', 'color', 'sole_material']
          }
        ]
      },
      {
        slug: 'jewelry',
        name: 'Fine Jewelry & Accents',
        path: '/women/jewelry',
        depth: 1,
        applicableFilterKeys: ['metal_purity', 'stone_type'],
        subcategories: [
          {
            slug: 'nose-studs',
            name: 'Nose Studs & Pins',
            path: '/women/jewelry/nose-studs',
            depth: 2,
            applicableFilterKeys: ['metal_purity', 'stone_type']
          },
          {
            slug: 'rings',
            name: 'Rings & Bands',
            path: '/women/jewelry/rings',
            depth: 2,
            applicableFilterKeys: ['ring_size', 'metal_purity', 'stone_type']
          },
          {
            slug: 'bracelets',
            name: 'Bracelets & Cuffs',
            path: '/women/jewelry/bracelets',
            depth: 2,
            applicableFilterKeys: ['metal_purity', 'stone_type']
          },
          {
            slug: 'necklaces',
            name: 'Necklaces & Pendants',
            path: '/women/jewelry/necklaces',
            depth: 2,
            applicableFilterKeys: ['metal_purity', 'stone_type']
          }
        ]
      }
    ]
  },

  // 3. Department: Tech & Gadgets
  {
    slug: 'tech',
    name: 'Tech & Gadgets',
    path: '/tech',
    description: 'Precision device protection, tempered glass shields, and designer cases.',
    categories: [
      {
        slug: 'protection',
        name: 'Screen & Lens Protection',
        path: '/tech/protection',
        depth: 1,
        applicableFilterKeys: ['device_brand', 'device_model', 'glass_type'],
        subcategories: [
          {
            slug: 'tempered-glass',
            name: '9H Tempered Glass Protectors',
            path: '/tech/protection/tempered-glass',
            depth: 2,
            applicableFilterKeys: ['device_brand', 'device_model', 'glass_type']
          },
          {
            slug: 'privacy-screens',
            name: 'Anti-Spy Privacy Screen Protectors',
            path: '/tech/protection/privacy-screens',
            depth: 2,
            applicableFilterKeys: ['device_brand', 'device_model', 'glass_type']
          },
          {
            slug: 'lens-protectors',
            name: 'Camera Lens Protectors',
            path: '/tech/protection/lens-protectors',
            depth: 2,
            applicableFilterKeys: ['device_brand', 'device_model']
          }
        ]
      },
      {
        slug: 'cases',
        name: 'Cases & Covers',
        path: '/tech/cases',
        depth: 1,
        applicableFilterKeys: ['device_brand', 'device_model', 'case_material', 'case_finish'],
        subcategories: [
          {
            slug: 'custom-printed',
            name: 'Custom Printed Back Covers',
            path: '/tech/cases/custom-printed',
            depth: 2,
            applicableFilterKeys: ['device_brand', 'device_model', 'case_material', 'case_finish']
          },
          {
            slug: 'glass-back',
            name: 'Designer Glass Back Cases',
            path: '/tech/cases/glass-back',
            depth: 2,
            applicableFilterKeys: ['device_brand', 'device_model']
          },
          {
            slug: 'shockproof',
            name: 'Shockproof Armor Covers',
            path: '/tech/cases/shockproof',
            depth: 2,
            applicableFilterKeys: ['device_brand', 'device_model', 'case_material']
          },
          {
            slug: 'silicone',
            name: 'Slim Silicone & TPU Cases',
            path: '/tech/cases/silicone',
            depth: 2,
            applicableFilterKeys: ['device_brand', 'device_model', 'color']
          }
        ]
      },
      {
        slug: 'accessories',
        name: 'Tech Accessories',
        path: '/tech/accessories',
        depth: 1,
        applicableFilterKeys: ['color', 'material'],
        subcategories: [
          {
            slug: 'magsafe-wallets',
            name: 'MagSafe Wallets & Grips',
            path: '/tech/accessories/magsafe-wallets',
            depth: 2,
            applicableFilterKeys: ['color', 'material']
          }
        ]
      }
    ]
  },

  // 4. Department: Custom Print Studio
  {
    slug: 'custom-studio',
    name: 'Custom Print Studio',
    path: '/custom-studio',
    description:
      'On-demand personalized graphics, bespoke typography, and specialized print orders.',
    categories: [
      {
        slug: 'apparel',
        name: 'Custom Apparel',
        path: '/custom-studio/apparel',
        depth: 1,
        applicableFilterKeys: ['size', 'color', 'fit', 'print_technique'],
        subcategories: [
          {
            slug: 't-shirts',
            name: 'Custom Printed T-Shirts',
            path: '/custom-studio/apparel/t-shirts',
            depth: 2,
            applicableFilterKeys: ['size', 'color', 'fit', 'print_technique', 'print_placements']
          },
          {
            slug: 'hoodies',
            name: 'Custom Printed Hoodies',
            path: '/custom-studio/apparel/hoodies',
            depth: 2,
            applicableFilterKeys: ['size', 'color', 'print_technique', 'print_placements']
          }
        ]
      },
      {
        slug: 'merch',
        name: 'Custom Headwear & Bags',
        path: '/custom-studio/merch',
        depth: 1,
        applicableFilterKeys: ['color', 'material', 'print_technique'],
        subcategories: [
          {
            slug: 'caps',
            name: 'Custom Printed Caps & Hats',
            path: '/custom-studio/merch/caps',
            depth: 2,
            applicableFilterKeys: ['color', 'material', 'print_technique']
          },
          {
            slug: 'tote-bags',
            name: 'Custom Canvas Tote Bags',
            path: '/custom-studio/merch/tote-bags',
            depth: 2,
            applicableFilterKeys: ['color', 'print_technique']
          }
        ]
      },
      {
        slug: 'gifting',
        name: 'Personalized Drinkware & Gifts',
        path: '/custom-studio/gifting',
        depth: 1,
        applicableFilterKeys: ['print_technique'],
        subcategories: [
          {
            slug: 'mugs',
            name: 'Custom Ceramic Mugs & Tumblers',
            path: '/custom-studio/gifting/mugs',
            depth: 2,
            applicableFilterKeys: ['print_technique']
          }
        ]
      }
    ]
  },

  // 5. Department: Home & Lifestyle
  {
    slug: 'lifestyle',
    name: 'Home & Lifestyle',
    path: '/lifestyle',
    description: 'Atmospheric home fragrances, artisanal candles, and travel carry.',
    categories: [
      {
        slug: 'fragrance',
        name: 'Fragrance & Ambience',
        path: '/lifestyle/fragrance',
        depth: 1,
        applicableFilterKeys: ['olfactory_family'],
        subcategories: [
          {
            slug: 'attars',
            name: 'Artisanal Attars & Perfume Oils',
            path: '/lifestyle/fragrance/attars',
            depth: 2,
            applicableFilterKeys: ['olfactory_family']
          },
          {
            slug: 'candles',
            name: 'Scented Soy Wax Candles',
            path: '/lifestyle/fragrance/candles',
            depth: 2,
            applicableFilterKeys: ['scent_notes']
          }
        ]
      },
      {
        slug: 'travel',
        name: 'Travel & Daily Carry',
        path: '/lifestyle/travel',
        depth: 1,
        applicableFilterKeys: ['color', 'material'],
        subcategories: [
          {
            slug: 'bags',
            name: 'Duffle Bags & Travel Kits',
            path: '/lifestyle/travel/bags',
            depth: 2,
            applicableFilterKeys: ['color', 'material']
          }
        ]
      }
    ]
  }
];

/**
 * Utility helper to flatten the nested taxonomy into a flat list of insertable database records.
 */
export interface FlatTaxonomyRecord {
  departmentSlug: string;
  categorySlug: string;
  subcategorySlug?: string;
  name: string;
  slug: string;
  path: string;
  depth: number;
  parentPath?: string;
  applicableFilterKeys: string[];
}

export function flattenTaxonomyTree(departments = DEFAULT_TAXONOMY): FlatTaxonomyRecord[] {
  const records: FlatTaxonomyRecord[] = [];

  for (const dept of departments) {
    // 1. Department record (depth 0)
    records.push({
      departmentSlug: dept.slug,
      categorySlug: dept.slug,
      name: dept.name,
      slug: dept.slug,
      path: dept.path,
      depth: 0,
      applicableFilterKeys: []
    });

    for (const cat of dept.categories) {
      // 2. Category record (depth 1)
      records.push({
        departmentSlug: dept.slug,
        categorySlug: cat.slug,
        name: cat.name,
        slug: `${dept.slug}-${cat.slug}`,
        path: cat.path,
        depth: 1,
        parentPath: dept.path,
        applicableFilterKeys: cat.applicableFilterKeys
      });

      if (cat.subcategories) {
        for (const sub of cat.subcategories) {
          // 3. Sub-category record (depth 2)
          records.push({
            departmentSlug: dept.slug,
            categorySlug: cat.slug,
            subcategorySlug: sub.slug,
            name: sub.name,
            slug: `${dept.slug}-${cat.slug}-${sub.slug}`,
            path: sub.path,
            depth: 2,
            parentPath: cat.path,
            applicableFilterKeys: sub.applicableFilterKeys
          });
        }
      }
    }
  }

  return records;
}
