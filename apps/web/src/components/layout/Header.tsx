import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import type { CategoryTreeItem } from '@hh/domain';

export function Header({
  storeName,
  categories
}: {
  storeName: string;
  categories: CategoryTreeItem[];
}) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(253, 251, 247, 0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--color-border)'
      }}
    >
      <div
        className="royale-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '72px'
        }}
      >
        {/* Navigation Categories */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link
            href="/"
            style={{
              fontSize: '0.85rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text)',
              fontWeight: 500
            }}
          >
            All Collections
          </Link>
          {categories.slice(0, 3).map((cat) => (
            <Link
              key={cat.id}
              href={`/?category=${cat.slug}`}
              style={{
                fontSize: '0.85rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                fontWeight: 500
              }}
            >
              {cat.name}
            </Link>
          ))}
        </nav>

        {/* Central Brand Identity */}
        <div style={{ textAlign: 'center' }}>
          <Link href="/" style={{ display: 'inline-block' }}>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.75rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                color: 'var(--color-primary)'
              }}
            >
              {storeName}
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '0.6rem',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'var(--color-accent)',
                marginTop: '-4px'
              }}
            >
              Curated Essentials
            </span>
          </Link>
        </div>

        {/* Right Actions: Bag / Cart */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            href="/cart"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-primary)'
            }}
            aria-label="Shopping Bag"
          >
            <ShoppingBag size={20} />
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '9999px'
              }}
            >
              0
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
