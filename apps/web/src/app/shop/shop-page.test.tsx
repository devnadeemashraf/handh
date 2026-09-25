import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCachedCatalog, getCachedCategories, getCachedStore } from '@/lib/catalog-cache';
import { render, screen } from '@testing-library/react';

import type { Store } from '@hh/db';
import type { CategoryTreeItem, PublicProductListItem } from '@hh/domain';

import ShopPage, { generateMetadata } from './page';

vi.mock('@/lib/catalog-cache', () => ({
  getCachedStore: vi.fn(),
  getCachedCategories: vi.fn(),
  getCachedCatalog: vi.fn()
}));

vi.mock('@/components/catalog/ShopCatalog', () => ({
  ShopCatalog: ({ title }: { title: string }) => (
    <div data-testid="shop-catalog-mock">Mocked Catalog: {title}</div>
  )
}));

vi.mock('@/components/layout/Header', () => ({
  Header: () => <header data-testid="header-mock">Header</header>
}));

vi.mock('@/components/layout/Footer', () => ({
  Footer: () => <footer data-testid="footer-mock">Footer</footer>
}));

vi.mock('@/components/layout/AnnouncementBar', () => ({
  AnnouncementBar: () => null
}));

vi.mock('@/components/layout/ThemeInjector', () => ({
  ThemeInjector: () => null
}));

describe('Shop Page (/shop)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders complete catalog layout with title', async () => {
    vi.mocked(getCachedStore).mockResolvedValue({
      id: 'store-1',
      name: 'The Haya Collection',
      settings: { storefront: {}, instagramHandle: 'hh' }
    } as unknown as Store);

    vi.mocked(getCachedCategories).mockResolvedValue([
      { id: 'cat-1', slug: 'abayas', name: 'Abayas', description: null, subcategories: [] }
    ] as unknown as CategoryTreeItem[]);

    vi.mocked(getCachedCatalog).mockResolvedValue([
      {
        id: 'prod-1',
        slug: 'silk-abaya',
        title: 'Silk Abaya',
        startingPriceMinor: 499900,
        isAvailable: true
      }
    ] as unknown as PublicProductListItem[]);

    const jsx = await ShopPage({
      searchParams: Promise.resolve({})
    });

    render(jsx);

    expect(screen.getByTestId('header-mock')).toBeInTheDocument();
    expect(screen.getByTestId('shop-catalog-mock')).toHaveTextContent(
      'Mocked Catalog: The Complete Collection'
    );
    expect(screen.getByTestId('footer-mock')).toBeInTheDocument();
  });

  it('generates rich metadata for shop page', async () => {
    vi.mocked(getCachedStore).mockResolvedValue({
      id: 'store-1',
      name: 'The Haya Collection'
    } as unknown as Store);

    const metadata = await generateMetadata();

    expect(metadata.title).toContain('Shop All Pieces');
    expect(metadata.description).toContain('Browse our complete artisanal modest collection');
  });
});
