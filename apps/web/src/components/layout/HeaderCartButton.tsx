'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ShoppingBag } from 'lucide-react';

export function HeaderCartButton() {
  const { totalItemCount, openCart } = useCart();

  return (
    <Link
      href="/cart"
      onClick={(e) => {
        // Mobile-first drawer opening on standard left-clicks
        if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
          e.preventDefault();
          openCart();
        }
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        borderRadius: 'var(--radius-sm)',
        color: 'var(--color-primary)',
        textDecoration: 'none',
        minHeight: '44px',
        minWidth: '44px',
        justifyContent: 'center'
      }}
      aria-label={`Shopping Bag with ${totalItemCount} items`}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <ShoppingBag size={22} color="currentColor" strokeWidth={2} />
        {totalItemCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-8px',
              fontSize: '0.72rem',
              fontWeight: 700,
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              padding: '1px 5px',
              borderRadius: '9999px',
              minWidth: '18px',
              textAlign: 'center',
              lineHeight: '1.2',
              boxShadow: '0 0 0 2px var(--color-surface)'
            }}
          >
            {totalItemCount}
          </span>
        )}
      </div>
    </Link>
  );
}
