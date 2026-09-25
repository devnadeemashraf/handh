'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { ProductCard } from '@/components/catalog/ProductCard';
import { cn } from '@/lib/utils';

import type { PublicProductListItem } from '@hh/domain';

interface ProductCarouselProps {
  title: string;
  viewAllHref: string;
  products: PublicProductListItem[];
  eyebrow?: string;
  className?: string;
}

export function ProductCarousel({
  title,
  viewAllHref,
  products,
  eyebrow,
  className
}: ProductCarouselProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const checkScroll = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  React.useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, products]);

  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const cardWidth = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -cardWidth : cardWidth,
      behavior: 'smooth'
    });
  };

  if (products.length === 0) return null;

  return (
    <section aria-label={title} className={cn('relative py-12 sm:py-16 group/carousel', className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            {eyebrow && (
              <p className="text-[11px] uppercase tracking-[0.25em] font-semibold text-accent mb-1.5">
                {eyebrow}
              </p>
            )}
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {title}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href={viewAllHref}
              className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group/link"
            >
              <span>View all</span>
              <span className="transition-transform group-hover/link:translate-x-0.5">&rarr;</span>
            </Link>

            {/* Desktop Carousel Arrows (visible on hover) */}
            <div className="hidden md:flex items-center gap-1.5 opacity-0 group-hover/carousel:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => scrollByAmount('left')}
                disabled={!canScrollLeft}
                aria-label="Previous products"
                className="w-8 h-8 rounded-sm border border-border bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-secondary transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByAmount('right')}
                disabled={!canScrollRight}
                aria-label="Next products"
                className="w-8 h-8 rounded-sm border border-border bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-secondary transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Container: 1.4 cards visible on mobile (w-[72vw] peeking), 4 on desktop */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4 -mx-4 px-4 sm:mx-0 sm:px-0"
        >
          {products.map((product, idx) => (
            <div
              key={product.id}
              className="w-[72vw] sm:w-[45vw] md:w-[calc(25%-18px)] shrink-0 snap-start"
            >
              <ProductCard product={product} priority={idx < 2} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
