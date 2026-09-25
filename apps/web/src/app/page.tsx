import { CategoryFilter } from '@/components/catalog/CategoryFilter';
import { ProductCard } from '@/components/catalog/ProductCard';
import { BrandIntroStrip } from '@/components/home/BrandIntroStrip';
import { CraftsmanshipStrip } from '@/components/home/CraftsmanshipStrip';
import { CuratedCollectionsGrid } from '@/components/home/CuratedCollectionsGrid';
import { EditorialHero } from '@/components/home/EditorialHero';
import { FeaturedCollectionBanner } from '@/components/home/FeaturedCollectionBanner';
import { InstagramFeedSection } from '@/components/home/InstagramFeedSection';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { ProductCarousel } from '@/components/home/ProductCarousel';
import { SocialProofSection } from '@/components/home/SocialProofSection';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { DraftPreviewBanner } from '@/components/layout/DraftPreviewBanner';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ThemeInjector } from '@/components/layout/ThemeInjector';
import {
  getCachedCatalog,
  getCachedCategories,
  getCachedStore,
  getFreshStore
} from '@/lib/catalog-cache';
import { isDraftModeEnabled } from '@/lib/draft';

import type { Metadata } from 'next';

import { DEFAULT_BRAND_IDENTITY, resolveStorefrontConfig } from '@hh/domain';

interface HomePageProps {
  searchParams: Promise<{ category?: string }>;
}

/**
 * Incremental Static Regeneration (ISR) with 60-second stale-while-revalidate window.
 * Absorbs traffic bursts from social drops while keeping published inventory fresh.
 */
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const store = await getCachedStore('hh');
  const name = store?.name ?? DEFAULT_BRAND_IDENTITY.name;
  const title = `${name} — ${DEFAULT_BRAND_IDENTITY.subtitle}`;
  const description = DEFAULT_BRAND_IDENTITY.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: DEFAULT_BRAND_IDENTITY.websiteUrl,
      siteName: name
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description
    },
    alternates: {
      canonical: DEFAULT_BRAND_IDENTITY.websiteUrl
    }
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { category: activeCategory } = await searchParams;

  const isDraft = await isDraftModeEnabled();

  // 1. Resolve flagship store with Redis + Edge caching (or direct from DB if in preview mode)
  const store = isDraft ? await getFreshStore('hh') : await getCachedStore('hh');

  if (!store) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold text-primary">Storefront Initializing</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Please run the database seed script (
          <code className="bg-secondary px-1.5 py-0.5 rounded">pnpm db:seed</code>) to initialize
          the store.
        </p>
      </main>
    );
  }

  // 2. Fetch server-driven config, categories, and published catalog in parallel
  const [categories, products] = await Promise.all([
    getCachedCategories(store.id),
    getCachedCatalog(store.id, activeCategory)
  ]);

  const storefrontConfig = resolveStorefrontConfig(store.settings.storefront);

  // 3. Schema.org JSON-LD Structured Data for Search Engine Rich Snippets (E-COM-151)
  const homeJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${DEFAULT_BRAND_IDENTITY.websiteUrl}/#website`,
        url: DEFAULT_BRAND_IDENTITY.websiteUrl,
        name: store.name,
        description: storefrontConfig.hero.subtitle || DEFAULT_BRAND_IDENTITY.description,
        publisher: {
          '@id': `${DEFAULT_BRAND_IDENTITY.websiteUrl}/#organization`
        }
      },
      {
        '@type': 'JewelryStore',
        '@id': `${DEFAULT_BRAND_IDENTITY.websiteUrl}/#organization`,
        name: store.name,
        legalName: DEFAULT_BRAND_IDENTITY.legalName,
        url: DEFAULT_BRAND_IDENTITY.websiteUrl,
        logo: `${DEFAULT_BRAND_IDENTITY.websiteUrl}/icons/icon-512.png`,
        priceRange: '₹₹',
        address: {
          '@type': 'PostalAddress',
          streetAddress: DEFAULT_BRAND_IDENTITY.address.street,
          addressLocality: DEFAULT_BRAND_IDENTITY.address.city,
          addressRegion: DEFAULT_BRAND_IDENTITY.address.state,
          postalCode: DEFAULT_BRAND_IDENTITY.address.postalCode,
          addressCountry: 'IN'
        }
      }
    ]
  };

  const newArrivals = products.slice(0, 4);
  const bestSellers = products.slice().reverse().slice(0, 4);

  return (
    <>
      {/* Live Preview Mode Indicator Banner */}
      {isDraft && <DraftPreviewBanner exitPath="/" />}

      {/* Server-Driven Theme & Colors */}
      <ThemeInjector theme={storefrontConfig.theme} />

      {/* Schema.org Structured Data for Search Engine Rich Snippets (E-COM-151) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />

      {/* Top Promotional Bar */}
      <AnnouncementBar announcement={storefrontConfig.announcement} />

      {/* Luxury Navigation Header */}
      <Header storeName={store.name} categories={categories} />

      {/* Magazine-Spread 85vh Editorial Hero */}
      <EditorialHero hero={storefrontConfig.hero} />

      {/* Brand Intro Typography Pause Strip */}
      <BrandIntroStrip />

      {/* New Arrivals Horizontal Carousel (1.4 cards visible on mobile) */}
      {!activeCategory && products.length > 0 && (
        <ProductCarousel
          title="New Arrivals"
          eyebrow="Fresh From The Atelier"
          viewAllHref="/shop?sort=newest"
          products={newArrivals}
        />
      )}

      {/* Featured Collection Seasonal Editorial Banner */}
      {!activeCategory && <FeaturedCollectionBanner />}

      {/* Best Sellers Horizontal Carousel */}
      {!activeCategory && products.length > 0 && (
        <ProductCarousel
          title="Best Sellers"
          eyebrow="Patron Favorites"
          viewAllHref="/shop?sort=best_selling"
          products={bestSellers}
        />
      )}

      {/* Main Catalog Showcase */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-16" id="catalog">
        <div className="mx-auto max-w-xl text-center">
          <span className="text-xs uppercase tracking-[0.25em] font-semibold text-accent">
            Artisanal Curation
          </span>
          <h2 className="mt-2 font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-primary">
            The Collection
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Individually inspected and crafted for modest sophistication.
          </p>
        </div>

        {/* Dynamic Category Tabs */}
        <CategoryFilter categories={categories} activeCategory={activeCategory} />

        {/* Responsive Product Grid: 2-column mobile / 3-4 column desktop per Design Spec 05 */}
        {products.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 4} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-sm border border-border-subtle bg-surface p-12 text-center">
            <p className="text-sm text-text-secondary">
              No pieces are currently cataloged in this collection.
            </p>
          </div>
        )}
      </main>

      {/* Curated Collections Grid */}
      <CuratedCollectionsGrid />

      {/* Craftsmanship & Quality Pillars Trust Strip */}
      <CraftsmanshipStrip />

      {/* Social Proof Quote Cards */}
      <SocialProofSection />

      {/* Instagram Visual Feed */}
      <InstagramFeedSection handle={store.settings.instagramHandle} />

      {/* In-Flow Newsletter Subscription */}
      <NewsletterSection />

      {/* Global Footer */}
      <Footer storeName={store.name} instagramHandle={store.settings.instagramHandle} />
    </>
  );
}
