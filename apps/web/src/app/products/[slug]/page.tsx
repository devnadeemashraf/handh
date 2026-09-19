import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ReassuranceSection } from '@/components/home/ReassuranceSection';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ThemeInjector } from '@/components/layout/ThemeInjector';
import { ProductAccordion } from '@/components/product/ProductAccordion';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductPurchaseCard } from '@/components/product/ProductPurchaseCard';

import type { Metadata } from 'next';

import { createDbClient } from '@hh/db';
import { findProductBySlug, findStoreBySlug, getCategoryTree } from '@hh/db';
import { resolveStorefrontConfig } from '@hh/domain';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const db = getDatabase();
  const store = await findStoreBySlug(db, 'hh');

  if (!store) {
    return { title: 'Product' };
  }

  const product = await findProductBySlug(db, store.id, slug);
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
  const db = getDatabase();

  const store = await findStoreBySlug(db, 'hh');
  if (!store) notFound();

  const [product, categories] = await Promise.all([
    findProductBySlug(db, store.id, slug),
    getCategoryTree(db, store.id)
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
      <ThemeInjector theme={storefrontConfig.theme} />
      <AnnouncementBar announcement={storefrontConfig.announcement} />
      <Header storeName={store.name} categories={categories} />

      {/* JSON-LD Injected Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="royale-container" style={{ paddingTop: '32px' }}>
        {/* Breadcrumb Navigation */}
        <nav
          style={{
            fontSize: '0.8rem',
            color: 'var(--color-text-muted)',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          aria-label="Breadcrumb"
        >
          <Link href="/">Catalog</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link href={`/?category=${product.category.slug}#catalog`}>
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{product.title}</span>
        </nav>

        {/* 2-Column Grid: Left Gallery, Right Details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '48px',
            alignItems: 'start'
          }}
        >
          <div>
            <ProductGallery images={product.images} title={product.title} />
          </div>

          <div>
            {product.category && (
              <span className="royale-eyebrow" style={{ display: 'block', marginBottom: '8px' }}>
                {product.category.name}
              </span>
            )}

            <h1
              className="royale-heading"
              style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                lineHeight: 1.2,
                margin: '0 0 16px 0'
              }}
            >
              {product.title}
            </h1>

            <div
              style={{
                color: 'var(--color-text)',
                fontSize: '0.95rem',
                lineHeight: 1.7,
                marginBottom: '32px'
              }}
            >
              {product.description}
            </div>

            {/* Interactive Purchase Card with Real-Time Stock */}
            <ProductPurchaseCard
              variants={product.variants}
              initialVariantId={primaryVariant?.id}
            />

            {/* Craftsmanship, Shipping & Care Accordion */}
            <ProductAccordion />
          </div>
        </div>

        {/* Brand Reassurance Section */}
        <ReassuranceSection items={storefrontConfig.reassurances} />
      </main>

      <Footer storeName={store.name} instagramHandle={store.settings.instagramHandle} />
    </>
  );
}
