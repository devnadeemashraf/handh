import { describe, expect, it } from 'vitest';

import {
  DEFAULT_TAXONOMY,
  flattenTaxonomyTree,
  resolveFilterFacets,
  SPECIFICATION_REGISTRY,
  validateCustomizationPayload
} from './index';

describe('Taxonomy Domain Architecture', () => {
  it('contains 5 major departments', () => {
    expect(DEFAULT_TAXONOMY).toHaveLength(5);
    const departmentSlugs = DEFAULT_TAXONOMY.map((d) => d.slug);
    expect(departmentSlugs).toContain('men');
    expect(departmentSlugs).toContain('women');
    expect(departmentSlugs).toContain('tech');
    expect(departmentSlugs).toContain('custom-studio');
    expect(departmentSlugs).toContain('lifestyle');
  });

  it('flattens taxonomy tree into valid database seed records with paths', () => {
    const flat = flattenTaxonomyTree();
    expect(flat.length).toBeGreaterThan(40);

    const tshirts = flat.find((r) => r.path === '/men/apparel/t-shirts');
    expect(tshirts).toBeDefined();
    expect(tshirts?.depth).toBe(2);
    expect(tshirts?.applicableFilterKeys).toContain('size');
    expect(tshirts?.applicableFilterKeys).toContain('fabric');

    const backCovers = flat.find((r) => r.path === '/tech/cases/custom-printed');
    expect(backCovers).toBeDefined();
    expect(backCovers?.applicableFilterKeys).toContain('device_brand');
    expect(backCovers?.applicableFilterKeys).toContain('device_model');
  });

  it('resolves dynamic facets from registry correctly', () => {
    expect(SPECIFICATION_REGISTRY['size']).toBeDefined();
    const facets = resolveFilterFacets(['size', 'color', 'device_model']);
    expect(facets).toHaveLength(3);
    expect(facets[0]?.key).toBe('size');
    expect(facets[1]?.type).toBe('color_swatch');
    expect(facets[2]?.options?.length).toBeGreaterThan(5);
  });

  it('validates customization payloads against rules', () => {
    const rule = {
      enabled: true,
      surchargeMinor: 29900,
      productionLeadDays: 3,
      allowCustomText: true,
      textConfig: {
        maxLength: 20
      },
      allowImageUpload: true,
      allowedPlacements: ['front_chest', 'back_full']
    };

    // Valid
    const validResult = validateCustomizationPayload(rule, {
      customText: 'Custom Print',
      placement: 'front_chest'
    });
    expect(validResult.valid).toBe(true);

    // Text too long
    const invalidTextResult = validateCustomizationPayload(rule, {
      customText: 'This text is definitely way longer than twenty characters',
      placement: 'front_chest'
    });
    expect(invalidTextResult.valid).toBe(false);
    expect(invalidTextResult.error).toContain('exceeds maximum length');

    // Invalid placement
    const invalidPlacementResult = validateCustomizationPayload(rule, {
      customText: 'Valid',
      placement: 'invalid_placement'
    });
    expect(invalidPlacementResult.valid).toBe(false);
    expect(invalidPlacementResult.error).toContain('Selected placement');
  });
});
