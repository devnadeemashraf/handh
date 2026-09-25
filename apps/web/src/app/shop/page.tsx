import { ShopCatalog } from '@/components/catalog/ShopCatalog';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ThemeInjector } from '@/components/layout/ThemeInjector';
import { getCachedCatalog, getCachedCategories, getCachedStore } from '@/lib/catalog-cache';

import type { Metadata } from 'next';

import { DEFAULT_BRAND_IDENTITY, resolveStorefrontConfig } from '@hh/domain';

export const revalidate = 60;

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    price?: string;
    inStock?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const store = await getCachedStore('hh');
  const storeName = store?.name ?? DEFAULT_BRAND_IDENTITY.name;
  const title = `Shop All Pieces — ${storeName}`;
  const description =
    'Browse our complete artisanal modest collection. Discover handcrafted abayas, luxury slip-ons, hijab accents, and signature accessories.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${DEFAULT_BRAND_IDENTITY.websiteUrl}/shop`,
      siteName: storeName
    }
  };
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { category: activeCategory } = await searchParams;

  const store = await getCachedStore('hh');

  if (!store) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-serif text-foreground">Store Initializing</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Please run the database seed script to initialize the collection.
        </p>
      </main>
    );
  }

  const [categories, products] = await Promise.all([
    getCachedCategories(store.id),
    getCachedCatalog(store.id)
  ]);

  const storefrontConfig = resolveStorefrontConfig(store.settings.storefront);

  return (
    <>
      <ThemeInjector theme={storefrontConfig.theme} />
      <AnnouncementBar announcement={storefrontConfig.announcement} />
      <Header storeName={store.name} categories={categories} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <ShopCatalog
          products={products}
          categories={categories}
          initialCategory={activeCategory ?? ''}
          title="The Complete Collection"
          description="Explore our meticulously crafted garments and fine accessories, designed with intentional silhouettes, calm palettes, and modest refinement."
        />
      </main>

      <Footer storeName={store.name} instagramHandle={store.settings.instagramHandle} />
    </>
  );
}
