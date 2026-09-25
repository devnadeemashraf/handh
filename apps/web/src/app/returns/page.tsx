import { ArrowRight, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { LegalPageShell } from '@/components/legal/LegalPageShell';
import { Button } from '@/components/ui/button';
import { getCachedCategories, getCachedStore } from '@/lib/catalog-cache';

import type { Metadata } from 'next';

import { DEFAULT_BRAND_IDENTITY } from '@hh/domain';

export const metadata: Metadata = {
  title: `Returns & Exchanges Policy | ${DEFAULT_BRAND_IDENTITY.name}`,
  description:
    '7-day hassle-free return window, 4-step reverse logistics guide, exchange eligibility, and instant refund protocols.',
  alternates: {
    canonical: `${DEFAULT_BRAND_IDENTITY.websiteUrl}/returns`
  }
};

const RETURN_STEPS = [
  {
    step: '01',
    title: 'Initiate Return Online',
    description:
      'Log into your Patron Account, navigate to your Order History, and select "Request Return / Exchange" beside the item.'
  },
  {
    step: '02',
    title: 'Pack With Atelier Tags Attached',
    description:
      'Place the unworn piece back into its protective polybag and original presentation box with all security ribbons intact.'
  },
  {
    step: '03',
    title: 'Complimentary Doorstep Pickup',
    description:
      'Our courier partner (Bluedart/Delhivery) will collect the parcel from your registered shipping address within 24-48 hours.'
  },
  {
    step: '04',
    title: 'Inspection & Instant Refund',
    description:
      'Upon passing physical quality verification at our Hyderabad atelier, your refund is credited to your original payment method in 3-5 business days.'
  }
];

export default async function ReturnsPage() {
  const store = await getCachedStore('hh');
  const categories = store ? await getCachedCategories(store.id) : [];

  return (
    <LegalPageShell
      title="Returns & Exchanges Policy"
      subtitle="Experience seamless, dignified reverse logistics. We offer a 7-day complimentary return and size exchange window on all eligible collection pieces."
      badgeText="7-Day Complimentary Returns"
      lastUpdated="September 2026"
      storeName={store?.name ?? DEFAULT_BRAND_IDENTITY.name}
      categories={categories}
      instagramHandle={store?.settings.instagramHandle}
    >
      <div className="space-y-10 not-prose">
        {/* Fast Action Card: Primary "Start a Return" CTA (Spec 10.5) */}
        <div className="rounded-sm border border-border/80 bg-secondary/15 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-accent block">
              Self-Serve Return Portal
            </span>
            <h2 className="font-serif text-lg sm:text-xl font-semibold text-foreground">
              Ready to Initiate a Return or Size Exchange?
            </h2>
            <p className="text-xs text-muted-foreground max-w-lg">
              Skip the long policy read. If you already have your order number, jump directly into
              your order history to request an automated courier pickup.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button asChild size="default" className="rounded-sm text-xs font-semibold px-6">
              <Link href="/account/orders" className="inline-flex items-center gap-2">
                <span>Start a Return</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="default" className="rounded-sm text-xs">
              <Link href="/track">Track Return Status</Link>
            </Button>
          </div>
        </div>

        {/* 1. Eligibility & Time Limits */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl font-semibold text-foreground">
            1. Eligibility &amp; Time Limits
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-sm border border-border bg-card/60 p-4 space-y-1.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                <span>7-Day Return Window</span>
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Returns and exchanges must be requested within <strong>7 calendar days</strong> from
                the recorded delivery timestamp provided by our courier partner.
              </p>
            </div>
            <div className="rounded-sm border border-border bg-card/60 p-4 space-y-1.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero Reverse Shipping Fees</span>
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We provide 100% complimentary reverse courier pickup across all serviceable domestic
                pin codes in India.
              </p>
            </div>
          </div>
        </section>

        {/* 2. Numbered 4-Step Process Guide (Spec 10.5) */}
        <section className="space-y-6">
          <div>
            <h2 className="font-serif text-xl font-semibold text-foreground">
              2. Numbered 4-Step Return Process
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              How our automated reverse logistics pipeline works from start to finish.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RETURN_STEPS.map((step) => (
              <div
                key={step.step}
                className="rounded-sm border border-border bg-card/60 p-5 flex flex-col justify-between space-y-3"
              >
                <div>
                  <span className="font-serif text-2xl font-light text-accent/80 block mb-2">
                    {step.step}
                  </span>
                  <h3 className="font-serif text-sm font-semibold text-foreground mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-border/40">
                  <span className="text-[10px] uppercase tracking-wider text-accent font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified Step</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Garment Conditions for Return */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-foreground">
            3. Mandatory Garment Conditions
          </h2>
          <div className="rounded-sm border border-border bg-card/40 p-5 space-y-2 text-xs text-muted-foreground leading-relaxed">
            <p>
              To maintain hygiene and ensure every patron receives pristine atelier merchandise, all
              returned garments must satisfy the following criteria:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 pt-1 text-foreground">
              <li>
                <strong>Unworn &amp; Unwashed:</strong> No scent of perfume, deodorant, makeup
                stains, or signs of wear.
              </li>
              <li>
                <strong>Intact Security Tags:</strong> The atelier garment ribbon tag must remain
                attached without being cut or re-fastened.
              </li>
              <li>
                <strong>Original Packaging:</strong> Returned inside the protective presentation box
                with all enclosed documentation.
              </li>
            </ul>
          </div>
        </section>

        {/* 4. Refund & Exchange Settlement Timelines */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-foreground">
            4. Refund &amp; Exchange Settlement
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-light">
            Once your returned parcel reaches our studio, inspection is completed within 24 business
            hours. For exchanges, the replacement piece is dispatched immediately via express
            courier. For refunds:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3.5 rounded-sm border border-border bg-card/60">
              <span className="font-semibold text-foreground block mb-1">Prepaid UPI / QR</span>
              <p className="text-muted-foreground">Credited directly to bank in 24–48 hours.</p>
            </div>
            <div className="p-3.5 rounded-sm border border-border bg-card/60">
              <span className="font-semibold text-foreground block mb-1">Credit / Debit Cards</span>
              <p className="text-muted-foreground">
                Settled back to issuing bank in 3–5 business days.
              </p>
            </div>
            <div className="p-3.5 rounded-sm border border-border bg-card/60">
              <span className="font-semibold text-foreground block mb-1">
                Cash on Delivery (COD)
              </span>
              <p className="text-muted-foreground">
                Transferred via secure NEFT / IMPS to your verified bank details.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Policy Exceptions */}
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold text-foreground">
            5. Non-Returnable Exceptions
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-light">
            Due to intimate wear hygiene protocols and bespoke atelier work, the following items are
            non-returnable unless received with a verified manufacturing defect:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground font-light">
            <li>Custom-tailored pieces altered to non-standard bespoke measurements.</li>
            <li>
              Undercaps, hijab hair bands, and magnetic brooch pins (if packaging seal is broken).
            </li>
            <li>Items specifically marked as &ldquo;Final Sale / Archive Vault&rdquo;.</li>
          </ul>
        </section>
      </div>
    </LegalPageShell>
  );
}
