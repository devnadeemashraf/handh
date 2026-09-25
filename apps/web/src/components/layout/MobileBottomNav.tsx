'use client';

import { Compass, Heart, Home, Search, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearch } from '@/context/SearchContext';
import { triggerHaptic } from '@/lib/haptic';
import { cn } from '@/lib/utils';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, openAuthModal } = useAuth();
  const { openSearch, isOpen: isSearchOpen } = useSearch();

  // Hide mobile nav in admin portal
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const isHome = pathname === '/';
  const isShop = pathname === '/shop' || pathname.startsWith('/shop');
  const isWishlist = pathname === '/account/wishlist';
  const isAccount = pathname.startsWith('/account') && !isWishlist;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-subtle bg-surface/95 backdrop-blur-md pb-safe md:hidden shadow-elevation-1 supports-[backdrop-filter]:bg-surface/85"
      aria-label="Mobile Navigation Bar"
    >
      <div className="grid h-14 grid-cols-5 items-center px-1">
        {/* 1. Home */}
        <Link
          href="/"
          onClick={() => triggerHaptic('selection')}
          className={cn(
            'flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 py-1 text-[10px] uppercase tracking-wider font-medium transition-all duration-150 active:scale-95 select-none',
            isHome ? 'text-royal font-semibold' : 'text-secondary hover:text-primary'
          )}
          aria-label="Home"
        >
          <Home
            className={cn(
              'h-5 w-5',
              isHome ? 'text-royal fill-royal/10 stroke-[2.2]' : 'text-secondary'
            )}
          />
          <span>Home</span>
        </Link>

        {/* 2. Shop */}
        <Link
          href="/shop"
          onClick={() => triggerHaptic('selection')}
          className={cn(
            'flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 py-1 text-[10px] uppercase tracking-wider font-medium transition-all duration-150 active:scale-95 select-none',
            isShop ? 'text-royal font-semibold' : 'text-secondary hover:text-primary'
          )}
          aria-label="Shop"
        >
          <Compass
            className={cn(
              'h-5 w-5',
              isShop ? 'text-royal fill-royal/10 stroke-[2.2]' : 'text-secondary'
            )}
          />
          <span>Shop</span>
        </Link>

        {/* 3. Search */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            openSearch();
          }}
          className={cn(
            'flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 py-1 text-[10px] uppercase tracking-wider font-medium transition-all duration-150 active:scale-95 select-none',
            isSearchOpen ? 'text-royal font-semibold' : 'text-secondary hover:text-primary'
          )}
          aria-label="Search catalog"
        >
          <Search
            className={cn('h-5 w-5', isSearchOpen ? 'text-royal stroke-[2.5]' : 'text-secondary')}
          />
          <span>Search</span>
        </button>

        {/* 4. Wishlist */}
        <Link
          href="/account/wishlist"
          onClick={(e) => {
            triggerHaptic('selection');
            if (!user) {
              e.preventDefault();
              openAuthModal({ reason: 'Sign in to access your saved pieces.' });
            }
          }}
          className={cn(
            'flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 py-1 text-[10px] uppercase tracking-wider font-medium transition-all duration-150 active:scale-95 select-none',
            isWishlist ? 'text-royal font-semibold' : 'text-secondary hover:text-primary'
          )}
          aria-label="Wishlist"
        >
          <Heart
            className={cn('h-5 w-5', isWishlist ? 'fill-royal text-royal' : 'text-secondary')}
          />
          <span>Wishlist</span>
        </Link>

        {/* 5. Account: Conditional Link vs Button to eliminate <a> inside <button> */}
        {user ? (
          <Link
            href="/account"
            onClick={() => triggerHaptic('selection')}
            className={cn(
              'flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 py-1 text-[10px] uppercase tracking-wider font-medium transition-all duration-150 active:scale-95 select-none',
              isAccount ? 'text-royal font-semibold' : 'text-secondary hover:text-primary'
            )}
            aria-label="Account"
          >
            <UserIcon
              className={cn('h-5 w-5', isAccount ? 'text-royal stroke-[2.5]' : 'text-secondary')}
            />
            <span>Account</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              openAuthModal({ reason: 'Sign in to access your orders and profile.' });
            }}
            className={cn(
              'flex flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 py-1 text-[10px] uppercase tracking-wider font-medium transition-all duration-150 active:scale-95 select-none text-secondary hover:text-primary'
            )}
            aria-label="Sign In"
          >
            <UserIcon className="h-5 w-5 text-secondary" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </nav>
  );
}

// Named alias for backward compatibility
export const MobileNav = MobileBottomNav;
