import { CategoryFilter } from '@/components/catalog/CategoryFilter';
import { ProductCard } from '@/components/catalog/ProductCard';
import { HeroSection } from '@/components/home/HeroSection';
import { ReassuranceSection } from '@/components/home/ReassuranceSection';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ThemeInjector } from '@/components/layout/ThemeInjector';

import { createDbClient, findStoreBySlug, getCategoryTree, listPublishedProducts } from '@hh/db';
import { resolveStorefrontConfig } from '@hh/domain';

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
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14" id="catalog">
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

        {/* Responsive Product Grid */}
        {products.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-sm text-muted-foreground">
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
