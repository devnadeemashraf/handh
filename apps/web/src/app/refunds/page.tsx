import Link from 'next/link';
import { LegalPageShell } from '@/components/legal/LegalPageShell';

import type { Metadata } from 'next';

import { findStoreBySlug, getCategoryTree, getSharedDbClient } from '@hh/db';
import { DEFAULT_BRAND_IDENTITY } from '@hh/domain';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Refund & Return Policy | ${DEFAULT_BRAND_IDENTITY.name}`,
  description:
    'Comprehensive 7-day return policy, reverse pickup guidelines, refund timelines, and cancellation procedures under Consumer Protection Rules.'
};

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export default async function RefundsPage() {
  const db = getDatabase();
  const store = await findStoreBySlug(db, 'hh');
  const categories = store ? await getCategoryTree(db, store.id) : [];

  return (
    <LegalPageShell
      title="Refund & Return Policy"
      subtitle="Our 7-day return policy ensures complete transparency and satisfaction. Learn about reverse pickups, quality inspections, and automated Razorpay refund timelines."
      badgeText="Consumer Protection (E-Commerce) Rules, 2020"
      lastUpdated="September 2026"
      storeName={store?.name ?? DEFAULT_BRAND_IDENTITY.name}
      categories={categories}
      instagramHandle={store?.settings.instagramHandle}
    >
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          1. 7-Day Return Eligibility Window
        </h2>
        <p>
          At {DEFAULT_BRAND_IDENTITY.name}, every piece is inspected by hand before dispatch. In
          compliance with Rule 5(3)(e) of the Consumer Protection (E-Commerce) Rules, 2020, we offer
          a <strong className="text-foreground">7-calendar-day return window</strong> commencing
          from the date and timestamp the parcel is marked &quot;Delivered&quot; by our courier
          partner.
        </p>
        <p>You may initiate a return request if the product received is:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Physically damaged during courier transit.</li>
          <li>Defective in craftsmanship, clasp mechanism, or setting.</li>
          <li>
            Materially different from the specifications ordered (e.g., incorrect size or variant).
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          2. Hygiene &amp; Artisanal Modest Wear Guidelines
        </h2>
        <p>
          Because our catalog features delicate handcrafted nose pieces and personal accessories,
          items must be in their original, unworn condition with all authenticity cards, security
          seals, and premium velvet packaging intact.
        </p>
        <p>
          To protect against transit fraud and process your claim swiftly, we request that you
          provide clear photographs (or an unboxing video) showing the damaged or defective portion
          alongside your order reference number.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          3. Step-by-Step Return &amp; Reverse Pickup Process
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm pt-2">
          <div className="rounded-xl border border-border p-4 bg-background">
            <span className="font-mono text-accent font-bold block mb-1">
              Step 1: Request &amp; Photo
            </span>
            <p className="text-muted-foreground">
              Submit your return request via our support concierge or Grievance Desk with order
              number, photograph, and defect description within 7 days.
            </p>
          </div>
          <div className="rounded-xl border border-border p-4 bg-background">
            <span className="font-mono text-accent font-bold block mb-1">
              Step 2: Reverse Courier Pickup
            </span>
            <p className="text-muted-foreground">
              Upon approval, our courier partner schedules an insured doorstep reverse pickup. You
              will receive an AWB pickup tracking number.
            </p>
          </div>
          <div className="rounded-xl border border-border p-4 bg-background">
            <span className="font-mono text-accent font-bold block mb-1">
              Step 3: Inspection &amp; Refund
            </span>
            <p className="text-muted-foreground">
              Upon arrival at our Hyderabad workshop, our artisans verify the defect, and the refund
              is immediately triggered via Razorpay.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          4. Refund Method &amp; Settlement Timelines
        </h2>
        <p>
          Once your return is inspected and approved at our facility, refunds are initiated
          automatically through Razorpay back to your original source of payment:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            <strong className="text-foreground">UPI (Google Pay, PhonePe, Paytm):</strong> Reversal
            typically settles within 24 to 48 banking hours.
          </li>
          <li>
            <strong className="text-foreground">Net Banking:</strong> Settles within 2 to 4 business
            days depending on the beneficiary bank.
          </li>
          <li>
            <strong className="text-foreground">Credit / Debit Cards:</strong> Settles within 5 to 7
            business days pursuant to the issuing bank&apos;s settlement schedule.
          </li>
        </ul>
        <p>
          You will receive an automated Razorpay transaction refund confirmation receipt via email
          and SMS as soon as the reversal is credited.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          5. Order Cancellation Before Dispatch
        </h2>
        <p>
          You may cancel your order at any time before the parcel has been assigned an Air Waybill
          (AWB) and handed over to the courier. If cancelled prior to dispatch, 100% of the
          transaction value including shipping fees will be refunded immediately to your original
          payment method. Once handed over to the courier, the standard 7-day return flow applies.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">6. Dispute Redressal</h2>
        <p>
          If your refund has not reflected within the stated timelines, or if you have questions
          regarding an ongoing inspection, please contact our designated Grievance Officer at{' '}
          <a
            href={`mailto:${DEFAULT_BRAND_IDENTITY.grievanceOfficer.email}`}
            className="text-accent hover:underline"
          >
            {DEFAULT_BRAND_IDENTITY.grievanceOfficer.email}
          </a>{' '}
          or file an escalation through our{' '}
          <Link href="/grievance" className="text-accent hover:underline font-medium">
            Grievance Redressal Desk
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
