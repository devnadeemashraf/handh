import { Gem, Scissors, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CraftPillar {
  icon: typeof Gem;
  title: string;
  description: string;
}

const PILLARS: CraftPillar[] = [
  {
    icon: Gem,
    title: 'Considered Fabrics',
    description:
      'Pure Grade-6A Mulberry Silk, Egyptian Giza Cotton, and certified sustainable Lenzing Modal.'
  },
  {
    icon: Scissors,
    title: 'Finished by Hand',
    description:
      'Double-stitched stress points, hand-rolled French hems, and artisanal single-needle tailoring.'
  },
  {
    icon: ShieldCheck,
    title: 'Made to Endure',
    description:
      'Colorfast, preshrunk weaves designed for lifetime elegance and daily ease without pilling.'
  }
];

export function CraftsmanshipStrip({ className }: { className?: string }) {
  return (
    <section
      aria-label="Craftsmanship and Quality Pillars"
      className={cn(
        'my-12 sm:my-16 border-y border-border/60 bg-secondary/20 py-12 sm:py-16',
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-4 p-5 rounded-sm border border-border/40 bg-card/40"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-accent/10 border border-accent/20 text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-foreground tracking-tight mb-1.5">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
