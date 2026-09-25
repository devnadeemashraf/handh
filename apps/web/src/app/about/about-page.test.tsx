import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import AboutPage, { metadata } from './page';

vi.mock('@/lib/catalog-cache', () => ({
  getCachedStore: vi.fn().mockResolvedValue({
    id: 'store-1',
    name: 'H&H Luxury Modest Wear',
    settings: { instagramHandle: 'handh_official' }
  }),
  getCachedCategories: vi.fn().mockResolvedValue([])
}));

describe('About The Brand Page (/about)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports metadata with canonical URL and brand philosophy description', () => {
    expect(metadata.title).toContain('Our Story');
    expect(metadata.description).toContain('Haya');
  });

  it('renders editorial opening hero, Haya naming beat, craftsmanship, and shop CTA', async () => {
    const page = await AboutPage();
    render(page);

    // Opening hero headline
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /Modesty is not an afterthought/i
      })
    ).toBeDefined();

    // Haya philosophy beat
    expect(screen.getByText(/The Principle of/i)).toBeDefined();
    expect(screen.getByText(/The Etymology/i)).toBeDefined();

    // Craftsmanship sections
    expect(screen.getByText(/Fabrics That Breathe and Flow/i)).toBeDefined();
    expect(screen.getByText(/Single-Needle Precision & French Hems/i)).toBeDefined();
    expect(screen.getByText(/Rooted in Heritage, Refined for Today/i)).toBeDefined();

    // Commerce return CTA
    const shopCta = screen.getByRole('link', { name: /Shop the Collection/i });
    expect(shopCta.getAttribute('href')).toBe('/shop');
  });
});
