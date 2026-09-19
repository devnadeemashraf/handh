import Image from 'next/image';
import Link from 'next/link';

import { Money, type PublicProductListItem } from '@hh/domain';

import { WishlistButton } from '../product/WishlistButton';

export function ProductCard({ product }: { product: PublicProductListItem }) {
  const formattedPrice = Money.fromMinor(product.startingPriceMinor, 'INR').format('en-IN');

  return (
    <article
      className="royale-card"
      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}
    >
      {/* Wishlist Button floating top-right */}
      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 3 }}>
        <WishlistButton productId={product.id} size={18} />
      </div>

      <Link href={`/products/${product.slug}`} style={{ display: 'block', position: 'relative' }}>
        {/* 3:4 Luxury Aspect Ratio Image Wrapper */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '3 / 4',
            backgroundColor: '#f4f1ea',
            overflow: 'hidden'
          }}
        >
          {product.primaryImageUrl ? (
            <Image
              src={product.primaryImageUrl}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              style={{
                objectFit: 'cover',
                transition: 'transform 0.4s ease'
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-muted)',
                fontSize: '0.85rem'
              }}
            >
              H&amp;H Signature
            </div>
          )}

          {/* Availability Badge */}
          <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
            {product.isAvailable ? (
              <span className="royale-badge royale-badge-gold">In Stock</span>
            ) : (
              <span
                className="royale-badge"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)', color: '#ffffff' }}
              >
                Sold Out
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Content */}
      <div
        style={{
          padding: '20px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div>
          {product.categoryName && (
            <span
              style={{
                display: 'block',
                fontSize: '0.7rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginBottom: '4px'
              }}
            >
              {product.categoryName}
            </span>
          )}

          <h3
            style={{
              margin: '0 0 8px 0',
              fontSize: '1.1rem',
              fontWeight: 500,
              color: 'var(--color-text)'
            }}
          >
            <Link href={`/products/${product.slug}`} style={{ color: 'inherit' }}>
              {product.title}
            </Link>
          </h3>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--color-border)'
          }}
        >
          <span
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              color: 'var(--color-primary)'
            }}
          >
            {formattedPrice}
          </span>

          <Link
            href={`/products/${product.slug}`}
            style={{
              fontSize: '0.8rem',
              fontWeight: 500,
              letterSpacing: '0.05em',
              color: 'var(--color-accent)',
              textTransform: 'uppercase'
            }}
          >
            View Details →
          </Link>
        </div>
      </div>
    </article>
  );
}
