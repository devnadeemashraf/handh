'use client';

import { ChevronDown, ChevronLeft, Heart, Search } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useSearch } from '@/context/SearchContext';
import { cn } from '@/lib/utils';

import { type CategoryTreeItem, DEFAULT_BRAND_IDENTITY } from '@hh/domain';

import { HeaderCartButton } from './HeaderCartButton';
import { HeaderUserButton } from './HeaderUserButton';

export interface HeaderProps {
  storeName?: string;
  categories?: CategoryTreeItem[];
}

export function Header({ storeName = DEFAULT_BRAND_IDENTITY.name, categories = [] }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { openSearch } = useSearch();

  // Scroll listener for border-on-scroll (transparent at scroll 0, 1px border-border-subtle after 32px)
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 32);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine if on mobile root screen (no back chevron needed on mobile bottom-nav root tabs)
  const isMobileRoot =
    pathname === '/' ||
    pathname === '/shop' ||
    pathname === '/account/wishlist' ||
    pathname === '/account';

  const isShopActive = pathname === '/shop';
  const isAboutActive = pathname === '/about';

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full bg-canvas/95 backdrop-blur-md transition-[border-color,box-shadow,background-color] duration-180 ease-out supports-[backdrop-filter]:bg-canvas/85',
        isScrolled
          ? 'border-b border-border-subtle shadow-elevation-1'
          : 'border-b border-transparent shadow-none'
      )}
    >
      <div className="mx-auto flex h-16 sm:h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Section: Mobile Back Chevron (if non-root) or Desktop Brand Logotype */}
        <div className="flex items-center gap-3">
          {/* Mobile Back Button for non-root screens */}
          {!isMobileRoot && (
            <button
              type="button"
              onClick={() => router.back()}
              className="flex md:hidden h-11 w-11 items-center justify-center -ml-2 rounded-sm text-secondary hover:text-primary active:scale-95 transition-all"
              aria-label="Go back"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Brand Logotype */}
          <Link href="/" className="inline-flex flex-col items-start group">
            <span className="font-serif text-xl sm:text-2xl font-semibold tracking-wider text-primary group-hover:opacity-90 transition-opacity">
              {storeName}
            </span>
            <span className="-mt-1 text-[0.6rem] uppercase tracking-[0.22em] text-secondary font-medium">
              Curated Essentials
            </span>
          </Link>
        </div>

        {/* Center-Left Section: Desktop Navigation Links (≥ 768px) */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {/* 1. Shop All */}
          <Link
            href="/shop"
            className={cn(
              'relative py-1 text-xs uppercase font-medium tracking-widest text-secondary hover:text-primary transition-colors',
              "after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-royal after:transition-all after:duration-180",
              isShopActive ? 'text-primary after:w-full' : 'after:w-0 hover:after:w-full'
            )}
          >
            Shop
          </Link>

          {/* 2. Collections Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                'group flex items-center gap-1 py-1 text-xs uppercase font-medium tracking-widest text-secondary hover:text-primary transition-colors focus-visible:outline-none',
                "relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-royal after:transition-all after:duration-180 after:w-0 hover:after:w-full"
              )}
            >
              <span>Collections</span>
              <ChevronDown className="h-3 w-3 text-tertiary group-hover:text-primary transition-transform duration-180 group-data-[state=open]:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-52 p-1.5 bg-surface border-border-subtle shadow-elevation-2 rounded-sm"
            >
              <DropdownMenuItem asChild>
                <Link
                  href="/collections/new-arrivals"
                  className="flex items-center justify-between px-3 py-2 text-xs font-medium text-primary rounded-sm hover:bg-sunken cursor-pointer"
                >
                  <span>New Arrivals</span>
                </Link>
              </DropdownMenuItem>
              {categories.slice(0, 6).map((cat) => (
                <DropdownMenuItem key={cat.id} asChild>
                  <Link
                    href={`/?category=${cat.slug}`}
                    className="flex items-center justify-between px-3 py-2 text-xs font-medium text-primary rounded-sm hover:bg-sunken cursor-pointer"
                  >
                    <span>{cat.name}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 3. Editorial About */}
          <Link
            href="/about"
            className={cn(
              'relative py-1 text-xs uppercase font-medium tracking-widest text-secondary hover:text-primary transition-colors',
              "after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:bg-royal after:transition-all after:duration-180",
              isAboutActive ? 'text-primary after:w-full' : 'after:w-0 hover:after:w-full'
            )}
          >
            About
          </Link>
        </nav>

        {/* Right Actions: Search (desktop), Wishlist (desktop), User (desktop), Cart (mobile + desktop) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Desktop Search Button */}
          <button
            type="button"
            onClick={openSearch}
            className="hidden md:inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm p-2 text-secondary hover:text-primary hover:bg-sunken transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal"
            aria-label="Search catalog (Cmd+K)"
          >
            <Search className="h-5 w-5" strokeWidth={1.8} />
          </button>

          {/* Desktop Wishlist Button */}
          <Link
            href="/account/wishlist"
            className="hidden md:inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm p-2 text-secondary hover:text-primary hover:bg-sunken transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal"
            aria-label="Saved Wishlist"
          >
            <Heart className="h-5 w-5" strokeWidth={1.8} />
          </Link>

          {/* Desktop Account Button */}
          <div className="hidden md:block">
            <HeaderUserButton />
          </div>

          {/* Cart Button: Always present on both mobile and desktop per design spec */}
          <HeaderCartButton />
        </div>
      </div>
    </header>
  );
}
