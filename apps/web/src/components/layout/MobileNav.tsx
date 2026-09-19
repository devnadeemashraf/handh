'use client';

import { Compass, Heart, Home, ShoppingBag, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();
  const { user, openAuthModal } = useAuth();
  const { totalItemCount, openCart } = useCart();

  // Hide mobile nav in admin portal
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const isHome = pathname === '/';
  const isWishlist = pathname === '/account/wishlist';
  const isAccount = pathname.startsWith('/account') && !isWishlist;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-md pb-safe md:hidden supports-[backdrop-filter]:bg-background/85"
      aria-label="Mobile Navigation Bar"
    >
      <div className="grid h-16 grid-cols-5 items-center px-1">
        {/* 1. Home */}
        <Link
          href="/"
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-1 text-[10px] font-medium transition-colors select-none',
            isHome ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Home className={cn('h-5 w-5', isHome ? 'text-primary' : 'text-muted-foreground')} />
          <span>Home</span>
        </Link>

        {/* 2. Browse / Collections */}
        <Link
          href="/#catalog"
          className="flex flex-col items-center justify-center gap-1 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors select-none"
        >
          <Compass className="h-5 w-5 text-muted-foreground" />
          <span>Catalog</span>
        </Link>

        {/* 3. Wishlist */}
        <Link
          href="/account/wishlist"
          onClick={(e) => {
            if (!user) {
              e.preventDefault();
              openAuthModal({ reason: 'Sign in to access your saved pieces.' });
            }
          }}
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-1 text-[10px] font-medium transition-colors select-none',
            isWishlist ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Heart
            className={cn(
              'h-5 w-5',
              isWishlist ? 'fill-primary text-primary' : 'text-muted-foreground'
            )}
          />
          <span>Wishlist</span>
        </Link>

        {/* 4. Cart / Bag */}
        <button
          type="button"
          onClick={openCart}
          className="relative flex flex-col items-center justify-center gap-1 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors select-none"
          aria-label={`Open shopping bag with ${totalItemCount} items`}
        >
          <div className="relative">
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
            {totalItemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                {totalItemCount}
              </span>
            )}
          </div>
          <span>Bag</span>
        </button>

        {/* 5. Account */}
        <button
          type="button"
          onClick={() => {
            if (!user) {
              openAuthModal({ reason: 'Sign in to access your orders and profile.' });
            }
          }}
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-1 text-[10px] font-medium transition-colors select-none',
            isAccount ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {user ? (
            <Link
              href="/account"
              className="flex flex-col items-center justify-center gap-1 text-[10px]"
            >
              <UserIcon
                className={cn('h-5 w-5', isAccount ? 'text-primary' : 'text-muted-foreground')}
              />
              <span>Account</span>
            </Link>
          ) : (
            <>
              <UserIcon className="h-5 w-5 text-muted-foreground" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </div>
    </nav>
  );
}
