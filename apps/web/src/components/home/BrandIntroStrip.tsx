import Link from 'next/link';
import { cn } from '@/lib/utils';

interface BrandIntroStripProps {
  sentence?: string;
  className?: string;
}

export function BrandIntroStrip({
  sentence = 'Honoring modest tradition through deliberate craftsmanship, natural textiles, and quiet luxury.',
  className
}: BrandIntroStripProps) {
  return (
    <section
      aria-label="Brand Philosophy Pause"
      className={cn(
        'w-full py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-border/40',
        className
      )}
    >
      <div className="mx-auto max-w-3xl text-center space-y-5 sm:space-y-6">
        <p className="font-serif text-xl sm:text-2xl md:text-3xl text-foreground font-normal leading-relaxed tracking-tight">
          &ldquo;{sentence}&rdquo;
        </p>
        <div>
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-accent hover:text-accent/80 transition-colors uppercase tracking-[0.2em] border-b border-accent/40 pb-0.5 hover:border-accent"
          >
            <span>Read our story</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
