import { Scale, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

import { DEFAULT_CORPORATE_COORDINATES, DEFAULT_GRIEVANCE_OFFICER } from '@hh/domain';

export interface FooterProps {
  storeName: string;
  instagramHandle?: string | undefined;
  corporateCoordinates?: Partial<typeof DEFAULT_CORPORATE_COORDINATES> | undefined;
  grievanceOfficer?: Partial<typeof DEFAULT_GRIEVANCE_OFFICER> | undefined;
}

export function Footer({
  storeName,
  instagramHandle,
  corporateCoordinates,
  grievanceOfficer
}: FooterProps) {
  const corporate = { ...DEFAULT_CORPORATE_COORDINATES, ...corporateCoordinates };
  const officer = { ...DEFAULT_GRIEVANCE_OFFICER, ...grievanceOfficer };

  return (
    <footer className="mt-20 border-t border-border bg-card/80 pt-16 pb-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-border">
          {/* Column 1: Brand & Craftsmanship */}
          <div>
            <span className="font-serif text-2xl font-semibold tracking-wide text-primary">
              {storeName}
            </span>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-sm">
              Crafted with intention. Delivering signature modest wear accessories and refined
              essentials directly to your doorstep with guaranteed craftsmanship.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <span>Certified 100% Genuine Handcrafted Pieces</span>
            </div>
          </div>

          {/* Column 2: Order Journey & Statutory Grievance */}
          <div>
            <span className="block mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Order &amp; Redressal
            </span>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span>Encrypted Razorpay Checkout</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span>India Post &amp; DTDC Courier Network</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                <span>Direct In-App Shipment Tracking</span>
              </li>
              <li className="flex items-center gap-2 pt-1">
                <Scale className="h-4 w-4 text-accent shrink-0" />
                <Link
                  href="/grievance"
                  className="font-medium text-foreground hover:text-accent transition-colors"
                >
                  Consumer Grievance Desk (48h SLA)
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Instagram & Customer Care */}
          <div>
            <span className="block mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Connect &amp; Care
            </span>
            {instagramHandle ? (
              <a
                href={`https://instagram.com/${instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-accent transition-colors mb-3"
              >
                Follow @{instagramHandle} on Instagram &rarr;
              </a>
            ) : null}
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Customer Support:</span>{' '}
                <a href={`mailto:${corporate.contactEmail}`} className="hover:text-foreground">
                  {corporate.contactEmail}
                </a>
              </p>
              <p>
                <span className="font-semibold text-foreground">Direct Concierge:</span>{' '}
                <a
                  href={`tel:${corporate.supportPhone.replace(/\s+/g, '')}`}
                  className="hover:text-foreground"
                >
                  {corporate.supportPhone}
                </a>
              </p>
              <p>
                <span className="font-semibold text-foreground">Grievance Officer:</span>{' '}
                <Link href="/grievance" className="hover:text-accent font-medium text-foreground">
                  {officer.name}
                </Link>{' '}
                (
                <a href={`mailto:${officer.email}`} className="hover:underline">
                  {officer.email}
                </a>
                )
              </p>
            </div>
          </div>
        </div>

        {/* Middle Bar: Statutory Corporate Coordinates (Rule 4(4) & Rule 5(3)(f)) */}
        <div className="py-6 border-b border-border/80 text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
            <div>
              <p className="font-medium text-foreground">
                Registered Corporate Entity: {corporate.legalName}
              </p>
              <p className="mt-0.5">Registered Office: {corporate.registeredAddress}</p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
              <span>
                <strong className="text-foreground">CIN:</strong> {corporate.cin}
              </span>
              <span>•</span>
              <span>
                <strong className="text-foreground">GSTIN:</strong> {corporate.gstin}
              </span>
              <span>•</span>
              <Link href="/grievance" className="text-accent hover:underline font-semibold">
                Grievance Redressal Portal
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Legal Policies */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 pt-6 text-xs text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} {storeName}. All rights reserved. Registered in India.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href="/about" className="hover:text-foreground transition-colors">
              Our Story
            </Link>
            <Link href="/faq" className="hover:text-foreground transition-colors">
              FAQ
            </Link>
            <Link href="/shipping" className="hover:text-foreground transition-colors">
              Shipping Guide
            </Link>
            <Link href="/returns" className="hover:text-foreground transition-colors">
              Returns &amp; Exchanges
            </Link>
            <Link href="/track" className="hover:text-foreground transition-colors">
              Track Parcel
            </Link>
            <Link href="/grievance" className="hover:text-foreground transition-colors font-medium">
              Grievance Redressal
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms of Sale
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/refunds" className="hover:text-foreground transition-colors">
              Refund &amp; Return Policy
            </Link>
            <Link href="/shipping-policy" className="hover:text-foreground transition-colors">
              Shipping Policy
            </Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
