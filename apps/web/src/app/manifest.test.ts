import { describe, expect, it } from 'vitest';

import { DEFAULT_BRAND_IDENTITY } from '@hh/domain';

import manifest from './manifest';

describe('PWA Web App Manifest (E-COM-123)', () => {
  it('returns valid metadata route manifest with branding, icons, and shortcuts', () => {
    const config = manifest();

    // 1. Branding and Theme
    expect(config.name).toBe(
      `${DEFAULT_BRAND_IDENTITY.name} ${DEFAULT_BRAND_IDENTITY.terminology.atelierTitle}`
    );
    expect(config.short_name).toBe(DEFAULT_BRAND_IDENTITY.shortName);
    expect(config.theme_color).toBe('#09090b');
    expect(config.background_color).toBe('#ffffff');
    expect(config.display).toBe('standalone');
    expect(config.orientation).toBe('portrait');
    expect(config.categories).toEqual(['shopping', 'lifestyle']);

    // 2. High-resolution & Maskable Icons
    expect(config.icons).toBeDefined();
    expect(config.icons?.length).toBeGreaterThanOrEqual(3);
    const maskableIcon = config.icons?.find((icon) => icon.purpose === 'maskable');
    expect(maskableIcon).toBeDefined();
    expect(maskableIcon?.sizes).toBe('512x512');

    // 3. Web App Shortcuts (E-COM-123)
    expect(config.shortcuts).toBeDefined();
    expect(config.shortcuts?.length).toBe(4);

    const shortcutNames = config.shortcuts?.map((s) => s.name);
    expect(shortcutNames).toContain('Catalog');
    expect(shortcutNames).toContain('Shopping Bag');
    expect(shortcutNames).toContain('Track Order');
    expect(shortcutNames).toContain('Client Concierge');

    const bagShortcut = config.shortcuts?.find((s) => s.name === 'Shopping Bag');
    expect(bagShortcut?.url).toBe('/cart');
    expect(bagShortcut?.icons?.[0]?.src).toBe('/icons/icon-192.png');
  });
});
