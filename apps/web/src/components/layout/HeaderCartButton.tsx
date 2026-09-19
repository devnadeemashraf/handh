'use client';

import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';

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
      className={cn(
        'inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md p-2 text-primary transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      )}
      aria-label={`Shopping Bag with ${totalItemCount} items`}
    >
      <div className="relative flex items-center">
        <ShoppingBag className="h-5 w-5" strokeWidth={2} />
        {totalItemCount > 0 && (
          <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[0.65rem] font-bold leading-none text-primary-foreground shadow-[0_0_0_2px_hsl(var(--card))]">
            {totalItemCount}
          </span>
        )}
      </div>
    </Link>
  );
}
