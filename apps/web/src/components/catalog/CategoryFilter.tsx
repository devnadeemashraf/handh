import Link from 'next/link';
import { cn } from '@/lib/utils';

import type { CategoryTreeItem } from '@hh/domain';

export function CategoryFilter({
  categories,
  activeCategory
}: {
  categories: CategoryTreeItem[];
  activeCategory?: string | undefined;
}) {
  const isAllActive = !activeCategory;

  // Flatten primary categories for quick tab selection
  const flatTabs = [{ slug: '', label: 'All Pieces' }];

  for (const cat of categories) {
    flatTabs.push({ slug: cat.slug, label: cat.name });
    for (const sub of cat.subcategories) {
      flatTabs.push({ slug: sub.slug, label: sub.name });
    }
  }

  return (
    <nav
      className="my-8 flex items-center justify-start sm:justify-center overflow-x-auto pb-2 scrollbar-none gap-2 px-1"
      aria-label="Category tabs"
    >
      {flatTabs.map((tab) => {
        const isActive = tab.slug === '' ? isAllActive : activeCategory === tab.slug;
        const href = tab.slug ? `/?category=${tab.slug}#catalog` : '/#catalog';

        return (
          <Link
            key={tab.slug}
            href={href}
            className={cn(
              'inline-flex shrink-0 items-center justify-center rounded-sm px-4 py-2 text-xs font-medium tracking-wider uppercase transition-all select-none min-h-[36px]',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'border border-border bg-card text-muted-foreground hover:text-foreground hover:border-input'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
