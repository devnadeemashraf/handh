import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import ProductDetailPage from './page';

const { mockProduct } = vi.hoisted(() => ({
  mockProduct: {
    id: 'prod-001',
    slug: 'emerald-abaya-pin',
    title: 'Royale Emerald Abaya Pin',
    description: 'Handcrafted emerald modesty pin.',
    department: 'women',
    currency: 'INR',
    isCustomizable: false,
    countryOfOrigin: 'India',
    netQuantity: '1 N',
    commodityName: 'Modest Wear Hijab Pin',
    manufacturerDetails: {
      name: 'H&H Luxury Modest Wear Private Limited',
      address: 'Plot No. 128, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500034, India',
      email: 'support@handh.in',
      phone: '+91 40 2355 7890'
    },
    packerDetails: {
      name: 'H&H Packaging Facility',
      address: 'Plot No. 128, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500034, India'
    },
    consumerCareDetails: {
      email: 'support@handh.in',
      phone: '+91 40 2355 7890',
      address: 'Plot No. 128, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500034, India'
    },
    category: {
      id: 'cat-01',
      slug: 'jewelry',
      name: 'Jewelry'
    },
    variants: [
      {
        id: 'var-01',
        sku: 'HH-PIN-EM-01',
        title: 'Standard',
        priceMinor: 129900,
        compareAtPriceMinor: 159900,
        currency: 'INR',
        isAvailable: true,
        availableQuantity: 5
      }
    ],
    images: [
      {
        id: 'img-01',
        url: 'https://images.handh.local/pin-01.jpg',
        altText: 'Royale Emerald Pin',
        sortOrder: 0
      }
    ],
    seo: {
      title: 'Royale Emerald Pin',
      description: 'Emerald Pin'
    }
  }
}));

vi.mock('@hh/db', () => ({
  getSharedDbClient: vi.fn(() => ({})),
  findStoreBySlug: vi.fn().mockResolvedValue({
    id: 'store-1',
    name: 'H&H',
    settings: {
      instagramHandle: 'handh_official',
      storefront: {}
    }
  }),
  findProductBySlug: vi.fn().mockResolvedValue(mockProduct),
  getCategoryTree: vi.fn().mockResolvedValue([])
}));

describe('Product Detail Page (/products/[slug])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product details, statutory MRP, and Legal Metrology declarations', async () => {
    const page = await ProductDetailPage({
      params: Promise.resolve({ slug: 'emerald-abaya-pin' })
    });
    render(page);

    // Product Title
    expect(
      screen.getByRole('heading', { level: 1, name: 'Royale Emerald Abaya Pin' })
    ).toBeDefined();

    // Legal Metrology Declarations Heading
    expect(
      screen.getByRole('heading', { level: 3, name: 'Legal Metrology Declarations' })
    ).toBeDefined();

    // Statutory declarations
    expect(screen.getByText('Modest Wear Hijab Pin')).toBeDefined();
    expect(screen.getByText('1 N')).toBeDefined();
    expect(screen.getByText('India')).toBeDefined();
    expect(screen.getAllByText(/MRP \(Inclusive of all taxes\)/i).length).toBeGreaterThanOrEqual(1);

    // Corporate coordinates
    expect(
      screen.getAllByText('H&H Luxury Modest Wear Private Limited').length
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('support@handh.in').length).toBeGreaterThanOrEqual(1);
  });
});
