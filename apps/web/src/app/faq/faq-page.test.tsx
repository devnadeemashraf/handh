import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { FaqClient } from './FaqClient';
import FaqPage, { metadata } from './page';

vi.mock('@/lib/catalog-cache', () => ({
  getCachedStore: vi.fn().mockResolvedValue({
    id: 'store-1',
    name: 'H&H Luxury Modest Wear',
    settings: { instagramHandle: 'handh_official' }
  }),
  getCachedCategories: vi.fn().mockResolvedValue([])
}));

describe('Frequently Asked Questions (/faq)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports canonical metadata for FAQ page', () => {
    expect(metadata.title).toContain('Frequently Asked Questions');
    expect(metadata.description).toContain('orders');
  });

  it('renders FAQ page with shell, categories, search, and questions', async () => {
    const page = await FaqPage();
    render(page);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Frequently Asked Questions' })
    ).toBeDefined();
    expect(
      screen.getByRole('searchbox', { name: /Search frequently asked questions/i })
    ).toBeDefined();
  });

  it('filters questions by category chip click', () => {
    render(<FaqClient />);

    // Click on "Care" category chip
    const careTab = screen.getByRole('tab', { name: 'Care' });
    fireEvent.click(careTab);

    expect(
      screen.getByText(/How should I wash and care for mulberry silk pieces\?/i)
    ).toBeDefined();
    // Payment question shouldn't be visible under Care
    expect(screen.queryByText(/Which payment methods are accepted at checkout\?/i)).toBeNull();
  });

  it('filters questions by search query and displays empty state on miss', () => {
    render(<FaqClient />);

    const searchInput = screen.getByRole('searchbox', {
      name: /Search frequently asked questions/i
    });

    // Search for "silk"
    fireEvent.change(searchInput, { target: { value: 'silk' } });
    expect(
      screen.getByText(/How should I wash and care for mulberry silk pieces\?/i)
    ).toBeDefined();

    // Search for non-existent keyword
    fireEvent.change(searchInput, { target: { value: 'nonexistent-query-xyz' } });
    expect(screen.getByText('No Questions Match Your Search')).toBeDefined();
    expect(screen.getByRole('button', { name: /Clear Search & Filters/i })).toBeDefined();

    // Clear search restores items
    fireEvent.click(screen.getByRole('button', { name: /Clear Search & Filters/i }));
    expect(screen.queryByText('No Questions Match Your Search')).toBeNull();
  });
});
