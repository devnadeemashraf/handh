import { Clock, Mail, MapPin, MessageCircle, Phone, Scale, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { LegalPageShell } from '@/components/legal/LegalPageShell';

import type { Metadata } from 'next';

import { findStoreBySlug, getCategoryTree, getSharedDbClient } from '@hh/db';
import {
  DEFAULT_BRAND_IDENTITY,
  DEFAULT_CORPORATE_COORDINATES,
  DEFAULT_GRIEVANCE_OFFICER
} from '@hh/domain';

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
      subtitle="Whether you have questions about bespoke sizing, order delivery milestones, or require after-sales assistance, our artisans and concierge are here to help."
      badgeText="Client Care & Concierge"
      lastUpdated="September 2026"
      storeName={store?.name ?? DEFAULT_BRAND_IDENTITY.name}
      categories={categories}
      instagramHandle={store?.settings.instagramHandle}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 not-prose mb-10">
        {/* Support Channels Card */}
        <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-3 text-accent mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Direct Assistance
                </span>
                <h2 className="text-base font-serif font-bold text-foreground">
                  Customer Concierge
                </h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
              Our concierge team is available to assist you with order status inquiries, custom
              fitting, and material specifications.
            </p>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">
                    General &amp; Order Support
                  </span>
                  <a
                    href={`mailto:${DEFAULT_CORPORATE_COORDINATES.contactEmail}`}
                    className="font-medium text-foreground hover:text-accent transition-colors"
                  >
                    {DEFAULT_CORPORATE_COORDINATES.contactEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">
                    Concierge Helpline &amp; WhatsApp
                  </span>
                  <a
                    href={`tel:${DEFAULT_CORPORATE_COORDINATES.supportPhone.replace(/\s+/g, '')}`}
                    className="font-medium text-foreground hover:text-accent transition-colors"
                  >
                    {DEFAULT_CORPORATE_COORDINATES.supportPhone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">
                    Studio &amp; Support Hours
                  </span>
                  <p className="text-foreground mt-0.5">Monday to Friday: 10:00 AM – 6:00 PM IST</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-border/80 bg-secondary/30 p-3.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground block mb-1">
              Direct Shipment Tracking:
            </span>
            <p>
              Looking for your parcel? Check live courier status anytime on our{' '}
              <Link href="/track" className="text-accent hover:underline font-semibold">
                Shipment Tracker
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Corporate Office & Grievance Card */}
        <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center gap-3 text-accent mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Registered Headquarters
                </span>
                <h2 className="text-base font-serif font-bold text-foreground">Workshop Studio</h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
              Official corporate headquarters and design studio location in Hyderabad, Telangana.
            </p>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">
                  Registered Corporate Entity
                </span>
                <p className="font-semibold text-foreground mt-0.5">
                  {DEFAULT_CORPORATE_COORDINATES.legalName}
                </p>
              </div>

              <div>
                <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">
                  Postal Address
                </span>
                <p className="text-foreground leading-relaxed mt-0.5">
                  {DEFAULT_CORPORATE_COORDINATES.registeredAddress}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
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

          <div className="mt-6 rounded-xl border border-border/80 bg-accent/5 p-4 text-xs">
            <div className="flex items-center gap-2 text-accent font-semibold mb-1">
              <Scale className="h-4 w-4" />
              <span>Consumer Grievance Redressal</span>
            </div>
            <p className="text-muted-foreground mb-2">
              Have an unresolved dispute or order issue? Our designated Grievance Officer,{' '}
              <strong className="text-foreground">{DEFAULT_GRIEVANCE_OFFICER.name}</strong>,
              guarantees acknowledgment within 48 hours.
            </p>
            <Link
              href="/grievance"
              className="text-accent hover:underline font-semibold inline-flex items-center gap-1"
            >
              <span>Access Grievance Redressal Portal</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-8 not-prose">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="h-5 w-5 text-accent" />
          <h3 className="text-base font-serif font-semibold text-foreground">
            Connect With Our Designers on Instagram
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl mb-4">
          Follow our journey, sneak peeks of upcoming drops, styling guides, and artisanal craft
          videos on social media.
        </p>
        <a
          href="https://instagram.com/handh_official"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/60 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-secondary hover:text-accent transition-colors"
        >
          <span>Follow @handh_official on Instagram</span>
          <span>&rarr;</span>
        </a>
      </div>
    </LegalPageShell>
  );
}
