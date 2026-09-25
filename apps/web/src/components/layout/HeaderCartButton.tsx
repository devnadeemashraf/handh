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
        // Desktop (>= 768px): open slide-over cart drawer on standard left-clicks
        if (!e.metaKey && !e.ctrlKey && !e.shiftKey) {
          if (typeof window !== 'undefined' && window.innerWidth >= 768) {
            e.preventDefault();
            openCart();
          }
          // Mobile (< 768px): normal navigation to /cart occurs per design spec
        }
      }}
      className={cn(
        'relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm p-2 text-primary transition-colors hover:text-royal hover:bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal'
      )}
      aria-label={`Shopping Bag with ${totalItemCount} items`}
    >
      <div className="relative flex items-center">
        <ShoppingBag className="h-5 w-5" strokeWidth={1.8} />
        {totalItemCount > 0 && (
          <span
            className={cn(
              'absolute -top-1.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-royal px-1 text-[10px] font-medium leading-none text-white',
              'animate-in zoom-in-75 duration-100'
            )}
          >
            {totalItemCount}
          </span>
        )}
      </div>
    </Link>
  );
}
