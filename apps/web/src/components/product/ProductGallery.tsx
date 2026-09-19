'use client';

import Image from 'next/image';
import { useState } from 'react';

import type { PublicProductImage } from '@hh/domain';

export function ProductGallery({ images, title }: { images: PublicProductImage[]; title: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeImage = images[selectedIndex] ?? images[0];

  if (!activeImage) {
    return (
      <div
        style={{
          width: '100%',
          aspectRatio: '3 / 4',
          backgroundColor: '#f4f1ea',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)'
        }}
      >
        No Image Available
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Primary Display */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '3 / 4',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          backgroundColor: '#f4f1ea',
          boxShadow: 'var(--shadow-subtle)'
        }}
      >
        <Image
          src={activeImage.url}
          alt={activeImage.altText || title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          style={{ objectFit: 'cover' }}
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setSelectedIndex(idx)}
              style={{
                position: 'relative',
                width: '72px',
                height: '96px',
                flexShrink: 0,
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                border: '2px solid',
                borderColor: selectedIndex === idx ? 'var(--color-primary)' : 'transparent',
                padding: 0,
                backgroundColor: '#f4f1ea',
                cursor: 'pointer'
              }}
              aria-label={`View image ${idx + 1}`}
            >
              <Image
                src={img.url}
                alt={img.altText || `${title} thumbnail ${idx + 1}`}
                fill
                sizes="72px"
                style={{ objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
