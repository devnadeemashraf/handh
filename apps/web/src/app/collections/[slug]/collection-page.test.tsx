import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCachedCatalog, getCachedCategories, getCachedStore } from '@/lib/catalog-cache';
import { render, screen } from '@testing-library/react';

import type { Store } from '@hh/db';
import type { CategoryTreeItem, PublicProductListItem } from '@hh/domain';

import CollectionPage, { generateMetadata } from './page';

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

const mockNotFound = vi.fn();
vi.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/collections/abayas'
}));

describe('Collection Page (/collections/[slug])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders collection editorial hero and scoped catalog', async () => {
    vi.mocked(getCachedStore).mockResolvedValue({
      id: 'store-1',
      name: 'The Haya Collection',
      settings: { storefront: {}, instagramHandle: 'hh' }
    } as unknown as Store);

    vi.mocked(getCachedCategories).mockResolvedValue([
      {
        id: 'cat-1',
        slug: 'abayas',
        name: 'Abayas',
        description: 'Flowing modest abayas.',
        subcategories: []
      }
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

    const jsx = await CollectionPage({
      params: Promise.resolve({ slug: 'abayas' }),
      searchParams: Promise.resolve({})
    });

    render(jsx);

    expect(screen.getByText('Abayas')).toBeInTheDocument();
    expect(screen.getByTestId('shop-catalog-mock')).toHaveTextContent('Mocked Catalog: Abayas');
  });

  it('generates rich metadata for collection', async () => {
    vi.mocked(getCachedStore).mockResolvedValue({
      id: 'store-1',
      name: 'The Haya Collection'
    } as unknown as Store);

    vi.mocked(getCachedCategories).mockResolvedValue([
      {
        id: 'cat-1',
        slug: 'abayas',
        name: 'Abayas',
        description: 'Flowing modest abayas.',
        subcategories: []
      }
    ] as unknown as CategoryTreeItem[]);

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: 'abayas' }),
      searchParams: Promise.resolve({})
    });

    expect(metadata.title).toContain('Abayas Collection');
    expect(metadata.description).toContain('Flowing modest abayas');
  });
});
