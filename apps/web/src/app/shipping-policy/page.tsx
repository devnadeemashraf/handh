import Link from 'next/link';
import { LegalPageShell } from '@/components/legal/LegalPageShell';

import type { Metadata } from 'next';

import { findStoreBySlug, getCategoryTree, getSharedDbClient } from '@hh/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy | H&H',
  description:
    'Information regarding domestic parcel dispatch, courier partners, transit times, pincode serviceability, and consignment tracking across India.'
};

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export default async function ShippingPolicyPage() {
  const db = getDatabase();
  const store = await findStoreBySlug(db, 'hh');
  const categories = store ? await getCategoryTree(db, store.id) : [];

  return (
    <LegalPageShell
      title="Shipping & Delivery Policy"
      subtitle="Discover our nationwide fulfillment standards, hand-inspection protocols, verified courier networks, and transit schedules from our Hyderabad studio."
      badgeText="Nationwide Express Courier"
      lastUpdated="September 2026"
      storeName={store?.name ?? 'H&H'}
      categories={categories}
      instagramHandle={store?.settings.instagramHandle}
    >
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          1. Origin &amp; Artisanal Handling
        </h2>
        <p>
          All H&amp;H signature items are crafted, hand-inspected, and dispatched directly from our
          registered workshop in{' '}
          <strong className="text-foreground">
            Jubilee Hills, Hyderabad, Telangana (PIN: 500034)
          </strong>
          . Because each order is packaged with utmost care in padded luxury boxes, handling time is
          typically <strong className="text-foreground">24 to 48 business hours</strong> from
          payment confirmation.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          2. Courier Partners &amp; Tracking
        </h2>
        <p>
          We partner with premier Indian logistics providers to guarantee safe and insured delivery:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            <strong className="text-foreground">Speed Post (India Post):</strong> Comprehensive
            coverage extending to all regional and suburban taluks across India.
          </li>
          <li>
            <strong className="text-foreground">DTDC Express &amp; Shiprocket Network:</strong> Fast
            express air delivery to metro hubs and major Tier 1 &amp; Tier 2 cities.
          </li>
        </ul>
        <p>
          As soon as your consignment is assigned an Air Waybill (AWB), you will receive an
          automated tracking link via SMS and email. You can monitor live milestones anytime through
          our{' '}
          <Link href="/track" className="text-accent hover:underline font-medium">
            Shipment Tracking Portal
          </Link>
          .
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          3. Estimated Transit Schedules
        </h2>
        <p>Estimated transit times from dispatch based on regional postal zones:</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm pt-1">
          <div className="rounded-xl border border-border p-3.5 bg-background">
            <span className="font-semibold text-foreground block">
              Telangana &amp; Andhra Pradesh
            </span>
            <p className="text-muted-foreground mt-1">1 – 2 Business Days</p>
          </div>
          <div className="rounded-xl border border-border p-3.5 bg-background">
            <span className="font-semibold text-foreground block">
              Metro Hubs (BLR, BOM, DEL, MAA)
            </span>
            <p className="text-muted-foreground mt-1">2 – 4 Business Days</p>
          </div>
          <div className="rounded-xl border border-border p-3.5 bg-background">
            <span className="font-semibold text-foreground block">
              Rest of India &amp; Regional Hubs
            </span>
            <p className="text-muted-foreground mt-1">4 – 7 Business Days</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Note: Adverse weather conditions, regional holidays, or festive delivery surges may
          marginally extend delivery schedules.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          4. Postal Code Serviceability &amp; Gate
        </h2>
        <p>
          In accordance with our pre-checkout verification engine, shipping serviceability is
          verified against our courier database before payment capture. We ship to over 19,000
          postal codes across India.
        </p>
        <p className="text-xs text-muted-foreground">
          Due to civil courier restrictions, commercial parcel delivery cannot be made to Army
          Postal Service (APS) bases or restricted defense perimeters requiring military escort.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          5. Delivery Attempts &amp; Non-Delivery Reports (NDR)
        </h2>
        <p>
          Our courier partners make up to{' '}
          <strong className="text-foreground">three (3) delivery attempts</strong>. If a delivery
          attempt fails due to an incorrect address or customer unavailability, our customer care
          team will contact you directly to coordinate a re-attempt.
        </p>
        <p>
          If the package remains undelivered after 3 attempts, it is flagged for Return to Origin
          (RTO). Upon physical receipt at our Hyderabad warehouse, a full refund will be initiated
          back to your payment account.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          6. Damaged or Tampered Parcels
        </h2>
        <p>
          If the exterior shipping package appears torn, severely crushed, or tampered with at the
          time of delivery, please refuse to accept the parcel from the delivery agent, take a
          photograph, and immediately contact our concierge at{' '}
          <a href="mailto:support@handh.in" className="text-accent hover:underline">
            support@handh.in
          </a>{' '}
          or file a complaint on our{' '}
          <Link href="/grievance" className="text-accent hover:underline font-medium">
            Grievance Redressal Desk
          </Link>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
