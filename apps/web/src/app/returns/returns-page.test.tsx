import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import ReturnsPage, { metadata } from './page';

vi.mock('@/lib/catalog-cache', () => ({
  getCachedStore: vi.fn().mockResolvedValue({
    id: 'store-1',
    name: 'H&H Luxury Modest Wear',
    settings: { instagramHandle: 'handh_official' }
  }),
  getCachedCategories: vi.fn().mockResolvedValue([])
}));

describe('Returns & Exchanges Policy (/returns)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports canonical metadata for returns policy', () => {
    expect(metadata.title).toContain('Returns & Exchanges Policy');
    expect(metadata.description).toContain('7-day hassle-free return window');
  });

  it('renders prominent Start a Return CTA, 4-step process guide, and condition rules', async () => {
    const page = await ReturnsPage();
    render(page);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Returns & Exchanges Policy' })
    ).toBeDefined();

    // Prominent Start a Return CTA
    const startReturnBtn = screen.getByRole('link', { name: /Start a Return/i });
    expect(startReturnBtn.getAttribute('href')).toBe('/account/orders');

    // Numbered 4-Step Process Guide
    expect(screen.getByText(/2\. Numbered 4-Step Return Process/i)).toBeDefined();
    expect(screen.getByText('Initiate Return Online')).toBeDefined();
    expect(screen.getByText('Pack With Atelier Tags Attached')).toBeDefined();
    expect(screen.getByText('Complimentary Doorstep Pickup')).toBeDefined();
    expect(screen.getByText('Inspection & Instant Refund')).toBeDefined();

    // Mandatory Garment Conditions
    expect(screen.getByText(/3\. Mandatory Garment Conditions/i)).toBeDefined();
    expect(screen.getByText(/Intact Security Tags:/i)).toBeDefined();
  });
});
