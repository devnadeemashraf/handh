import { NextResponse } from 'next/server';
import { getCachedCatalog, getCachedCategories, getCachedStore } from '@/lib/catalog-cache';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') ?? '').trim().toLowerCase();

    if (!query) {
      return NextResponse.json({
        products: [],
        categories: []
      });
    }

    const store = await getCachedStore('hh');
    if (!store) {
      return NextResponse.json({ error: 'Storefront unavailable' }, { status: 503 });
    }

    const [allProducts, allCategories] = await Promise.all([
      getCachedCatalog(store.id),
      getCachedCategories(store.id)
    ]);

    // Match products by title, department, tags, or categoryName
    const matchingProducts = (allProducts || [])
      .filter((p) => {
        const titleMatch = p.title.toLowerCase().includes(query);
        const deptMatch = p.department?.toLowerCase().includes(query) ?? false;
        const tagMatch = p.tags?.some((t) => t.toLowerCase().includes(query));
        const catMatch = p.categoryName?.toLowerCase().includes(query);
        return titleMatch || deptMatch || tagMatch || catMatch;
      })
      .slice(0, 6)
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        department: p.department,
        categoryName: p.categoryName,
        startingPriceMinor: p.startingPriceMinor,
        currency: p.currency,
        primaryImageUrl: p.primaryImageUrl
      }));

    // Match categories by name or slug
    const matchingCategories = (allCategories || [])
      .filter((c) => {
        return c.name.toLowerCase().includes(query) || c.slug.toLowerCase().includes(query);
      })
      .slice(0, 4)
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug
      }));

    return NextResponse.json(
      {
        products: matchingProducts,
        categories: matchingCategories
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=30, stale-while-revalidate=60'
        }
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error during catalog search';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
