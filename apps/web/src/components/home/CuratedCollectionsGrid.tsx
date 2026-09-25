import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface CuratedCollectionItem {
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
}

const DEFAULT_COLLECTIONS: CuratedCollectionItem[] = [
  {
    name: 'Atelier Abayas',
    slug: 'abayas',
    description: 'Floor-sweeping drapes in weighted crepe and mulberry silk.',
    imageUrl:
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Chiffon & Silk Hijabs',
    slug: 'hijabs',
    description: 'Feather-light drapes with hand-rolled bespoke hems.',
    imageUrl:
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Modest Co-Ords',
    slug: 'co-ords',
    description: 'Contemporary two-piece sets tailored for relaxed sophistication.',
    imageUrl:
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Artisanal Accessories',
    slug: 'accessories',
    description: 'Hand-cast modesty pins, magnet brooches, and undercaps.',
    imageUrl:
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80'
  }
];

interface CuratedCollectionsGridProps {
  collections?: CuratedCollectionItem[];
  className?: string;
}

export function CuratedCollectionsGrid({
  collections = DEFAULT_COLLECTIONS,
  className
}: CuratedCollectionsGridProps) {
  return (
    <section
      aria-label="Curated Collections"
      className={cn('py-12 sm:py-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8', className)}
    >
      <div className="flex items-end justify-between mb-6 sm:mb-8">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] font-semibold text-accent mb-1.5">
            Wardrobe Architecture
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Curated Collections
          </h2>
        </div>
        <Link
          href="/shop"
          className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 group/link"
        >
          <span>All collections</span>
          <span className="transition-transform group-hover/link:translate-x-0.5">&rarr;</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        {collections.map((item) => (
          <Link
            key={item.slug}
            href={`/collections/${item.slug}`}
            className="group relative block overflow-hidden rounded-sm bg-muted aspect-[3/4] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            {/* Subtle Gradient Scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity group-hover:from-black/85" />

            {/* Typography Content Overlay */}
            <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-end text-white">
              <h3 className="font-serif text-base sm:text-lg font-normal tracking-tight text-white mb-1 group-hover:text-accent transition-colors">
                {item.name}
              </h3>
              <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed hidden sm:block mb-2">
                {item.description}
              </p>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-accent flex items-center gap-1">
                <span>Explore</span>
                <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
