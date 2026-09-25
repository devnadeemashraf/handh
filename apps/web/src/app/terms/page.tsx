import Link from 'next/link';
import { LegalPageShell } from '@/components/legal/LegalPageShell';

import type { Metadata } from 'next';

import { findStoreBySlug, getCategoryTree, getSharedDbClient } from '@hh/db';
import { DEFAULT_BRAND_IDENTITY } from '@hh/domain';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Terms of Sale & Platform Terms | ${DEFAULT_BRAND_IDENTITY.name}`,
  description:
    'Terms of Sale and Platform Terms governing orders, payments, fulfillment, and user agreements under Indian law.'
};

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export default async function TermsPage() {
  const db = getDatabase();
  const store = await findStoreBySlug(db, 'hh');
  const categories = store ? await getCategoryTree(db, store.id) : [];

  return (
    <LegalPageShell
      title="Terms of Sale & Platform Terms"
      subtitle="Please read these terms carefully before placing an order. These terms govern your purchase of handcrafted modest wear accessories and use of our platform."
      badgeText="Consumer Protection (E-Commerce) Rules, 2020"
      lastUpdated="September 2026"
      storeName={store?.name ?? DEFAULT_BRAND_IDENTITY.name}
      categories={categories}
      instagramHandle={store?.settings.instagramHandle}
    >
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          1. Introduction &amp; Contract Formation
        </h2>
        <p>
          These Terms of Sale and Platform Terms (&quot;Terms&quot;) constitute an electronic record
          in terms of the Information Technology Act, 2000 and rules thereunder, and the Consumer
          Protection (E-Commerce) Rules, 2020. This document is published by{' '}
          <strong className="text-foreground">{DEFAULT_BRAND_IDENTITY.legalName}</strong> (&quot;
          {DEFAULT_BRAND_IDENTITY.name}&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
        </p>
        <p>
          By accessing the platform, adding products to cart, and clicking &quot;Place Order &amp;
          Proceed to Pay&quot;, you enter into a legally binding contract under the Indian Contract
          Act, 1872. If you do not agree to these Terms, you must not use or transact on this
          platform.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          2. Eligibility &amp; User Account
        </h2>
        <p>
          Use of the platform is available only to persons who can form legally binding contracts
          under the Indian Contract Act, 1872. Persons who are &quot;incompetent to contract&quot;,
          including un-discharged insolvents, are not eligible. Minors (under 18 years of age) may
          transact only under the supervision of a parent or legal guardian.
        </p>
        <p>
          When you register with your mobile number, you agree to maintain the confidentiality of
          your session credentials and one-time passwords (OTP). You are responsible for all
          activities that occur under your account.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          3. Product Descriptions, Pricing &amp; Taxes
        </h2>
        <p>
          All product listings declare the Maximum Retail Price (MRP) explicitly inclusive of all
          statutory taxes (GST) in Indian Rupees (INR), in accordance with the Legal Metrology
          (Packaged Commodities) Rules, 2011.
        </p>
        <p>
          We strive to provide accurate descriptions, high-resolution imagery, and dimensions of our
          handcrafted modest wear accessories. However, because our items feature artisanal
          finishing, minor hand-crafted variations in tone or polish are characteristics of genuine
          craft rather than defects.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          4. Orders, Reservations &amp; Payment
        </h2>
        <p>
          Submission of an order through our checkout creates a temporary inventory reservation for
          15 minutes. If payment confirmation is not received within this period, the reservation
          expires and the stock is returned to the available inventory pool.
        </p>
        <p>
          Payments are securely processed via Razorpay Software Private Limited
          (&quot;Razorpay&quot;), an RBI-authorized payment aggregator compliant with PCI DSS
          standards. {DEFAULT_BRAND_IDENTITY.name} does not collect, handle, or store your raw
          credit card numbers, debit card numbers, CVVs, or net banking passwords.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          5. Shipping, Delivery &amp; Title Transfer
        </h2>
        <p>
          Orders are dispatched strictly to serviceable Indian postal PIN codes verified during
          checkout. Dispatch occurs within 24 to 48 business hours via insured courier partners
          (India Post, DTDC, or Shiprocket). Consignment tracking numbers and real-time transit
          updates are accessible via our{' '}
          <Link href="/track" className="text-accent hover:underline font-medium">
            Shipment Tracking Portal
          </Link>
          .
        </p>
        <p>
          Title and risk of loss pass to the customer upon physical handover of the parcel by the
          courier at the designated delivery address.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          6. Returns, Refunds &amp; Cancellations
        </h2>
        <p>
          Our return and refund procedures are governed by our statutory{' '}
          <Link href="/refunds" className="text-accent hover:underline font-medium">
            Refund &amp; Return Policy
          </Link>
          . Customers may request a replacement or refund for damaged, defective, or incorrect items
          within 7 calendar days of delivery.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          7. Grievance Redressal &amp; Nodal Officer
        </h2>
        <p>
          In accordance with Rule 4(4) and Rule 5(3)(f) of the Consumer Protection (E-Commerce)
          Rules, 2020, {DEFAULT_BRAND_IDENTITY.name} has designated a Nodal Grievance Officer. Any
          consumer dispute or grievance will be acknowledged within 48 hours and resolved within 30
          days. Please visit our dedicated{' '}
          <Link href="/grievance" className="text-accent hover:underline font-medium">
            Grievance Redressal Desk
          </Link>{' '}
          to lodge a formal complaint.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          8. Governing Law &amp; Dispute Jurisdiction
        </h2>
        <p>
          These Terms and any contractual disputes arising out of purchase transactions on this
          platform shall be governed by and construed in accordance with the laws of India. Subject
          to mandatory consumer protection provisions, the competent courts located in{' '}
          {DEFAULT_BRAND_IDENTITY.address.city},{DEFAULT_BRAND_IDENTITY.address.state}, India shall
          have exclusive jurisdiction.
        </p>
      </section>
    </LegalPageShell>
  );
}
