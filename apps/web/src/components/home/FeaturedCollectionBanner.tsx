import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FeaturedCollectionBannerProps {
  collectionName?: string;
  tagline?: string;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
  imageUrl?: string;
  className?: string;
}

export function FeaturedCollectionBanner({
  collectionName = 'The Silk Reverie Edit',
  tagline = 'Seasonal Curation',
  description = 'Fluid mulberry silks drape effortlessly in modest silhouettes engineered with French seams and understated opulence.',
  ctaText = 'Explore the Edit',
  ctaHref = '/collections/silk-reverie',
  imageUrl = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1800&q=85',
  className
}: FeaturedCollectionBannerProps) {
  return (
    <section
      aria-label="Featured Collection Banner"
      className={cn('my-12 sm:my-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8', className)}
    >
      <div className="relative overflow-hidden rounded-sm bg-zinc-950 text-white min-h-[420px] sm:min-h-[500px] flex items-center">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: `url('${imageUrl}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent sm:w-2/3" />
        </div>

        {/* Content Box */}
        <div className="relative z-10 p-6 sm:p-12 md:p-16 max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.25em] font-semibold text-accent mb-2">
            {tagline}
          </p>
          <h2 className="font-serif text-2xl sm:text-4xl font-light tracking-tight text-white mb-4">
            {collectionName}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-8 max-w-md">
            {description}
          </p>
          <div>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-sm border-white/60 bg-white/10 backdrop-blur-sm text-white hover:bg-white hover:text-zinc-950 font-medium px-6 h-11 text-xs uppercase tracking-wider"
            >
              <Link href={ctaHref}>{ctaText}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
