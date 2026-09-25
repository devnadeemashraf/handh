import { ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import Link from 'next/link';
import { LegalPageShell } from '@/components/legal/LegalPageShell';
import { Button } from '@/components/ui/button';
import { getCachedCategories, getCachedStore } from '@/lib/catalog-cache';

import type { Metadata } from 'next';

import { DEFAULT_BRAND_IDENTITY } from '@hh/domain';

export const metadata: Metadata = {
  title: `Shipping & Delivery Guide | ${DEFAULT_BRAND_IDENTITY.name}`,
  description:
    'Domestic delivery timelines, rate tables, insured express couriers, and dispatch protocols from our Hyderabad atelier.',
  alternates: {
    canonical: `${DEFAULT_BRAND_IDENTITY.websiteUrl}/shipping`
  }
};

const SHIPPING_RATES = [
  {
    region: 'Hyderabad & Telangana (Local)',
    transitDays: '1 – 2 Business Days',
    standardCost: 'Complimentary',
    expressCost: '₹150'
  },
  {
    region: 'Metros (Delhi, Mumbai, Bengaluru, Chennai, Kolkata)',
    transitDays: '2 – 3 Business Days',
    standardCost: 'Complimentary',
    expressCost: '₹200'
  },
  {
    region: 'Rest of India (Tier 1 & Tier 2 Cities)',
    transitDays: '3 – 5 Business Days',
    standardCost: 'Complimentary',
    expressCost: '₹250'
  },
  {
    region: 'Special Regions (North East, J&K, Island Territories)',
    transitDays: '5 – 7 Business Days',
    standardCost: 'Complimentary',
    expressCost: '₹350'
  }
];

const SECTIONS = [
  { id: 'process', label: 'Shipping Process' },
  { id: 'timelines', label: 'Delivery Timelines & Rates' },
  { id: 'locations', label: 'Delivery Locations' },
  { id: 'tracking', label: 'Parcel Tracking' },
  { id: 'charges', label: 'Shipping Charges' },
  { id: 'delays', label: 'Weather & Transit Delays' },
  { id: 'failed', label: 'Failed Delivery & NDR' }
];

export default async function ShippingPage() {
  const store = await getCachedStore('hh');
  const categories = store ? await getCachedCategories(store.id) : [];

  return (
    <LegalPageShell
      title="Shipping & Delivery Guide"
      subtitle="Transparent transit schedules, insured express fulfillment, and rate structures across India."
      badgeText="Nationwide Express Courier"
      lastUpdated="September 2026"
      storeName={store?.name ?? DEFAULT_BRAND_IDENTITY.name}
      categories={categories}
      instagramHandle={store?.settings.instagramHandle}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 not-prose">
        {/* Sticky Desktop Jump-Nav Anchor List (Spec 10.4) */}
        <aside className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 rounded-sm border border-border bg-card/60 p-4 space-y-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-accent block px-2 pb-1 border-b border-border/60">
              Jump To Section
            </span>
            <nav className="flex flex-col space-y-1 text-xs text-muted-foreground">
              {SECTIONS.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  className="px-2 py-1.5 rounded-sm hover:text-foreground hover:bg-secondary/40 transition-colors"
                >
                  {sec.label}
                </a>
              ))}
            </nav>
            <div className="pt-2 border-t border-border/60">
              <Link
                href="/track"
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 px-2"
              >
                <span>Track an Order</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </aside>

        {/* Structured Scannable Content (Spec 10.4) */}
        <div className="lg:col-span-3 space-y-10">
          {/* Quick Track Card */}
          <div className="rounded-sm border border-border/80 bg-secondary/15 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-accent/10 text-accent">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-semibold text-foreground">
                  Already Placed an Order?
                </h3>
                <p className="text-xs text-muted-foreground">
                  Enter your order number on our live tracking dashboard for real-time milestones.
                </p>
              </div>
            </div>
            <Button asChild size="sm" className="rounded-sm text-xs shrink-0">
              <Link href="/track">Track Shipment</Link>
            </Button>
          </div>

          {/* 1. Shipping Process */}
          <section id="process" className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              1. Shipping Process
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-light">
              Every garment is individually inspected for seam integrity and fabric flaws before
              being packed in our breathable atelier presentation box with protective tissue. Orders
              are dispatched from our Hyderabad studio within{' '}
              <strong>24 to 48 business hours</strong> of order confirmation.
            </p>
          </section>

          {/* 2. Numeric Rates & Timeline Table */}
          <section id="timelines" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-foreground">
                2. Delivery Timelines &amp; Rates
              </h2>
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Complimentary Standard Shipping</span>
              </span>
            </div>
            <div className="overflow-x-auto rounded-sm border border-border">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-secondary/40 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  <tr>
                    <th className="p-3.5">Region</th>
                    <th className="p-3.5">Estimated Transit</th>
                    <th className="p-3.5">Standard Rate</th>
                    <th className="p-3.5">Express Air</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card/40">
                  {SHIPPING_RATES.map((row, i) => (
                    <tr key={i} className="hover:bg-secondary/20 transition-colors">
                      <td className="p-3.5 font-medium text-foreground">{row.region}</td>
                      <td className="p-3.5 text-muted-foreground">{row.transitDays}</td>
                      <td className="p-3.5 text-emerald-400 font-medium">{row.standardCost}</td>
                      <td className="p-3.5 text-muted-foreground">{row.expressCost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 3. Delivery Locations */}
          <section id="locations" className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              3. Delivery Locations
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-light">
              We service over 26,000 pin codes across India through Tier-1 courier partners:
              Bluedart, Delhivery, DTDC, and India Post Speed Post for remote military and rural
              addresses.
            </p>
          </section>

          {/* 4. Tracking */}
          <section id="tracking" className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              4. Real-Time Consignment Tracking
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-light">
              Once handed over to the courier, you receive an automated SMS and email containing
              your tracking AWB number. You can monitor the 6-stage delivery progression at{' '}
              <Link href="/track" className="text-accent underline font-medium">
                /track
              </Link>{' '}
              without needing third-party courier websites.
            </p>
          </section>

          {/* 5. Shipping Charges */}
          <section id="charges" className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              5. Transparent Shipping Charges
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-light">
              All prepaid orders across India enjoy 100% free standard express shipping. There are
              zero hidden handling surcharges or packaging fees at checkout.
            </p>
          </section>

          {/* 6. Delays */}
          <section id="delays" className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              6. Weather &amp; Transit Delays
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-light">
              During festive social drop spikes or severe regional weather disruptions, transit can
              experience 24-48 hour extensions. Our operations desk proactively monitors delayed
              AWBs and escalates directly with carrier hubs.
            </p>
          </section>

          {/* 7. Failed Delivery */}
          <section id="failed" className="space-y-3">
            <h2 className="font-serif text-xl font-semibold text-foreground">
              7. Non-Delivery Reports (NDR) &amp; Attempts
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-light">
              Couriers perform 3 consecutive delivery attempts and initiate phone contact prior to
              arrival. In the event of an unsuccessful attempt, an automated WhatsApp prompt is
              triggered allowing you to reschedule pickup or rectify address landmark details.
            </p>
          </section>
        </div>
      </div>
    </LegalPageShell>
  );
}
