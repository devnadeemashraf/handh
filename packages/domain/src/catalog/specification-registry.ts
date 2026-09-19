export type FacetType = 'select' | 'multiselect' | 'range' | 'color_swatch' | 'boolean' | 'text';

export interface FacetOption {
  label: string;
  value: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface FacetDefinition {
  key: string;
  label: string;
  type: FacetType;
  options?: FacetOption[];
  unit?: string;
  placeholder?: string;
  helpText?: string;
}

/**
 * Enterprise Multi-Vertical Specification & Facet Registry.
 * Allows instant, dynamic filtering across Apparel, Footwear, Mobile Tech, and Custom Print.
 */
export const SPECIFICATION_REGISTRY: Record<string, FacetDefinition> = {
  // --- 1. Apparel Specifications ---
  size: {
    key: 'size',
    label: 'Size',
    type: 'select',
    options: [
      { label: 'XS', value: 'XS' },
      { label: 'S', value: 'S' },
      { label: 'M', value: 'M' },
      { label: 'L', value: 'L' },
      { label: 'XL', value: 'XL' },
      { label: '2XL', value: '2XL' },
      { label: '3XL', value: '3XL' },
      { label: 'Free Size', value: 'Free Size' }
    ]
  },
  color: {
    key: 'color',
    label: 'Color',
    type: 'color_swatch',
    options: [
      { label: 'Royale Emerald', value: 'emerald', metadata: { hex: '#0A2E24' } },
      { label: 'Royale Gold', value: 'gold', metadata: { hex: '#C5A880' } },
      { label: 'Warm Beige', value: 'beige', metadata: { hex: '#FDFBF7' } },
      { label: 'Jet Black', value: 'black', metadata: { hex: '#111827' } },
      { label: 'Pearl White', value: 'white', metadata: { hex: '#FFFFFF' } },
      { label: 'Midnight Navy', value: 'navy', metadata: { hex: '#0F172A' } },
      { label: 'Burgundy Maroon', value: 'maroon', metadata: { hex: '#831843' } },
      { label: 'Dusty Rose', value: 'rose', metadata: { hex: '#FDA4AF' } },
      { label: 'Olive Sage', value: 'olive', metadata: { hex: '#4D7C0F' } }
    ]
  },
  fit: {
    key: 'fit',
    label: 'Fit Profile',
    type: 'select',
    options: [
      { label: 'Oversized / Boxy Fit', value: 'oversized' },
      { label: 'Relaxed Comfort Fit', value: 'relaxed' },
      { label: 'Regular Classic Fit', value: 'regular' },
      { label: 'Slim Tailored Fit', value: 'slim' }
    ]
  },
  fabric: {
    key: 'fabric',
    label: 'Fabric & Material',
    type: 'select',
    options: [
      { label: '100% Super-Combed Cotton', value: 'cotton_100' },
      { label: 'Heavyweight French Terry (280 GSM)', value: 'french_terry' },
      { label: 'Luxury Modal Silk', value: 'modal_silk' },
      { label: 'Premium Korean Nida Silk', value: 'nida_silk' },
      { label: 'Pure Breathable Linen', value: 'linen' },
      { label: 'Textured Chiffon Georgette', value: 'chiffon' }
    ]
  },
  gsm: {
    key: 'gsm',
    label: 'Fabric Density',
    type: 'select',
    options: [
      { label: '180 GSM (Lightweight Summer)', value: '180' },
      { label: '220 GSM (Standard Premium)', value: '220' },
      { label: '240 GSM (Dense Luxury)', value: '240' },
      { label: '280 GSM (Heavyweight Streetwear)', value: '280' },
      { label: '340+ GSM (Winter Fleece)', value: '340' }
    ],
    unit: 'GSM'
  },
  pattern: {
    key: 'pattern',
    label: 'Pattern & Artwork',
    type: 'select',
    options: [
      { label: 'Solid Minimalist', value: 'solid' },
      { label: 'Graphic Printed', value: 'graphic' },
      { label: 'Typographic Statement', value: 'typographic' },
      { label: 'Handcrafted Embroidery', value: 'embroidered' }
    ]
  },
  neckline: {
    key: 'neckline',
    label: 'Neck Style',
    type: 'select',
    options: [
      { label: 'Classic Crew Neck', value: 'crew_neck' },
      { label: 'Ribbed Polo Collar', value: 'polo' },
      { label: 'V-Neckline', value: 'v_neck' },
      { label: 'Mandarin / Band Collar', value: 'mandarin' },
      { label: 'Hooded', value: 'hooded' }
    ]
  },
  abaya_length: {
    key: 'abaya_length',
    label: 'Abaya Length',
    type: 'select',
    options: [
      { label: '52" (Petite)', value: '52' },
      { label: '54" (Standard)', value: '54' },
      { label: '56" (Regular)', value: '56' },
      { label: '58" (Tall)', value: '58' },
      { label: '60" (Extra Tall)', value: '60' }
    ],
    unit: 'inches'
  },
  veil_coverage: {
    key: 'veil_coverage',
    label: 'Veil Style & Coverage',
    type: 'select',
    options: [
      { label: 'Single Layer Breathable', value: 'single_layer' },
      { label: 'Double Layer Opaque', value: 'double_layer' },
      { label: 'Half Niqab (Tie-Back)', value: 'half_niqab' },
      { label: 'Pinch Nose Style', value: 'pinch_nose' }
    ]
  },

  // --- 2. Footwear Specifications ---
  footwear_size: {
    key: 'footwear_size',
    label: 'Shoe Size',
    type: 'select',
    options: [
      { label: 'UK 6 (EU 40)', value: 'UK-6' },
      { label: 'UK 7 (EU 41)', value: 'UK-7' },
      { label: 'UK 8 (EU 42)', value: 'UK-8' },
      { label: 'UK 9 (EU 43)', value: 'UK-9' },
      { label: 'UK 10 (EU 44)', value: 'UK-10' },
      { label: 'UK 11 (EU 45)', value: 'UK-11' }
    ]
  },
  sole_material: {
    key: 'sole_material',
    label: 'Sole Material',
    type: 'select',
    options: [
      { label: 'Cushioned Lightweight EVA', value: 'eva' },
      { label: 'Non-Slip Textured Rubber', value: 'rubber' },
      { label: 'Orthopedic Memory Foam', value: 'memory_foam' },
      { label: 'Handcrafted Leather Sole', value: 'leather' }
    ]
  },

  // --- 3. Tech & Mobile Protection ---
  device_brand: {
    key: 'device_brand',
    label: 'Device Brand',
    type: 'select',
    options: [
      { label: 'Apple iPhone', value: 'apple' },
      { label: 'Samsung Galaxy', value: 'samsung' },
      { label: 'Google Pixel', value: 'google' },
      { label: 'OnePlus', value: 'oneplus' }
    ]
  },
  device_model: {
    key: 'device_model',
    label: 'Phone Model',
    type: 'select',
    options: [
      { label: 'iPhone 16 Pro Max', value: 'iphone_16_promax', metadata: { brand: 'apple' } },
      { label: 'iPhone 16 Pro', value: 'iphone_16_pro', metadata: { brand: 'apple' } },
      { label: 'iPhone 16 Plus', value: 'iphone_16_plus', metadata: { brand: 'apple' } },
      { label: 'iPhone 16', value: 'iphone_16', metadata: { brand: 'apple' } },
      { label: 'iPhone 15 Pro Max', value: 'iphone_15_promax', metadata: { brand: 'apple' } },
      { label: 'iPhone 15 Pro', value: 'iphone_15_pro', metadata: { brand: 'apple' } },
      { label: 'iPhone 15', value: 'iphone_15', metadata: { brand: 'apple' } },
      { label: 'iPhone 14 / 13', value: 'iphone_14_13', metadata: { brand: 'apple' } },
      {
        label: 'Samsung Galaxy S24 Ultra',
        value: 'galaxy_s24_ultra',
        metadata: { brand: 'samsung' }
      },
      {
        label: 'Samsung Galaxy S24 Plus',
        value: 'galaxy_s24_plus',
        metadata: { brand: 'samsung' }
      },
      { label: 'Samsung Galaxy S24', value: 'galaxy_s24', metadata: { brand: 'samsung' } },
      { label: 'Google Pixel 9 Pro XL', value: 'pixel_9_pro_xl', metadata: { brand: 'google' } },
      { label: 'Google Pixel 9 Pro', value: 'pixel_9_pro', metadata: { brand: 'google' } },
      { label: 'Google Pixel 9', value: 'pixel_9', metadata: { brand: 'google' } },
      { label: 'OnePlus 12', value: 'oneplus_12', metadata: { brand: 'oneplus' } }
    ]
  },
  case_material: {
    key: 'case_material',
    label: 'Case Material',
    type: 'select',
    options: [
      { label: 'Tough Armor (Shock-Absorbent TPU + Polycarbonate)', value: 'tough_armor' },
      { label: '9H Gloss Tempered Glass Back', value: 'glass_back' },
      { label: 'Liquid Silicone (Soft Touch & Microfiber Lined)', value: 'silicone' },
      { label: 'Slim Polycarbonate Hard Shell', value: 'hard_pc' }
    ]
  },
  case_finish: {
    key: 'case_finish',
    label: 'Finish',
    type: 'select',
    options: [
      { label: 'High Gloss Crystal Lustre', value: 'gloss' },
      { label: 'Silky Matte Anti-Fingerprint', value: 'matte' },
      { label: 'Translucent Frosted Smoke', value: 'frosted' }
    ]
  },
  glass_type: {
    key: 'glass_type',
    label: 'Glass Shield Type',
    type: 'select',
    options: [
      { label: '9H HD Ultra Clear (True Tone)', value: 'hd_clear' },
      { label: '2-Way Anti-Spy Privacy Shield', value: 'privacy' },
      { label: 'Anti-Glare Matte Silk', value: 'matte_anti_glare' }
    ]
  },

  // --- 4. Custom Print Studio ---
  print_technique: {
    key: 'print_technique',
    label: 'Printing Technology',
    type: 'select',
    options: [
      { label: 'Direct-to-Film (DTF) Multi-Color', value: 'dtf' },
      { label: 'UV Cured Direct Print (Scratch-Proof)', value: 'uv_print' },
      { label: 'Precision Satin Stitch Embroidery', value: 'embroidery' },
      { label: 'Thermal Infusion Sublimation', value: 'sublimation' }
    ]
  },
  print_placements: {
    key: 'print_placements',
    label: 'Print Placement Options',
    type: 'multiselect',
    options: [
      { label: 'Center Chest (Standard)', value: 'front_chest' },
      { label: 'Full Front Graphic', value: 'front_full' },
      { label: 'Upper Center Back', value: 'back_upper' },
      { label: 'Full Back Statement', value: 'back_full' },
      { label: 'Left Pocket / Crest Monogram', value: 'left_crest' },
      { label: 'Sleeve Detail', value: 'sleeve' },
      { label: 'Full 360° Wrap (Mugs/Bottles)', value: 'wrap_360' }
    ]
  },

  // --- 5. Jewelry & Modest Accents ---
  metal_purity: {
    key: 'metal_purity',
    label: 'Metal Purity & Finish',
    type: 'select',
    options: [
      { label: '925 Solid Sterling Silver', value: '925_silver' },
      { label: '18K Royale Gold Vermeil', value: '18k_gold_vermeil' },
      { label: 'Hypoallergenic Titanium', value: 'titanium' },
      { label: 'Antique Oxidized Silver', value: 'oxidized_silver' }
    ]
  },
  stone_type: {
    key: 'stone_type',
    label: 'Gemstone & Inlay',
    type: 'select',
    options: [
      { label: 'Natural Freshwater Pearl', value: 'freshwater_pearl' },
      { label: 'AAA Cubic Zirconia', value: 'cubic_zirconia' },
      { label: 'Natural Black Onyx', value: 'onyx' },
      { label: 'Synthetic Emerald', value: 'emerald' },
      { label: 'Plain Metal / No Inlay', value: 'none' }
    ]
  }
};

/**
 * Returns the relevant facet definitions for a given list of filter keys.
 */
export function resolveFilterFacets(keys: string[]): FacetDefinition[] {
  return keys
    .map((key) => SPECIFICATION_REGISTRY[key])
    .filter((facet): facet is FacetDefinition => Boolean(facet));
}
