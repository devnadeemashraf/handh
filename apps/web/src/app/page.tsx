import { createDbClient } from '@hh/db';
import { findStoreBySlug, listPublishedProducts, getCategoryTree } from '@hh/db';
import { resolveStorefrontConfig } from '@hh/domain';
import { ThemeInjector } from '@/components/layout/ThemeInjector';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryFilter } from '@/components/catalog/CategoryFilter';
import { ProductCard } from '@/components/catalog/ProductCard';
import { ReassuranceSection } from '@/components/home/ReassuranceSection';

interface HomePageProps {
  searchParams: Promise<{ category?: string }>;
}

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { category: activeCategory } = await searchParams;
  const db = getDatabase();

  // 1. Resolve flagship store
  const store = await findStoreBySlug(db, 'hh');

  if (!store) {
    return (
      <main style={{ padding: '64px 24px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>Storefront Initializing</h2>
        <p>
          Please run the database seed script (<code>pnpm db:seed</code>) to initialize the store.
        </p>
      </main>
    );
  }

  // 2. Fetch server-driven config, categories, and published catalog in parallel
  const [categories, products] = await Promise.all([
    getCategoryTree(db, store.id),
    listPublishedProducts(db, store.id, activeCategory ? { categorySlug: activeCategory } : {})
  ]);

  const storefrontConfig = resolveStorefrontConfig(store.settings.storefront);

  return (
    <>
      {/* Server-Driven Theme & Colors */}
      <ThemeInjector theme={storefrontConfig.theme} />

      {/* Top Promotional Bar */}
      <AnnouncementBar announcement={storefrontConfig.announcement} />

      {/* Luxury Navigation Header */}
      <Header storeName={store.name} categories={categories} />

      {/* Server-Driven Hero Section */}
      <HeroSection hero={storefrontConfig.hero} />

      {/* Main Catalog Showcase */}
      <main className="royale-container" id="catalog" style={{ paddingTop: '56px' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
          <span className="royale-eyebrow">Artisanal Curation</span>
          <h2 className="royale-heading" style={{ fontSize: '2rem', margin: '8px 0 12px' }}>
            The Collection
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', margin: 0 }}>
            Individually inspected and crafted for modest sophistication.
          </p>
        </div>

        {/* Dynamic Category Tabs */}
        <CategoryFilter categories={categories} activeCategory={activeCategory} />

        {/* Responsive Product Grid */}
        {products.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '32px',
              marginTop: '32px'
            }}
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '64px 24px',
              backgroundColor: 'var(--color-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              marginTop: '32px'
            }}
          >
            <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
              No pieces are currently cataloged in this collection.
            </p>
          </div>
        )}

        {/* Brand Reassurance Section */}
        <ReassuranceSection items={storefrontConfig.reassurances} />
      </main>

      {/* Global Footer */}
      <Footer storeName={store.name} instagramHandle={store.settings.instagramHandle} />
    </>
  );
}
