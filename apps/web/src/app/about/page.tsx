import Image from 'next/image';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { getCachedCategories, getCachedStore } from '@/lib/catalog-cache';

import type { Metadata } from 'next';

import { DEFAULT_BRAND_IDENTITY } from '@hh/domain';

export const metadata: Metadata = {
  title: `Our Story & Atelier Philosophy | ${DEFAULT_BRAND_IDENTITY.name}`,
  description:
    'Discover the origin of H&H. Rooted in the principle of Haya — modesty, grace, and deliberate craftsmanship without compromise.',
  alternates: {
    canonical: `${DEFAULT_BRAND_IDENTITY.websiteUrl}/about`
  }
};

export default async function AboutPage() {
  const store = await getCachedStore('hh');
  const categories = store ? await getCachedCategories(store.id) : [];

  return (
    <>
      <Header storeName={store?.name ?? DEFAULT_BRAND_IDENTITY.name} categories={categories} />

      <main className="min-h-screen pb-20">
        {/* 1. Opening Hero: Full-Bleed Editorial Visual + Evocative Line */}
        <section className="relative h-[65vh] min-h-[460px] max-h-[700px] w-full flex items-end overflow-hidden bg-zinc-950 text-white">
          <div
            className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-1000 scale-100 hover:scale-105"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=2000&q=85')"
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 text-center sm:text-left">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-3">
              The Origin &amp; The Philosophy
            </p>
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-tight max-w-3xl">
              Modesty is not an afterthought. It is the architecture of quiet elegance.
            </h1>
          </div>
        </section>

        {/* 2. Why the Brand Exists (Max 68ch Measure, Pure Typography) */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-border/40">
          <div className="mx-auto max-w-[68ch] space-y-6">
            <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-accent block">
              Why We Exist
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground font-normal tracking-tight leading-snug">
              Creating space for garments that honor faith and form in equal measure.
            </h2>
            <div className="space-y-4 text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
              <p>
                For generations, modest dressing was treated as a series of compromises: heavy
                layers added to silhouettes never designed for coverage, or uninspired garments made
                from synthetic fabrics that lacked breathability and grace.
              </p>
              <p>
                H&amp;H was founded with a singular conviction: modesty deserves the highest caliber
                of textile artistry. We craft wardrobe anchors that move with unhurried dignity,
                allowing women to embody their values without sacrificing aesthetic rigor.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Meaning Behind the Name: "Haya" */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-secondary/15 border-b border-border/40">
          <div className="mx-auto max-w-[68ch] space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm border border-accent/30 bg-accent/10 text-accent text-xs font-medium uppercase tracking-widest">
              The Etymology
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl text-foreground font-light tracking-tight">
              The Principle of <em>Haya</em>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
              The name H&amp;H originates from the timeless concept of <strong>Haya</strong> — an
              inner state of modesty, self-respect, and quiet mindfulness that transcends outward
              appearance. In our atelier, Haya is not merely modesty in coverage; it is restraint in
              design. It means eschewing loud logos, frantic trend cycles, and ephemeral novelties
              in favor of enduring fabric integrity, clean drape, and serene poise.
            </p>
          </div>
        </section>

        {/* 4. Design Philosophy & Visual Detail Grid (Desktop Alternating / Mobile Stacked) */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-border/40">
          <div className="mx-auto max-w-5xl space-y-16 sm:space-y-24">
            {/* Block A: Image Left, Copy Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-muted">
                <Image
                  src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1000&q=80"
                  alt="Textile examination and hand fabric cutting"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <div className="space-y-4 max-w-[68ch]">
                <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-accent block">
                  Material Sourcing
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-foreground font-normal tracking-tight">
                  Fabrics That Breathe and Flow
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
                  We reject polyester blends that trap heat and cling unflatteringly. Every piece
                  begins with pure natural fibers: Grade-6A Mulberry silk with a substantial
                  22-momme weight, long-staple Egyptian Giza cotton, and sustainably harvested modal
                  that drapes like liquid shadow.
                </p>
              </div>
            </div>

            {/* Block B: Copy Left, Image Right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center md:flex-row-reverse">
              <div className="space-y-4 max-w-[68ch] order-2 md:order-1">
                <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-accent block">
                  Atelier Craftsmanship
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl text-foreground font-normal tracking-tight">
                  Single-Needle Precision &amp; French Hems
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
                  Our artisans finish each garment with fully enclosed French seams so there are no
                  raw threads or abrasive stitching against sensitive skin. Hems are turned and
                  hand-guided, ensuring a clean, unweighted hang that glides effortlessly when you
                  walk.
                </p>
              </div>
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-muted order-1 md:order-2">
                <Image
                  src="https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1000&q=80"
                  alt="Precision needlework and stitching details"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 5. Founder & Atelier Story */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-border/40 bg-card/40">
          <div className="mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 items-center">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm bg-muted md:col-span-1">
              <Image
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
                alt="Atelier director and founder"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="md:col-span-2 space-y-4 max-w-[68ch]">
              <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-accent block">
                Atelier Heritage
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-foreground font-normal tracking-tight">
                Rooted in Heritage, Refined for Today
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
                Founded in Hyderabad — a historic cradle of Nawabi textile craftsmanship and fine
                embroidery — H&amp;H was born from a family legacy of master drapers. We blend
                centuries-old textile wisdom with contemporary minimal tailoring, creating pieces
                that feel timeless from the moment you unpack them.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Commitment & Shop Collection Return CTA */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto max-w-xl space-y-6">
            <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-accent block">
              Our Promise
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground font-normal tracking-tight">
              Garments Made to Be Lived In
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-light">
              Every piece undergoes exhaustive fit testing, fabric stability inspection, and
              colorfast certification before it earns the H&amp;H seal. We invite you to experience
              the difference of deliberate modest luxury.
            </p>
            <div className="pt-4">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-sm border-foreground/30 hover:border-foreground px-8 h-12 text-xs uppercase tracking-widest font-semibold"
              >
                <Link href="/shop">Shop the Collection</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer
        storeName={store?.name ?? DEFAULT_BRAND_IDENTITY.name}
        instagramHandle={store?.settings.instagramHandle}
      />
    </>
  );
}
