import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { StorefrontHero } from '@hh/domain';

interface EditorialHeroProps {
  hero?: StorefrontHero | undefined;
  className?: string;
}

export function EditorialHero({ hero, className }: EditorialHeroProps) {
  const title = hero?.title || 'Quiet Grace in Every Thread';
  const eyebrow = hero?.eyebrow || 'Artisanal Atelier — Autumn / Winter 2026';
  const subtitle =
    hero?.subtitle ||
    'Handcrafted modest luxury shaped by pure mulberry silks, meticulous French seams, and enduring silhouettes.';
  const ctaText = hero?.ctaText || 'Shop the Collection';
  const ctaLink = hero?.ctaLink || '/shop';

  return (
    <section
      aria-label="Editorial Campaign Hero"
      className={cn(
        'relative w-full h-[85vh] min-h-[580px] max-h-[880px] flex flex-col justify-end overflow-hidden bg-zinc-950 text-white',
        className
      )}
    >
      {/* Background Editorial Media with Calm Negative Space */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-100 hover:scale-105"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=2000&q=85')"
        }}
      >
        {/* Editorial Vignette & Legibility Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />
      </div>

      {/* Hero Content Anchored in Whitespace/Negative Space */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 flex flex-col items-start justify-end">
        {eyebrow && (
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-3 sm:mb-4">
            {eyebrow}
          </p>
        )}

        <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-[1.12] max-w-2xl mb-4">
          {title}
        </h1>

        <p className="text-sm sm:text-base text-zinc-200/90 font-light leading-relaxed max-w-lg mb-8 sm:mb-10">
          {subtitle}
        </p>

        {/* Primary CTA Anchored space-6 (24px) from Section Baseline */}
        <div>
          <Button
            asChild
            variant="default"
            size="lg"
            className="rounded-sm bg-white text-zinc-950 hover:bg-zinc-100 font-medium px-8 h-12 text-sm shadow-md transition-all active:scale-[0.99]"
          >
            <Link href={ctaLink}>{ctaText}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
