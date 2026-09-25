import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ShopCatalog } from '@/components/catalog/ShopCatalog';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ThemeInjector } from '@/components/layout/ThemeInjector';
import { getCachedCatalog, getCachedCategories, getCachedStore } from '@/lib/catalog-cache';

import type { Metadata } from 'next';

import { DEFAULT_BRAND_IDENTITY, resolveStorefrontConfig } from '@hh/domain';

export const revalidate = 60;

interface CollectionPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    sort?: string;
    price?: string;
    inStock?: string;
  }>;
}

// Editorial curated banners mapped by category slug
const COLLECTION_BANNERS: Record<string, { image: string; tag: string; description: string }> = {
  abayas: {
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3',
    tag: 'Signature Silhouettes',
    description:
      'Effortless flowing forms, breathable textiles, and refined modest draping tailored for daily ease and ceremonial grace.'
  },
  accessories: {
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908',
    tag: 'Artisanal Accents',
    description:
      'Handcrafted adornments, sterling accents, and precision-finished nose pieces designed to complete your signature look.'
  },
  jewelry: {
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338',
    tag: 'Lustrous Heirlooms',
    description:
      'Subtle metallic lusters and bespoke gemstone accents crafted to stand the test of time.'
  },
  'hijab-accents': {
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3',
    tag: 'Refined Complements',
    description:
      'Gentle pins, magnetic accents, and protective slips engineered for seamless modest styling.'
  }
};

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getCachedStore('hh');
  const storeName = store?.name ?? DEFAULT_BRAND_IDENTITY.name;

  const categories = store ? await getCachedCategories(store.id) : [];
  const found = categories.find((c) => c.slug === slug);
  const name = found ? found.name : slug.replace(/-/g, ' ');

  const title = `${name} Collection — ${storeName}`;
  const description = found?.description || `Explore our curated ${name} pieces at ${storeName}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${DEFAULT_BRAND_IDENTITY.websiteUrl}/collections/${slug}`,
      siteName: storeName
    }
  };
}

export default async function CollectionPage({
  params,
  searchParams: _searchParams
}: CollectionPageProps) {
  const { slug } = await params;

  const store = await getCachedStore('hh');
  if (!store) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-serif text-text-primary">Store Initializing</h2>
      </main>
    );
  }

  const [categories, collectionProducts] = await Promise.all([
    getCachedCategories(store.id),
    getCachedCatalog(store.id, slug === 'all' ? undefined : slug)
  ]);

  // Find target collection
  const collectionCat = categories.find((c) => c.slug === slug);
  if (!collectionCat && slug !== 'all') {
    notFound();
  }

  const bannerMeta = COLLECTION_BANNERS[slug] || {
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3',
    tag: 'Curated Drop',
    description:
      collectionCat?.description ||
      'Thoughtfully tailored pieces crafted with exceptional attention to material integrity.'
  };

  const collectionName = collectionCat ? collectionCat.name : 'All Curated Pieces';
  const storefrontConfig = resolveStorefrontConfig(store.settings.storefront);

  return (
    <>
      <ThemeInjector theme={storefrontConfig.theme} />
      <AnnouncementBar announcement={storefrontConfig.announcement} />
      <Header storeName={store.name} categories={categories} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Dynamic Editorial Hero Banner: 16:9 mobile, 21:9 desktop per Design Spec 05.3 */}
        <section className="relative mb-8 md:mb-12 overflow-hidden rounded-md border border-border-subtle bg-sunken">
          <div className="relative aspect-[16/9] md:aspect-[21/9] w-full">
            <Image
              src={bannerMeta.image}
              alt={collectionName}
              fill
              priority
              sizes="100vw"
              className="object-cover brightness-75 transition-all duration-slow"
            />
            {/* Editorial overlay positioned in negative space */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 md:p-14 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
              <span className="text-[10px] sm:text-xs uppercase font-medium tracking-[0.25em] text-white/80">
                {bannerMeta.tag}
              </span>
              <h1 className="mt-1 font-serif text-2xl sm:text-4xl md:text-5xl font-medium tracking-wide text-white">
                {collectionName}
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-white/90 max-w-xl line-clamp-2 leading-relaxed">
                {bannerMeta.description}
              </p>
            </div>
          </div>
        </section>

        {/* Pre-filtered Shop Catalog with adaptive filters */}
        <ShopCatalog
          products={collectionProducts}
          categories={categories}
          initialCategory={slug}
          title={collectionName}
        />
      </main>

      <Footer storeName={store.name} instagramHandle={store.settings.instagramHandle} />
    </>
  );
}
