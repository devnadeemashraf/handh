import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import type { PublicProductListItem } from '@hh/domain';

import { BrandIntroStrip } from './BrandIntroStrip';
import { CraftsmanshipStrip } from './CraftsmanshipStrip';
import { CuratedCollectionsGrid } from './CuratedCollectionsGrid';
import { EditorialHero } from './EditorialHero';
import { FeaturedCollectionBanner } from './FeaturedCollectionBanner';
import { InstagramFeedSection } from './InstagramFeedSection';
import { NewsletterSection } from './NewsletterSection';
import { ProductCarousel } from './ProductCarousel';
import { SocialProofSection } from './SocialProofSection';

// Mock CartContext for ProductCard within ProductCarousel
vi.mock('@/context/CartContext', () => ({
  useCart: () => ({
    addItem: vi.fn(),
    openCart: vi.fn(),
    cart: { items: [] }
  })
}));

const MOCK_PRODUCTS: PublicProductListItem[] = [
  {
    id: 'prod-1',
    slug: 'mulberry-silk-abaya',
    title: 'Mulberry Silk Atelier Abaya',
    startingPriceMinor: 1499900,
    currency: 'INR',
    primaryImageUrl: 'https://images.handh.local/abaya-1.jpg',
    categoryName: 'Atelier Abayas',
    isAvailable: true
  },
  {
    id: 'prod-2',
    slug: 'noir-cashmere-scarf',
    title: 'Noir Cashmere Scarf',
    startingPriceMinor: 499900,
    currency: 'INR',
    primaryImageUrl: 'https://images.handh.local/scarf-1.jpg',
    categoryName: 'Chiffon & Silk Hijabs',
    isAvailable: true
  }
];

describe('Homepage Editorial Suite Components', () => {
  it('renders EditorialHero with campaign title, subtitle, and primary CTA', () => {
    render(
      <EditorialHero
        hero={{
          title: 'Custom Grace Hero',
          subtitle: 'Pure luxury crafted with reverence',
          eyebrow: 'Exclusive Atelier',
          ctaText: 'Discover Pieces',
          ctaLink: '/shop',
          alignment: 'center',
          ctaVariant: 'default',
          variant: 'luxury'
        }}
      />
    );

    expect(screen.getByText('Exclusive Atelier')).toBeDefined();
    expect(screen.getByRole('heading', { name: 'Custom Grace Hero' })).toBeDefined();
    expect(screen.getByText('Pure luxury crafted with reverence')).toBeDefined();
    const cta = screen.getByRole('link', { name: 'Discover Pieces' });
    expect(cta.getAttribute('href')).toBe('/shop');
  });

  it('renders BrandIntroStrip pure typography pause linking to /about', () => {
    render(<BrandIntroStrip />);
    expect(
      screen.getByText(/Honoring modest tradition through deliberate craftsmanship/i)
    ).toBeDefined();
    const aboutLink = screen.getByRole('link', { name: /Read our story/i });
    expect(aboutLink.getAttribute('href')).toBe('/about');
  });

  it('renders ProductCarousel with swipeable items and View all link', () => {
    render(
      <ProductCarousel
        title="New Arrivals"
        viewAllHref="/shop?sort=newest"
        products={MOCK_PRODUCTS}
      />
    );

    expect(screen.getByRole('heading', { name: 'New Arrivals' })).toBeDefined();
    expect(screen.getByText('Mulberry Silk Atelier Abaya')).toBeDefined();
    expect(screen.getByText('Noir Cashmere Scarf')).toBeDefined();
    const viewAllLink = screen.getByRole('link', { name: /View all/i });
    expect(viewAllLink.getAttribute('href')).toBe('/shop?sort=newest');
  });

  it('renders FeaturedCollectionBanner with seasonal title and explore button', () => {
    render(
      <FeaturedCollectionBanner
        collectionName="The Silk Reverie Edit"
        ctaHref="/collections/silk-reverie"
      />
    );

    expect(screen.getByText('The Silk Reverie Edit')).toBeDefined();
    const button = screen.getByRole('link', { name: /Explore the Edit/i });
    expect(button.getAttribute('href')).toBe('/collections/silk-reverie');
  });

  it('renders CuratedCollectionsGrid with 4 collections linking to collection slugs', () => {
    render(<CuratedCollectionsGrid />);

    expect(screen.getByText('Curated Collections')).toBeDefined();
    expect(screen.getByText('Atelier Abayas')).toBeDefined();
    expect(screen.getByText('Chiffon & Silk Hijabs')).toBeDefined();
    const abayasLink = screen.getByRole('link', { name: /Atelier Abayas/i });
    expect(abayasLink.getAttribute('href')).toBe('/collections/abayas');
  });

  it('renders CraftsmanshipStrip with 3 concrete quality pillars', () => {
    render(<CraftsmanshipStrip />);

    expect(screen.getByText('Considered Fabrics')).toBeDefined();
    expect(screen.getByText('Finished by Hand')).toBeDefined();
    expect(screen.getByText('Made to Endure')).toBeDefined();
  });

  it('renders SocialProofSection with patron review cards', () => {
    render(<SocialProofSection />);

    expect(screen.getByText('Loved for Quiet Distinction')).toBeDefined();
    expect(screen.getByText('Amina K.')).toBeDefined();
    expect(screen.getByText('Zoya R.')).toBeDefined();
    expect(screen.getByText('Fatima M.')).toBeDefined();
  });

  it('renders InstagramFeedSection with gallery thumbnails and profile link', () => {
    render(<InstagramFeedSection handle="handh_official" />);

    expect(screen.getByText('On The Feed')).toBeDefined();
    const profileLink = screen.getByRole('link', { name: /@handh_official/i });
    expect(profileLink.getAttribute('href')).toBe('https://instagram.com/handh_official');
  });

  it('renders NewsletterSection and handles form submission', async () => {
    render(<NewsletterSection />);

    expect(screen.getByText('Quiet Letters & Private Previews')).toBeDefined();

    const input = screen.getByLabelText(/Email address for newsletter/i);
    expect(screen.getByRole('button', { name: /Subscribe/i })).toBeDefined();

    // Invalid email triggers error
    const form = input.closest('form')!;
    fireEvent.change(input, { target: { value: 'invalid-email' } });
    fireEvent.submit(form);
    expect(screen.getByText(/Please enter a valid email address/i)).toBeDefined();

    // Valid email succeeds
    fireEvent.change(input, { target: { value: 'patron@example.com' } });
    fireEvent.submit(form);

    // Wait for success message
    const successMsg = await screen.findByText(
      /Thank you for subscribing. Welcome to the H&H inner circle./i
    );
    expect(successMsg).toBeDefined();
  });
});
