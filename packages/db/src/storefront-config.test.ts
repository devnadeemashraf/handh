import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDbClient } from './index';
import { createStore, getStorefrontConfig, updateStorefrontConfig } from './repositories';
import { cleanupTestStore, closeDbClient } from './test-db-helper';

describe('Storefront Config Repository Integration (E-COM-134)', () => {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  const db = createDbClient(databaseUrl);

  const testStoreSlug = `sdui-store-${Date.now()}`;
  let storeId: string;

  beforeAll(async () => {
    const store = await createStore(db, {
      slug: testStoreSlug,
      name: 'SDUI Store',
      defaultCurrency: 'INR',
      isActive: true,
      settings: {}
    });
    storeId = store.id;
  });

  afterAll(async () => {
    if (storeId) {
      await cleanupTestStore(db, storeId);
    }
    await closeDbClient(db);
  });

  it('preserves sibling fields when partial storefront updates are applied (E-COM-134)', async () => {
    // 1. Initial complete configuration update
    const initialConfig = await updateStorefrontConfig(db, testStoreSlug, {
      hero: {
        eyebrow: 'Exclusive Royal Drop',
        title: 'Artisanal Menswear & Jewellery',
        subtitle: 'Hand-forged with 24k gold leaf and pure silver detailing.',
        ctaText: 'Discover Pieces',
        ctaLink: '/collections/heritage',
        variant: 'luxury',
        ctaVariant: 'gold',
        alignment: 'center'
      },
      announcement: {
        enabled: true,
        text: 'Complimentary shipping across India for pre-orders.',
        badge: 'Festive Drop',
        variant: 'emerald',
        badgeVariant: 'gold',
        link: '/collections/festive'
      }
    });

    expect(initialConfig.hero.eyebrow).toBe('Exclusive Royal Drop');
    expect(initialConfig.hero.ctaLink).toBe('/collections/heritage');
    expect(initialConfig.announcement.badge).toBe('Festive Drop');

    // 2. Perform a partial update that ONLY changes hero title and toggles announcement
    const partialUpdate = {
      hero: {
        title: 'New Festive Eid Collection'
      },
      announcement: {
        enabled: false
      }
    };

    const updatedConfig = await updateStorefrontConfig(db, testStoreSlug, partialUpdate);

    // Assert that the modified fields took effect
    expect(updatedConfig.hero.title).toBe('New Festive Eid Collection');
    expect(updatedConfig.announcement.enabled).toBe(false);

    // CRITICAL (E-COM-134): Assert that sibling fields were NOT destroyed or reset to factory defaults!
    expect(updatedConfig.hero.eyebrow).toBe('Exclusive Royal Drop');
    expect(updatedConfig.hero.subtitle).toBe(
      'Hand-forged with 24k gold leaf and pure silver detailing.'
    );
    expect(updatedConfig.hero.ctaText).toBe('Discover Pieces');
    expect(updatedConfig.hero.ctaLink).toBe('/collections/heritage');
    expect(updatedConfig.hero.ctaVariant).toBe('gold');
    expect(updatedConfig.announcement.text).toBe(
      'Complimentary shipping across India for pre-orders.'
    );
    expect(updatedConfig.announcement.badge).toBe('Festive Drop');
    expect(updatedConfig.announcement.link).toBe('/collections/festive');

    // 3. Verify retrieval from database matches
    const fetchedConfig = await getStorefrontConfig(db, testStoreSlug);
    expect(fetchedConfig.hero.title).toBe('New Festive Eid Collection');
    expect(fetchedConfig.hero.eyebrow).toBe('Exclusive Royal Drop');
    expect(fetchedConfig.announcement.badge).toBe('Festive Drop');
  });
});
