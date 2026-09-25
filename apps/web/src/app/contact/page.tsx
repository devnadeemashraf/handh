import {
  ArrowRight,
  Clock,
  HelpCircle,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  RotateCcw,
  Scale,
  Truck
} from 'lucide-react';
import Link from 'next/link';
import { LegalPageShell } from '@/components/legal/LegalPageShell';

import type { Metadata } from 'next';

import { findStoreBySlug, getCategoryTree, getSharedDbClient } from '@hh/db';
import {
  DEFAULT_BRAND_IDENTITY,
  DEFAULT_CORPORATE_COORDINATES,
  DEFAULT_GRIEVANCE_OFFICER
} from '@hh/domain';

import { ContactForm } from './ContactForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Contact Us & Concierge Desk | ${DEFAULT_BRAND_IDENTITY.name}`,
  description: `Reach our customer care concierge, workshop studio in ${DEFAULT_BRAND_IDENTITY.address.city}, or statutory Grievance Officer.`
};

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export default async function ContactPage() {
  const db = getDatabase();
  const store = await findStoreBySlug(db, 'hh');
  const categories = store ? await getCategoryTree(db, store.id) : [];

  return (
    <LegalPageShell
      title="Contact Us & Concierge Desk"
      subtitle="We're here to help. Whether you have questions about bespoke sizing, order delivery milestones, or require after-sales assistance, our artisans and concierge are ready to assist you."
      badgeText="Client Care & Concierge"
      lastUpdated="September 2026"
      storeName={store?.name ?? DEFAULT_BRAND_IDENTITY.name}
      categories={categories}
      instagramHandle={store?.settings.instagramHandle}
    >
      <div className="space-y-12 not-prose">
        {/* 1. Direct Contact Options Cards (Spec 10.2 §2) */}
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground mb-4">
            Direct Concierge Channels
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Email Card with 24h Response SLA */}
            <div className="rounded-sm border border-border bg-card/60 p-5 flex flex-col justify-between">
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-accent/10 text-accent mb-3">
                  <Mail className="h-4 w-4" />
                </div>
                <h3 className="font-serif text-base font-semibold text-foreground mb-1">
                  Customer Concierge
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  For inquiries on orders, fabrics, or bespoke styling.
                </p>
                <a
                  href={`mailto:${DEFAULT_CORPORATE_COORDINATES.contactEmail}`}
                  className="font-medium text-xs sm:text-sm text-foreground hover:text-accent transition-colors block"
                >
                  {DEFAULT_CORPORATE_COORDINATES.contactEmail}
                </a>
              </div>
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Clock className="w-3.5 h-3.5 text-accent" />
                <span>Response within 24 hours</span>
              </div>
            </div>

            {/* WhatsApp / Helpline */}
            <div className="rounded-sm border border-border bg-card/60 p-5 flex flex-col justify-between">
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-accent/10 text-accent mb-3">
                  <Phone className="h-4 w-4" />
                </div>
                <h3 className="font-serif text-base font-semibold text-foreground mb-1">
                  Helpline &amp; WhatsApp
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Immediate assistance via direct telephone or WhatsApp chat.
                </p>
                <a
                  href={`tel:${DEFAULT_CORPORATE_COORDINATES.supportPhone.replace(/\s+/g, '')}`}
                  className="font-medium text-xs sm:text-sm text-foreground hover:text-accent transition-colors block"
                >
                  {DEFAULT_CORPORATE_COORDINATES.supportPhone}
                </a>
              </div>
              <div className="mt-4 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
                <span>Mon – Fri: 10:00 AM – 6:00 PM IST</span>
              </div>
            </div>

            {/* Instagram Atelier DM */}
            <div className="rounded-sm border border-border bg-card/60 p-5 flex flex-col justify-between">
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-accent/10 text-accent mb-3">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <h3 className="font-serif text-base font-semibold text-foreground mb-1">
                  Social Atelier
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Connect with our stylists directly on Instagram.
                </p>
                <a
                  href={`https://instagram.com/${store?.settings.instagramHandle ?? 'handh_official'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-xs sm:text-sm text-accent hover:underline flex items-center gap-1"
                >
                  <span>@{store?.settings.instagramHandle ?? 'handh_official'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
              <div className="mt-4 pt-3 border-t border-border/40 text-[11px] text-muted-foreground">
                <span>Replies during studio business hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Self-Serve Quick Links (Spec 10.2 §3: placed BEFORE the contact form) */}
        <div className="rounded-sm border border-border/80 bg-secondary/15 p-5 sm:p-6">
          <div className="mb-4">
            <h3 className="font-serif text-base font-semibold text-foreground mb-1">
              Looking for Immediate Self-Serve Answers?
            </h3>
            <p className="text-xs text-muted-foreground">
              Most order, delivery, and sizing questions can be resolved immediately without waiting
              for email replies.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/faq"
              className="flex items-center justify-between p-3.5 rounded-sm border border-border/60 bg-background/80 hover:bg-secondary/40 transition-colors group"
            >
              <div className="flex items-center gap-2.5 text-xs font-medium text-foreground">
                <HelpCircle className="w-4 h-4 text-accent" />
                <span>Frequently Asked Questions</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/shipping"
              className="flex items-center justify-between p-3.5 rounded-sm border border-border/60 bg-background/80 hover:bg-secondary/40 transition-colors group"
            >
              <div className="flex items-center gap-2.5 text-xs font-medium text-foreground">
                <Truck className="w-4 h-4 text-accent" />
                <span>Shipping &amp; Timelines</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              href="/returns"
              className="flex items-center justify-between p-3.5 rounded-sm border border-border/60 bg-background/80 hover:bg-secondary/40 transition-colors group"
            >
              <div className="flex items-center gap-2.5 text-xs font-medium text-foreground">
                <RotateCcw className="w-4 h-4 text-accent" />
                <span>Returns &amp; Exchanges</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* 3. The Form is the Last Element on the Page (Spec 10.2 §4) */}
        <div className="rounded-sm border border-border bg-card/60 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-foreground mb-1.5">
              Submit a Message to Our Atelier
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Please provide your details below and a dedicated concierge advisor will assist you.
            </p>
          </div>
          <ContactForm />
        </div>

        {/* 4. Statutory Workshop Coordinates & Grievance Desk (Preserved for Legal Compliance) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="rounded-sm border border-border bg-card/60 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 text-accent mb-3">
                <MapPin className="h-4 w-4" />
                <h3 className="font-serif font-semibold text-foreground text-sm">
                  Workshop Studio
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Official corporate headquarters and design studio location in Hyderabad, Telangana.
              </p>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">
                    Registered Corporate Entity
                  </span>
                  <p className="font-semibold text-foreground mt-0.5">
                    {DEFAULT_CORPORATE_COORDINATES.legalName}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase tracking-wider">
                    Postal Address
                  </span>
                  <p className="text-foreground leading-relaxed mt-0.5">
                    {DEFAULT_CORPORATE_COORDINATES.registeredAddress}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground pt-1">
                  <span>
                    <strong>CIN:</strong> {DEFAULT_CORPORATE_COORDINATES.cin}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>GSTIN:</strong> {DEFAULT_CORPORATE_COORDINATES.gstin}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/40 text-xs">
              <Link
                href="/track"
                className="text-accent hover:underline font-medium inline-flex items-center gap-1"
              >
                <span>Check Live Shipment Tracking</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>

          <div className="rounded-sm border border-border bg-accent/5 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-accent font-semibold text-sm mb-2">
                <Scale className="h-4 w-4" />
                <span>Consumer Grievance Redressal</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                Have an unresolved dispute or order issue? Under the Consumer Protection Rules,
                2020, our designated Grievance Officer,{' '}
                <strong className="text-foreground">{DEFAULT_GRIEVANCE_OFFICER.name}</strong>,
                guarantees formal acknowledgment within 48 hours and resolution within 30 days.
              </p>
            </div>
            <div>
              <Link
                href="/grievance"
                className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1.5"
              >
                <span>Access Grievance Redressal Desk</span>
                <span>&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </LegalPageShell>
  );
}
