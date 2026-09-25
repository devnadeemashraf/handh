import { NextResponse } from 'next/server';
import { getCachedProduct, getCachedStore } from '@/lib/catalog-cache';

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: 'Product slug is required' }, { status: 400 });
    }

    const store = await getCachedStore('hh');
    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    const product = await getCachedProduct(store.id, slug);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ data: product });
  } catch (error) {
    console.error('Error fetching product detail API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
