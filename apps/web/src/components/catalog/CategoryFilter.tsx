import Link from 'next/link';
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
  const flatTabs = [{ slug: '', label: 'All Collections' }];

  for (const cat of categories) {
    flatTabs.push({ slug: cat.slug, label: cat.name });
    for (const sub of cat.subcategories) {
      flatTabs.push({ slug: sub.slug, label: sub.name });
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        margin: '40px 0 32px'
      }}
    >
      {flatTabs.map((tab) => {
        const isActive = tab.slug === '' ? isAllActive : activeCategory === tab.slug;
        const href = tab.slug ? `/?category=${tab.slug}#catalog` : '/#catalog';

        return (
          <Link
            key={tab.slug}
            href={href}
            style={{
              display: 'inline-block',
              padding: '8px 18px',
              fontSize: '0.85rem',
              fontWeight: 500,
              letterSpacing: '0.04em',
              borderRadius: '9999px',
              border: '1px solid',
              borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border)',
              backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-surface)',
              color: isActive ? '#ffffff' : 'var(--color-text)',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
