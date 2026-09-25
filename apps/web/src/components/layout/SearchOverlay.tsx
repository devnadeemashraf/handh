'use client';

import { ArrowRight, ChevronRight, Loader2, Search, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useSearch } from '@/context/SearchContext';
import { cn } from '@/lib/utils';

import { type CurrencyCode, Money } from '@hh/domain';

interface SearchProduct {
  id: string;
  slug: string;
  title: string;
  department: string;
  categoryName?: string;
  startingPriceMinor: number;
  currency: CurrencyCode;
  primaryImageUrl: string | null;
}

interface SearchCategory {
  id: string;
  name: string;
  slug: string;
}

const POPULAR_SEARCHES = [
  'Silk Abaya',
  'Chiffon Hijab',
  'Embroidered Kimono',
  'Linen Kurti',
  'Gold Filigree Ring'
];

const EXPLORE_CATEGORIES = [
  { name: 'Abayas & Modest Wear', slug: 'abayas' },
  { name: 'Hijabs & Scarves', slug: 'hijabs' },
  { name: 'Fine Jewelry', slug: 'jewelry' },
  { name: 'Curated Sets', slug: 'sets' }
];

export function SearchOverlay() {
  const {
    isOpen,
    closeSearch,
    query,
    setQuery,
    recentSearches,
    addRecentSearch,
    removeRecentSearch
  } = useSearch();

  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [categories, setCategories] = useState<SearchCategory[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input automatically when opened
  useEffect(() => {
    if (!isOpen) {
      setProducts([]);
      setCategories([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Debounced search (200ms)
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setProducts([]);
      setCategories([]);
      setIsLoading(false);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
          setCategories(data.categories || []);
        } else {
          setProducts([]);
          setCategories([]);
        }
      } catch {
        setProducts([]);
        setCategories([]);
      } finally {
        setIsLoading(false);
        setHasSearched(true);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelectProduct = (product: SearchProduct) => {
    addRecentSearch(product.title);
    closeSearch();
    router.push(`/products/${product.slug}`);
  };

  const handleSelectCategory = (category: SearchCategory) => {
    addRecentSearch(category.name);
    closeSearch();
    router.push(`/?category=${category.slug}`);
  };

  const handleSelectChip = (term: string) => {
    setQuery(term);
    inputRef.current?.focus();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search catalog"
      className="fixed inset-0 z-50 flex items-start justify-center"
    >
      {/* Backdrop Scrim */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-180"
        onClick={closeSearch}
        data-testid="search-scrim"
      />

      {/* Main Container: Full screen on mobile (<768px), Centered 640px card on desktop (≥768px) */}
      <div
        className={cn(
          'relative z-10 flex flex-col bg-card shadow-md border-border overflow-hidden',
          // Mobile: full-screen
          'w-full h-full md:h-auto md:max-h-[85vh] md:w-[640px] md:mt-16 md:rounded-md md:border',
          'animate-in fade-in zoom-in-95 duration-180 ease-out'
        )}
      >
        {/* Search Header Row */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
          <div className="flex h-6 w-6 items-center justify-center text-secondary">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </div>

          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search collections, abayas, jewelry..."
            className="flex-1 bg-transparent text-sm sm:text-base font-sans text-primary placeholder:text-tertiary focus:outline-none"
            aria-label="Search query"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="flex h-8 w-8 items-center justify-center rounded-sm text-tertiary hover:text-primary transition-colors"
              aria-label="Clear query"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={closeSearch}
            className="rounded-sm border border-border px-2.5 py-1 text-xs font-medium text-secondary hover:text-primary hover:bg-muted transition-colors"
            aria-label="Close search"
          >
            <span className="hidden md:inline">Esc</span>
            <span className="md:hidden">Cancel</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Skeletons while typing and request in flight */}
          {isLoading && !products.length && !categories.length && (
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Skeleton className="h-36 rounded-sm" />
                <Skeleton className="h-36 rounded-sm" />
                <Skeleton className="h-36 rounded-sm" />
                <Skeleton className="h-36 rounded-sm" />
              </div>
            </div>
          )}

          {/* Empty Query State: Recents + Popular + 2x2 Categories */}
          {!query.trim() && (
            <>
              {/* 1. Recent Searches */}
              {recentSearches.length > 0 && (
                <section>
                  <h3 className="text-xs uppercase font-medium tracking-wider text-secondary mb-3">
                    Recent Searches
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((term) => (
                      <div
                        key={term}
                        className="inline-flex items-center gap-1.5 rounded-sm bg-muted pl-3 pr-1.5 py-1 text-xs text-primary transition-colors hover:bg-border-subtle"
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectChip(term)}
                          className="hover:underline"
                        >
                          {term}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSearch(term);
                          }}
                          className="p-0.5 text-tertiary hover:text-primary rounded-sm"
                          aria-label={`Remove recent search ${term}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* 2. Popular Searches */}
              <section>
                <h3 className="text-xs uppercase font-medium tracking-wider text-secondary mb-3">
                  Popular Searches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCHES.map((term) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleSelectChip(term)}
                      className="rounded-sm border border-border px-3 py-1 text-xs text-secondary hover:border-primary hover:text-primary transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </section>

              {/* 3. Explore Categories (2x2 Grid) */}
              <section>
                <h3 className="text-xs uppercase font-medium tracking-wider text-secondary mb-3">
                  Explore Collections
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {EXPLORE_CATEGORIES.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/?category=${cat.slug}`}
                      onClick={closeSearch}
                      className="group flex items-center justify-between rounded-sm border border-border p-3 hover:border-primary/50 hover:bg-muted transition-all"
                    >
                      <span className="text-xs font-medium text-primary group-hover:text-primary">
                        {cat.name}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-tertiary group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Active Search Results */}
          {query.trim() && (
            <>
              {/* Product Matches */}
              {products.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs uppercase font-medium tracking-wider text-secondary">
                      Pieces ({products.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {products.slice(0, 6).map((product) => {
                      const formattedPrice = Money.fromMinor(
                        product.startingPriceMinor,
                        product.currency
                      ).format();

                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => handleSelectProduct(product)}
                          className="group flex flex-col text-left rounded-sm border border-border p-2 hover:border-primary hover:shadow-sm transition-all bg-background"
                        >
                          <div className="relative aspect-square w-full overflow-hidden rounded-sm bg-muted mb-2">
                            {product.primaryImageUrl ? (
                              <Image
                                src={product.primaryImageUrl}
                                alt={product.title}
                                fill
                                sizes="(max-width: 768px) 50vw, 200px"
                                className="object-cover group-hover:scale-102 transition-transform duration-base"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center font-serif text-xs text-tertiary">
                                H&amp;H
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-medium text-primary line-clamp-1 group-hover:text-primary transition-colors">
                            {product.title}
                          </span>
                          <span className="text-xs font-serif font-medium text-secondary mt-0.5">
                            {formattedPrice}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Category / Collection Matches */}
              {categories.length > 0 && (
                <section className="pt-2 border-t border-border">
                  <h3 className="text-xs uppercase font-medium tracking-wider text-secondary mb-2">
                    Collections ({categories.length})
                  </h3>
                  <div className="divide-y divide-border-subtle">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleSelectCategory(category)}
                        className="group flex w-full items-center justify-between py-2.5 text-left text-xs font-medium text-primary hover:text-primary transition-colors"
                      >
                        <span>{category.name}</span>
                        <ChevronRight className="h-4 w-4 text-tertiary group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* No Results Found */}
              {!isLoading && hasSearched && products.length === 0 && categories.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-secondary mb-3">
                    <Search className="h-6 w-6" />
                  </div>
                  <h4 className="font-serif text-base font-semibold text-primary mb-1">
                    No results found
                  </h4>
                  <p className="text-xs text-secondary max-w-xs mb-4">
                    We couldn&apos;t find any pieces or collections matching &ldquo;{query}&rdquo;.
                    Try checking your spelling or explore our popular categories.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {EXPLORE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.slug}
                        type="button"
                        onClick={() => {
                          closeSearch();
                          router.push(`/?category=${cat.slug}`);
                        }}
                        className="rounded-sm border border-border px-3 py-1 text-xs text-secondary hover:border-primary hover:text-primary transition-colors"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
