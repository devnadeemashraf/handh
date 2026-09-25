import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReassuranceSection } from '@/components/home/ReassuranceSection';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { DraftPreviewBanner } from '@/components/layout/DraftPreviewBanner';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ThemeInjector } from '@/components/layout/ThemeInjector';
import { ProductDetailView } from '@/components/product/ProductDetailView';
import { ProductViewTracker } from '@/components/product/ProductViewTracker';
import {
  getCachedCatalog,
  getCachedCategories,
  getCachedProduct,
  getCachedStore,
  getFreshStore
} from '@/lib/catalog-cache';
import { isDraftModeEnabled } from '@/lib/draft';

import type { Metadata } from 'next';

import { resolveStorefrontConfig } from '@hh/domain';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Incremental Static Regeneration (ISR) with 60-second stale-while-revalidate window.
 * Absorbs traffic bursts from social drops while keeping published inventory fresh.
 */
export const revalidate = 60;

/**
 * Pre-renders the top published catalog product slugs at build time.
 */
export async function generateStaticParams() {
  try {
    const store = await getCachedStore('hh');
    if (!store) return [];
    const products = await getCachedCatalog(store.id);
    return products.slice(0, 50).map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getCachedStore('hh');

  if (!store) {
    return { title: 'Product' };
  }

  const product = await getCachedProduct(store.id, slug);
  if (!product) {
    return { title: 'Piece Not Found' };
  }

  const primaryImage = product.images[0]?.url;

  return {
    title: product.seo.title || `${product.title} — ${store.name}`,
    description: product.seo.description || product.description.slice(0, 160),
    openGraph: {
      title: product.title,
      description: product.description.slice(0, 160),
      type: 'website',
      images: primaryImage ? [{ url: primaryImage, alt: product.title }] : []
    },
    twitter: {
      card: 'summary_large_image',
      title: product.title,
      description: product.description.slice(0, 160),
      images: primaryImage ? [primaryImage] : []
    }
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const isDraft = await isDraftModeEnabled();

  const store = isDraft ? await getFreshStore('hh') : await getCachedStore('hh');
  if (!store) notFound();

  const [product, categories, catalog] = await Promise.all([
    getCachedProduct(store.id, slug),
    getCachedCategories(store.id),
    getCachedCatalog(store.id)
  ]);

  if (!product) {
    notFound();
  }

  const storefrontConfig = resolveStorefrontConfig(store.settings.storefront);
  const primaryVariant = product.variants[0];

  // JSON-LD Structured Data for Google Shopping / SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.images.map((img) => img.url),
    offers: {
      '@type': 'Offer',
      price: primaryVariant ? primaryVariant.priceMinor / 100 : 0,
      priceCurrency: primaryVariant?.currency ?? 'INR',
      availability:
        primaryVariant && primaryVariant.isAvailable
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock'
    }
  };

  return (
    <>
      {/* Live Preview Mode Indicator Banner */}
      {isDraft && <DraftPreviewBanner exitPath={`/products/${slug}`} />}

      <ThemeInjector theme={storefrontConfig.theme} />
      <AnnouncementBar announcement={storefrontConfig.announcement} />
      <Header storeName={store.name} categories={categories} />

      {/* JSON-LD Injected Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Client leaf: fires product_viewed telemetry once on mount (RSC-safe) */}
      <ProductViewTracker
        productId={product.id}
        productName={product.title}
        priceMinor={primaryVariant?.priceMinor ?? 0}
        categoryName={product.category?.name}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
        {/* Mobile Back Link */}
        <div className="md:hidden flex items-center justify-between mb-2">
          <Link
            href="/shop"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground min-h-[44px]"
          >
            &larr; Back to Shop
          </Link>
        </div>

        {/* Desktop Breadcrumb Navigation */}
        <nav
          className="hidden md:flex mb-8 items-center gap-2 text-xs text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link href="/shop" className="transition-colors hover:text-foreground">
            Shop
          </Link>
          <span className="text-muted-foreground/40">/</span>
          {product.category && (
            <>
              <Link
                href={`/collections/${product.category.slug}`}
                className="transition-colors hover:text-foreground"
              >
                {product.category.name}
              </Link>
              <span className="text-muted-foreground/40">/</span>
            </>
          )}
          <span className="font-medium text-foreground truncate max-w-xs">{product.title}</span>
        </nav>

        {/* Coordinated PDP View: Gallery, Purchasing, Progressive Accordions, and Cross-Sell */}
        <ProductDetailView product={product} suggestedProducts={catalog} />

        {/* Brand Reassurance Section */}
        <ReassuranceSection items={storefrontConfig.reassurances} />
      </main>

      <Footer storeName={store.name} instagramHandle={store.settings.instagramHandle} />
    </>
  );
}
