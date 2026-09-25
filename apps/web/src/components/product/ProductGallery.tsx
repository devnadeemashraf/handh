'use client';

import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import type { PublicProductImage } from '@hh/domain';

import { WishlistButton } from './WishlistButton';

export interface ProductGalleryProps {
  images: PublicProductImage[];
  title: string;
  badge?:
    | {
        label: string;
        variant?: 'default' | 'secondary' | 'outline' | 'destructive';
        className?: string;
      }
    | undefined;
  productId?: string | undefined;
}

export function ProductGallery({ images, title, badge, productId }: ProductGalleryProps) {
  const [activeMobileIndex, setActiveMobileIndex] = React.useState(0);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const mobileCarouselRef = React.useRef<HTMLDivElement>(null);

  const displayImages = images.length > 0 ? images : [];

  // Update mobile active dot on scroll
  const handleMobileScroll = React.useCallback(() => {
    const el = mobileCarouselRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const width = el.clientWidth;
    if (width > 0) {
      const index = Math.round(scrollLeft / width);
      setActiveMobileIndex(Math.max(0, Math.min(displayImages.length - 1, index)));
    }
  }, [displayImages.length]);

  // Scroll to dot on click
  const scrollToImage = (index: number) => {
    const el = mobileCarouselRef.current;
    if (!el) return;
    el.scrollTo({
      left: index * el.clientWidth,
      behavior: 'smooth'
    });
    setActiveMobileIndex(index);
  };

  // Keyboard navigation for Lightbox
  React.useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight' && displayImages.length > 1) {
        setLightboxIndex((prev) => (prev !== null ? (prev + 1) % displayImages.length : 0));
      } else if (e.key === 'ArrowLeft' && displayImages.length > 1) {
        setLightboxIndex((prev) =>
          prev !== null ? (prev - 1 + displayImages.length) % displayImages.length : 0
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [lightboxIndex, displayImages.length]);

  if (displayImages.length === 0) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-md border border-border-subtle bg-sunken text-sm text-text-tertiary">
        No Image Available
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* ========================================================================= */}
      {/* Mobile: Full-bleed edge-to-edge swipeable carousel (4:5) */}
      {/* ========================================================================= */}
      <div className="block lg:hidden -mx-4 sm:-mx-6">
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-sunken">
          {/* Top-Left Priority Badge */}
          {badge && (
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
              <Badge
                variant={badge.variant ?? 'secondary'}
                className={cn(
                  'text-[11px] uppercase tracking-wider shadow-sm font-semibold',
                  badge.className
                )}
              >
                {badge.label}
              </Badge>
            </div>
          )}

          {/* Top-Right Floating Wishlist Button */}
          {productId && (
            <div className="absolute top-4 right-4 z-10">
              <div className="rounded-sm bg-surface/90 shadow-sm backdrop-blur-sm p-0.5">
                <WishlistButton productId={productId} variant="icon" size={18} />
              </div>
            </div>
          )}

          {/* Swipeable image container */}
          <div
            ref={mobileCarouselRef}
            onScroll={handleMobileScroll}
            className="flex h-full w-full overflow-x-auto snap-x snap-mandatory scrollbar-none"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {displayImages.map((img, idx) => (
              <div
                key={img.id || idx}
                className="relative h-full w-full shrink-0 snap-center select-none"
                onClick={() => setLightboxIndex(idx)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setLightboxIndex(idx);
                }}
                aria-label={`View full image ${idx + 1} of ${displayImages.length}`}
              >
                <Image
                  src={img.url}
                  alt={img.altText || `${title} photo ${idx + 1}`}
                  fill
                  priority={idx === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>

          {/* Tap-to-zoom hint overlay */}
          <div className="absolute bottom-3 right-3 pointer-events-none z-10 flex items-center gap-1 rounded-sm bg-black/40 px-2 py-1 text-[10px] text-white backdrop-blur-sm">
            <ZoomIn className="h-3 w-3" />
            <span>Tap to zoom</span>
          </div>
        </div>

        {/* 6px Dot Indicators */}
        {displayImages.length > 1 && (
          <div
            className="flex items-center justify-center gap-2 py-3.5"
            role="tablist"
            aria-label="Image gallery dots"
          >
            {displayImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={activeMobileIndex === idx}
                aria-label={`Go to slide ${idx + 1}`}
                onClick={() => scrollToImage(idx)}
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition-all duration-fast',
                  activeMobileIndex === idx
                    ? 'bg-royal scale-125'
                    : 'bg-border-strong hover:bg-text-secondary'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* Desktop: Vertical image stack (55-60% width) with generous 32px spacing */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex flex-col gap-8">
        {displayImages.map((img, idx) => (
          <div
            key={img.id || idx}
            onClick={() => setLightboxIndex(idx)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setLightboxIndex(idx);
            }}
            className="group relative aspect-[4/5] w-full overflow-hidden rounded-md border border-border-subtle bg-sunken cursor-zoom-in shadow-xs transition-shadow hover:shadow-md"
            aria-label={`Open photo ${idx + 1} of ${displayImages.length} in lightbox`}
          >
            {/* Top-Left Badge on first image only */}
            {idx === 0 && badge && (
              <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <Badge
                  variant={badge.variant ?? 'secondary'}
                  className={cn(
                    'text-xs uppercase tracking-wider shadow-sm font-semibold',
                    badge.className
                  )}
                >
                  {badge.label}
                </Badge>
              </div>
            )}

            {/* Top-Right Wishlist Button on first image */}
            {idx === 0 && productId && (
              <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
                <div className="rounded-sm bg-surface/90 shadow-sm backdrop-blur-sm p-0.5">
                  <WishlistButton productId={productId} variant="icon" size={20} />
                </div>
              </div>
            )}

            <Image
              src={img.url}
              alt={img.altText || `${title} photo ${idx + 1}`}
              fill
              priority={idx === 0}
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover transition-transform duration-slow ease-standard group-hover:scale-[1.02]"
            />

            {/* Hover subtle zoom icon */}
            <div className="absolute bottom-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-sm bg-surface/80 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">
              <ZoomIn className="h-4 w-4 text-text-primary" />
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* Fullscreen Lightbox Modal */}
      {/* ========================================================================= */}
      {lightboxIndex !== null && displayImages[lightboxIndex] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image Lightbox"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-md animate-fade-in"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Top Bar Controls */}
          <div
            className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-mono text-xs tabular-nums text-white/80 tracking-wider">
              {lightboxIndex + 1} / {displayImages.length}
            </div>
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="flex h-11 w-11 items-center justify-center rounded-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close Lightbox"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Previous Button */}
          {displayImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) =>
                  prev !== null ? (prev - 1 + displayImages.length) % displayImages.length : 0
                );
              }}
              className="absolute left-4 z-50 flex h-12 w-12 items-center justify-center rounded-sm bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 select-none"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Next Button */}
          {displayImages.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex((prev) => (prev !== null ? (prev + 1) % displayImages.length : 0));
              }}
              className="absolute right-4 z-50 flex h-12 w-12 items-center justify-center rounded-sm bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 select-none"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Lightbox Central Image */}
          <div
            className="relative h-[85vh] w-[90vw] max-w-5xl select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={displayImages[lightboxIndex].url}
              alt={displayImages[lightboxIndex].altText || `${title} lightbox image`}
              fill
              priority
              sizes="100vw"
              className="object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
