import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { StorefrontHero } from '@hh/domain';

export function HeroSection({ hero }: { hero: StorefrontHero }) {
  const isCenter = hero.alignment !== 'left';

  const ctaButtonVariant = (
    hero.ctaVariant === 'gold' ? 'gold' : hero.ctaVariant === 'outline' ? 'outline' : 'default'
  ) as 'gold' | 'outline' | 'default';

  return (
    <section className="relative border-b border-border bg-gradient-to-b from-secondary/30 via-background to-background py-16 sm:py-24">
      <div
        className={cn(
          'mx-auto max-w-5xl px-4 sm:px-6 lg:px-8',
          isCenter ? 'text-center' : 'text-left'
        )}
      >
        {hero.badgeText && (
          <div className="mb-4">
            <Badge
              variant="gold"
              className="text-xs uppercase tracking-widest font-semibold px-3 py-1"
            >
              {hero.badgeText}
            </Badge>
          </div>
        )}

        {hero.eyebrow && (
          <p className="mb-3 text-xs uppercase tracking-[0.25em] font-semibold text-accent">
            {hero.eyebrow}
          </p>
        )}

        <h1 className="mb-6 font-serif text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-primary leading-[1.15]">
          {hero.title}
        </h1>

        <p
          className={cn(
            'mb-8 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl',
            isCenter && 'mx-auto'
          )}
        >
          {hero.subtitle}
        </p>

        <div>
          <Button
            asChild
            variant={ctaButtonVariant}
            size="lg"
            className="group rounded-full shadow-sm"
          >
            <Link href={hero.ctaLink} className="inline-flex items-center gap-2 font-medium">
              <span>{hero.ctaText}</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
