'use client';

import Image from 'next/image';
import * as React from 'react';
import { cn } from '@/lib/utils';

import type { PublicProductImage } from '@hh/domain';

export function ProductGallery({ images, title }: { images: PublicProductImage[]; title: string }) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const activeImage = images[selectedIndex] ?? images[0];

  if (!activeImage) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-secondary/40 border border-border text-sm text-muted-foreground">
        No Image Available
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Primary Display */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-secondary/40 border border-border shadow-sm">
        <Image
          src={activeImage.url}
          alt={activeImage.altText || title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={cn(
                'relative h-24 w-18 shrink-0 overflow-hidden rounded-md border-2 bg-secondary/40 transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selectedIndex === idx
                  ? 'border-primary shadow-sm'
                  : 'border-transparent opacity-70 hover:opacity-100'
              )}
              aria-label={`View image ${idx + 1}`}
            >
              <Image
                src={img.url}
                alt={img.altText || `${title} thumbnail ${idx + 1}`}
                fill
                sizes="72px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
