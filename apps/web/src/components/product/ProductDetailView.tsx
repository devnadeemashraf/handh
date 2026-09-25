'use client';

import * as React from 'react';

import type { PublicProductDetail, PublicProductListItem, PublicVariantItem } from '@hh/domain';

import { FrequentlyBoughtTogether } from './FrequentlyBoughtTogether';
import { LegalMetrologySection } from './LegalMetrologySection';
import { ProductAccordion } from './ProductAccordion';
import { ProductGallery } from './ProductGallery';
import { ProductPurchaseCard } from './ProductPurchaseCard';
import { RecentlyViewed } from './RecentlyViewed';
import { RelatedProducts } from './RelatedProducts';
import { StickyPurchaseBar } from './StickyPurchaseBar';

export interface ProductDetailViewProps {
  product: PublicProductDetail;
  suggestedProducts: PublicProductListItem[];
}

export function ProductDetailView({ product, suggestedProducts }: ProductDetailViewProps) {
  const [selectedVariant, setSelectedVariant] = React.useState<PublicVariantItem>(
    product.variants[0]!
  );
  const [inPageControlsInView, setInPageControlsInView] = React.useState(true);

  // Compute single priority badge: Sold Out > Sale > New > Low Stock
  const badgeConfig = React.useMemo(() => {
    const isAnyAvailable = product.variants.some((v) => v.isAvailable && v.availableQuantity > 0);
    if (!isAnyAvailable) {
      return {
        label: 'Sold Out',
        variant: 'secondary' as const,
        className: 'bg-muted text-muted-foreground border-transparent'
      };
    }
    const hasSale = product.variants.some(
      (v) => v.compareAtPriceMinor && v.compareAtPriceMinor > v.priceMinor
    );
    if (hasSale) {
      return {
        label: 'Sale',
        variant: 'secondary' as const,
        className: 'bg-destructive/10 text-destructive border-transparent'
      };
    }
    const isNew =
      product.tags?.includes('new') ||
      product.tags?.includes('new-arrival') ||
      product.tags?.includes('latest');
    if (isNew) {
      return {
        label: 'New',
        variant: 'secondary' as const,
        className: 'bg-primary/10 text-primary border-transparent'
      };
    }
    const isLowStock = product.variants.some(
      (v) => v.availableQuantity > 0 && v.availableQuantity <= 5
    );
    if (isLowStock) {
      return {
        label: 'Low Stock',
        variant: 'secondary' as const,
        className: 'bg-warning-tint text-warning border-transparent'
      };
    }
    return undefined;
  }, [product]);

  // Construct PublicProductListItem for RecentlyViewed tracker
  const currentListItem: PublicProductListItem = React.useMemo(
    () => ({
      id: product.id,
      slug: product.slug,
      title: product.title,
      startingPriceMinor: product.variants[0]?.priceMinor ?? 0,
      compareAtPriceMinor: product.variants[0]?.compareAtPriceMinor ?? null,
      currency: product.currency,
      primaryImageUrl: product.images[0]?.url ?? null,
      secondaryImageUrl: product.images[1]?.url ?? null,
      categoryName: product.category?.name ?? null,
      isAvailable: product.variants.some((v) => v.isAvailable),
      tags: product.tags
    }),
    [product]
  );

  return (
    <>
      {/* 2-Column Responsive Hero: Left 55-60% images, Right 40-45% sticky purchase panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image Stack / Carousel */}
        <div className="lg:col-span-7">
          <ProductGallery
            images={product.images}
            title={product.title}
            badge={badgeConfig}
            productId={product.id}
          />
        </div>

        {/* Right Column: Sticky Purchase Controls */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
          {product.category && (
            <span className="block text-xs uppercase tracking-[0.25em] font-semibold text-accent">
              {product.category.name}
            </span>
          )}

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-primary leading-tight">
            {product.title}
          </h1>

          <div className="text-sm sm:text-base leading-relaxed text-muted-foreground max-w-[68ch]">
            {product.description}
          </div>

          {/* Interactive Purchase Card with Real-Time Stock & Selectors */}
          <ProductPurchaseCard
            variants={product.variants}
            initialVariantId={selectedVariant.id}
            productId={product.id}
            productTitle={product.title}
            onVariantChange={setSelectedVariant}
            onControlsVisibilityChange={setInPageControlsInView}
          />

          {/* Statutory Legal Metrology Declarations */}
          <LegalMetrologySection product={product} selectedVariant={selectedVariant} />
        </div>
      </div>

      {/* Centered Accordion: Progressive Disclosure (Description, Materials, Size Guide, Care, Shipping, Reviews) */}
      <div className="mt-16 pt-8 border-t border-border">
        <ProductAccordion
          description={product.description}
          specifications={product.specifications}
          categoryName={product.category?.name}
        />
      </div>

      {/* Frequently Bought Together Bundle Module */}
      <FrequentlyBoughtTogether currentProduct={product} suggestedProducts={suggestedProducts} />

      {/* Related Products Carousel / Grid */}
      <RelatedProducts
        products={suggestedProducts}
        currentProductId={product.id}
        categoryName={product.category?.name}
      />

      {/* Recently Viewed Carousel */}
      <RecentlyViewed currentProduct={currentListItem} />

      {/* Mobile-Only Sticky Buying Bar (visible only when in-page controls scroll out of view) */}
      <StickyPurchaseBar
        selectedVariant={selectedVariant}
        quantity={1}
        productTitle={product.title}
        isVisible={!inPageControlsInView}
      />
    </>
  );
}
