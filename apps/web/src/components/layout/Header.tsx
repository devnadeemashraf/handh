import Link from 'next/link';

import type { CategoryTreeItem } from '@hh/domain';

import { HeaderCartButton } from './HeaderCartButton';
import { HeaderUserButton } from './HeaderUserButton';

export function Header({
  storeName,
  categories
}: {
  storeName: string;
  categories: CategoryTreeItem[];
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 sm:h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Navigation Categories (Desktop) */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          <Link
            href="/"
            className="text-xs uppercase font-medium tracking-widest text-foreground transition-colors hover:text-accent"
          >
            All Collections
          </Link>
          {categories.slice(0, 3).map((cat) => (
            <Link
              key={cat.id}
              href={`/?category=${cat.slug}`}
              className="text-xs uppercase font-medium tracking-widest text-muted-foreground transition-colors hover:text-foreground"
            >
              {cat.name}
            </Link>
          ))}
        </nav>

        {/* Central Brand Identity */}
        <div className="text-center">
          <Link href="/" className="inline-flex flex-col items-center group">
            <span className="font-serif text-2xl sm:text-3xl font-semibold tracking-wider text-primary group-hover:opacity-95 transition-opacity">
              {storeName}
            </span>
            <span className="-mt-1 text-[0.6rem] uppercase tracking-[0.25em] text-accent font-medium">
              Curated Essentials
            </span>
          </Link>
        </div>

        {/* Right Actions: User Account + Bag */}
        <div className="flex items-center gap-2 sm:gap-4">
          <HeaderUserButton />
          <HeaderCartButton />
        </div>
      </div>
    </header>
  );
}
