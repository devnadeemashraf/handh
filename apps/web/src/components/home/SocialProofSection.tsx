import { Star } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface Testimonial {
  quote: string;
  author: string;
  location: string;
  rating: number;
  productName: string;
  imageUrl?: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'The drape of the silk abaya is incomparable. It holds its poise through whole evenings without creasing, and the French stitching is perfection.',
    author: 'Amina K.',
    location: 'Hyderabad',
    rating: 5,
    productName: 'Raw Silk Atelier Abaya',
    imageUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'
  },
  {
    quote:
      'Finding modest silhouettes with this level of quiet luxury and fabric integrity has been impossible until H&H. Truly bespoke quality.',
    author: 'Zoya R.',
    location: 'Bengaluru',
    rating: 5,
    productName: 'Giza Cotton Co-Ord Set',
    imageUrl:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80'
  },
  {
    quote:
      'The modesty magnetic pins hold through thick cashmere without leaving a single pinhole. Simple genius and impeccably packaged.',
    author: 'Fatima M.',
    location: 'Mumbai',
    rating: 5,
    productName: 'Hand-Cast Modesty Brooch',
    imageUrl:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80'
  }
];

export function SocialProofSection({ className }: { className?: string }) {
  return (
    <section
      aria-label="Patron Reflections and Reviews"
      className={cn('py-12 sm:py-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8', className)}
    >
      <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
        <p className="text-[11px] uppercase tracking-[0.25em] font-semibold text-accent mb-2">
          Patron Reflections
        </p>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          Loved for Quiet Distinction
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {TESTIMONIALS.map((item, idx) => (
          <div
            key={idx}
            className="flex flex-col justify-between p-6 sm:p-7 rounded-sm border border-border/60 bg-card/60"
          >
            <div>
              {/* Star Rating */}
              <div
                className="flex items-center gap-1 text-accent mb-4"
                aria-label="5 out of 5 stars"
              >
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current text-accent" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="font-serif text-sm sm:text-base text-foreground/90 italic leading-relaxed mb-6">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
            </div>

            {/* Author Attribution */}
            <div className="flex items-center gap-3 pt-4 border-t border-border/40">
              {item.imageUrl && (
                <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border/60">
                  <Image
                    src={item.imageUrl}
                    alt={item.author}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {item.author}
                  <span className="font-normal text-muted-foreground ml-1.5">
                    • {item.location}
                  </span>
                </p>
                <p className="text-[11px] text-accent/90">{item.productName}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
