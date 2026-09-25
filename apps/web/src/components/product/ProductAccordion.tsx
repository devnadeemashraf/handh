'use client';

import { CheckCircle2, Shield, Sparkles, Star, Truck } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
}

export interface ProductAccordionProps {
  description?: string | undefined;
  materials?: string | undefined;
  specifications?: Record<string, string | number | boolean> | undefined;
  categoryName?: string | undefined;
}

const SAMPLE_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    author: 'Amina K.',
    rating: 5,
    date: '3 weeks ago',
    title: 'Exquisite drape and weight',
    comment:
      'The finish and contour exceeded my expectations. It holds firmly in place all day without leaving marks or tearing delicate chiffon fabrics. Truly exceptional craftsmanship.',
    verified: true
  },
  {
    id: 'rev-2',
    author: 'Zainab M.',
    rating: 5,
    date: '1 month ago',
    title: 'Worth every rupee',
    comment:
      'Arrived carefully packaged with a handwritten note and velvet pouch. The metal plating has not tarnished despite humid weather. Will definitely be ordering the gold variant next.',
    verified: true
  },
  {
    id: 'rev-3',
    author: 'Farida S.',
    rating: 4,
    date: '2 months ago',
    title: 'Subtle and elegant',
    comment:
      'Very refined design that pairs seamlessly with both everyday work abayas and formal festive attire. Express shipping reached Bangalore in 3 days.',
    verified: true
  }
];

