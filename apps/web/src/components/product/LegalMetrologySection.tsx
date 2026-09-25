import { FileCheck, HelpCircle, Scale, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import {
  DEFAULT_BRAND_IDENTITY,
  Money,
  type PublicProductDetail,
  type PublicVariantItem
} from '@hh/domain';

export interface LegalMetrologySectionProps {
  product: PublicProductDetail;
  selectedVariant?: PublicVariantItem | undefined;
  className?: string | undefined;
}

export function LegalMetrologySection({
  product,
  selectedVariant,
  className = ''
}: LegalMetrologySectionProps) {
  const activeVariant = selectedVariant ?? product.variants[0];
  const priceDisplay = activeVariant
    ? Money.fromMinor(activeVariant.priceMinor, 'INR').format('en-IN')
    : undefined;

  const commodity = product.commodityName ?? product.title;
  const netQuantity = product.netQuantity ?? '1 N';
  const country = product.countryOfOrigin ?? 'India';
  const manufacturer = product.manufacturerDetails;
  const packer = product.packerDetails ?? manufacturer;
  const consumerCare = product.consumerCareDetails ?? {
    email: DEFAULT_BRAND_IDENTITY.supportEmail,
    phone: DEFAULT_BRAND_IDENTITY.supportPhone,
    address: manufacturer.address
  };

  return (
    <section
      aria-labelledby="legal-metrology-heading"
      className={`mt-10 rounded-2xl border border-border bg-card/60 p-6 sm:p-8 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent uppercase tracking-wider mb-1">
            <Scale className="h-4 w-4" />
            <span>Statutory Declaration</span>
          </div>
          <h3
            id="legal-metrology-heading"
            className="font-serif text-lg sm:text-xl font-bold text-foreground"
          >
            Legal Metrology Declarations
          </h3>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Rule 6, Legal Metrology (Packaged Commodities) Rules, 2011</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-6">
        In accordance with the Legal Metrology (Packaged Commodities) Rules, 2011 and the Consumer
        Protection (E-Commerce) Rules, 2020, the following statutory declarations are disclosed for
        this article:
      </p>

      {/* Specifications Grid */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs sm:text-sm">
        <div className="border-b border-border/50 pb-3">
          <dt className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
            Generic Name of Commodity
          </dt>
          <dd className="font-medium text-foreground mt-0.5">{commodity}</dd>
        </div>

        <div className="border-b border-border/50 pb-3">
          <dt className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
            Net Quantity
          </dt>
          <dd className="font-medium text-foreground mt-0.5">{netQuantity}</dd>
        </div>

        <div className="border-b border-border/50 pb-3">
          <dt className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
            Country of Origin
          </dt>
          <dd className="font-medium text-foreground mt-0.5">{country}</dd>
        </div>

        <div className="border-b border-border/50 pb-3">
          <dt className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
            Maximum Retail Price (MRP)
          </dt>
          <dd className="font-medium text-foreground mt-0.5">
            {priceDisplay ? `${priceDisplay} (Inclusive of all taxes)` : 'Inclusive of all taxes'}
          </dd>
        </div>

        <div className="border-b border-border/50 pb-3">
          <dt className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
            Manufactured &amp; Marketed By
          </dt>
          <dd className="text-foreground mt-0.5 leading-relaxed">
            <span className="font-semibold block">{manufacturer.name}</span>
            <span className="text-muted-foreground text-xs">{manufacturer.address}</span>
          </dd>
        </div>

        <div className="border-b border-border/50 pb-3">
          <dt className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold">
            Packed By
          </dt>
          <dd className="text-foreground mt-0.5 leading-relaxed">
            <span className="font-semibold block">{packer.name}</span>
            <span className="text-muted-foreground text-xs">{packer.address}</span>
          </dd>
        </div>
      </dl>

      {/* Consumer Care & Grievance Contact Box */}
      <div className="mt-6 rounded-xl border border-border/70 bg-secondary/20 p-4 sm:p-5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 text-foreground font-semibold mb-2">
          <HelpCircle className="h-4 w-4 text-accent" />
          <span>Consumer Care &amp; Statutory Grievance Redressal</span>
        </div>
        <p className="leading-relaxed">
          For complaints, queries, or assistance regarding this product, please reach our Consumer
          Care Cell at{' '}
          <a
            href={`mailto:${consumerCare.email}`}
            className="text-accent hover:underline font-medium"
          >
            {consumerCare.email}
          </a>{' '}
          or call{' '}
          <a href={`tel:${consumerCare.phone}`} className="text-accent hover:underline font-medium">
            {consumerCare.phone}
          </a>
          .
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Postal Address: {consumerCare.address}
        </p>
        <div className="mt-3 pt-2.5 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px]">
            Statutory Grievance Redressal Officer SLA: 48 hours acknowledgement
          </span>
          <Link
            href="/grievance"
            className="font-medium text-accent hover:underline inline-flex items-center gap-1 text-[11px]"
          >
            <FileCheck className="h-3.5 w-3.5" />
            <span>File Grievance Ticket &rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