export function ProductAccordion({
  description,
  materials,
  specifications
}: ProductAccordionProps) {
  const [sizeUnit, setSizeUnit] = React.useState<'cm' | 'in'>('cm');
  const [visibleReviewCount, setVisibleReviewCount] = React.useState(2);

  const defaultDescription =
    description ||
    'Handcrafted with exacting balance and contour. Designed to integrate seamlessly with luxury abayas and modern modest silhouettes, providing effortless structural drape and understated distinction.';

  const defaultMaterials =
    materials ||
    (specifications?.['material'] as string) ||
    'Artisanal hand-finished brass alloy with 18k PVD gold plating. Hypoallergenic, nickel-free, and lead-free. Designed to prevent snagging on fine silks, medina silks, and sheer chiffons.';

  return (
    <div className="w-full max-w-[680px] mx-auto py-8">
      <Accordion
        type="multiple"
        defaultValue={['description']}
        className="w-full divide-y divide-border border-t border-b border-border"
      >
        {/* ================================================================= */}
        {/* 1. Description (Open by default, ≤68ch measure) */}
        {/* ================================================================= */}
        <AccordionItem value="description" className="border-none">
          <AccordionTrigger className="text-base font-semibold text-foreground hover:no-underline hover:text-primary py-5 select-none">
            Description &amp; Design Notes
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-muted-foreground pb-6 max-w-[68ch]">
            <p className="whitespace-pre-line">{defaultDescription}</p>
            {specifications && Object.keys(specifications).length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3 text-xs">
                {Object.entries(specifications).map(([key, val]) => (
                  <div key={key} className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="font-medium text-foreground">{String(val)}</span>
                  </div>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* ================================================================= */}
        {/* 2. Materials & Fabric */}
        {/* ================================================================= */}
        <AccordionItem value="materials" className="border-none">
          <AccordionTrigger className="text-base font-semibold text-foreground hover:no-underline hover:text-primary py-5 select-none">
            Materials &amp; Craftsmanship
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-muted-foreground pb-6 max-w-[68ch] space-y-3">
            <p>{defaultMaterials}</p>
            <div className="rounded-sm border border-border bg-muted/40 p-3 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Anti-Snag Guaranteed Guarantee</span>
              </div>
              <p className="text-muted-foreground">
                Each edge is micro-beveled and polished by hand to guarantee zero thread pulls on
                delicate fabrics including Mulberry Silk, Georgette, and Medina Chiffon.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ================================================================= */}
        {/* 3. Size Guide */}
        {/* ================================================================= */}
        <AccordionItem value="size-guide" className="border-none">
          <AccordionTrigger className="text-base font-semibold text-foreground hover:no-underline hover:text-primary py-5 select-none">
            <span className="flex items-center gap-2">
              <span>Size &amp; Fit Guide</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-muted-foreground pb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Body measurements for modest silhouette draping
                </span>
                <div className="inline-flex rounded-sm border border-border p-0.5 bg-muted">
                  <button
                    type="button"
                    onClick={() => setSizeUnit('cm')}
                    className={cn(
                      'px-2.5 py-0.5 text-[11px] font-medium rounded-sm transition-all',
                      sizeUnit === 'cm'
                        ? 'bg-card text-foreground shadow-xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    cm
                  </button>
                  <button
                    type="button"
                    onClick={() => setSizeUnit('in')}
                    className={cn(
                      'px-2.5 py-0.5 text-[11px] font-medium rounded-sm transition-all',
                      sizeUnit === 'in'
                        ? 'bg-card text-foreground shadow-xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    in
                  </button>
                </div>
              </div>

              {/* Measurement Table */}
              <div className="overflow-x-auto border border-border rounded-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/60 text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
                      <th className="py-2 px-3">Size</th>
                      <th className="py-2 px-3">Bust</th>
                      <th className="py-2 px-3">Waist</th>
                      <th className="py-2 px-3">Hips</th>
                      <th className="py-2 px-3">Length</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      { s: 'XS', b: [84, 33], w: [66, 26], h: [91, 36], l: [137, 54] },
                      { s: 'S', b: [89, 35], w: [71, 28], h: [96, 38], l: [140, 55] },
                      { s: 'M', b: [94, 37], w: [76, 30], h: [102, 40], l: [142, 56] },
                      { s: 'L', b: [102, 40], w: [84, 33], h: [109, 43], l: [145, 57] },
                      { s: 'XL', b: [110, 43], w: [92, 36], h: [117, 46], l: [147, 58] }
                    ].map((row) => (
                      <tr key={row.s} className="hover:bg-muted/30">
                        <td className="py-2 px-3 font-semibold text-foreground">{row.s}</td>
                        <td className="py-2 px-3 font-mono tabular-nums text-muted-foreground">
                          {sizeUnit === 'cm' ? `${row.b[0]} cm` : `${row.b[1]}″`}
                        </td>
                        <td className="py-2 px-3 font-mono tabular-nums text-muted-foreground">
                          {sizeUnit === 'cm' ? `${row.w[0]} cm` : `${row.w[1]}″`}
                        </td>
                        <td className="py-2 px-3 font-mono tabular-nums text-muted-foreground">
                          {sizeUnit === 'cm' ? `${row.h[0]} cm` : `${row.h[1]}″`}
                        </td>
                        <td className="py-2 px-3 font-mono tabular-nums text-muted-foreground">
                          {sizeUnit === 'cm' ? `${row.l[0]} cm` : `${row.l[1]}″`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ================================================================= */}
        {/* 4. Care Instructions */}
        {/* ================================================================= */}
        <AccordionItem value="care" className="border-none">
          <AccordionTrigger className="text-base font-semibold text-foreground hover:no-underline hover:text-primary py-5 select-none">
            Care &amp; Longevity
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-muted-foreground pb-6 max-w-[68ch]">
            <ul className="space-y-2 list-disc list-inside text-xs sm:text-sm">
              <li>
                Keep away from direct contact with alcohol perfumes, lotions, and chlorinated water.
              </li>
              <li>
                Gently wipe metal hardware with a clean, dry microfiber cloth after every wear.
              </li>
              <li>
                When washing accompanying fabrics, use gentle cold hand-wash with mild detergent;
                dry flat in shade.
              </li>
              <li>
                Always store inside the complimentary velvet keepsake pouch away from direct
                sunlight.
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* ================================================================= */}
        {/* 5. Shipping & Returns */}
        {/* ================================================================= */}
        <AccordionItem value="shipping" className="border-none">
          <AccordionTrigger className="text-base font-semibold text-foreground hover:no-underline hover:text-primary py-5 select-none">
            Shipping &amp; 7-Day Returns
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-muted-foreground pb-6 max-w-[68ch] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-sm border border-border p-3 bg-muted/30 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Truck className="h-4 w-4 text-primary" />
                  <span>Express Courier</span>
                </div>
                <p className="text-muted-foreground">
                  Dispatched within 24–48 hours. Delivered in 3–5 business days across India via
                  Speed Post / DTDC Express.
                </p>
              </div>

              <div className="rounded-sm border border-border p-3 bg-muted/30 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>7-Day Return Window</span>
                </div>
                <p className="text-muted-foreground">
                  Hassle-free exchange or store credit within 7 days of delivery for unworn items in
                  original packaging.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-primary">
              <Link href="/shipping" className="hover:underline">
                View Full Shipping Details &rarr;
              </Link>
              <Link href="/returns" className="hover:underline">
                Read Return Policy &rarr;
              </Link>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ================================================================= */}
        {/* 6. Customer Reviews */}
        {/* ================================================================= */}
        <AccordionItem value="reviews" id="reviews" className="border-none">
          <AccordionTrigger className="text-base font-semibold text-foreground hover:no-underline hover:text-primary py-5 select-none">
            <span className="flex items-center gap-2">
              <span>Customer Reviews</span>
              <span className="text-xs font-normal text-muted-foreground">(42)</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="text-sm leading-relaxed text-muted-foreground pb-6">
            {/* Reviews Summary Stats */}
            <div className="mb-6 rounded-sm border border-border bg-muted/30 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left border-b sm:border-b-0 sm:border-r border-border pb-3 sm:pb-0 sm:pr-4">
                  <span className="font-serif text-3xl font-bold text-foreground">4.9</span>
                  <div className="flex items-center gap-0.5 my-1 text-accent">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Based on 42 verified reviews
                  </span>
                </div>

                {/* Rating Distribution Bar Chart */}
                <div className="sm:col-span-2 space-y-1.5 text-xs">
                  {[
                    { star: 5, pct: 88 },
                    { star: 4, pct: 9 },
                    { star: 3, pct: 3 },
                    { star: 2, pct: 0 },
                    { star: 1, pct: 0 }
                  ].map((row) => (
                    <div key={row.star} className="flex items-center gap-2">
                      <span className="w-5 text-right font-mono text-[11px] text-muted-foreground">
                        {row.star}★
                      </span>
                      <div className="h-2 flex-1 rounded-sm bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-sm transition-all duration-slow"
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                      <span className="w-8 font-mono text-[11px] text-muted-foreground tabular-nums">
                        {row.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Individual Review Cards */}
            <div className="space-y-4">
              {SAMPLE_REVIEWS.slice(0, visibleReviewCount).map((rev) => (
                <div
                  key={rev.id}
                  className="rounded-sm border border-border p-4 bg-card space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted font-serif text-xs font-semibold text-foreground">
                        {rev.author.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground">{rev.author}</span>
                        {rev.verified && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex text-accent">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-accent text-accent" />
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground ml-1.5">{rev.date}</span>
                    </div>
                  </div>

                  <h5 className="text-xs font-semibold text-foreground">{rev.title}</h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>

            {/* Pagination / Show More */}
            {visibleReviewCount < SAMPLE_REVIEWS.length && (
              <div className="mt-4 text-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVisibleReviewCount(SAMPLE_REVIEWS.length)}
                  className="text-xs"
                >
                  Show More Reviews ({SAMPLE_REVIEWS.length - visibleReviewCount} remaining)
                </Button>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
