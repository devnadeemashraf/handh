import Link from 'next/link';
import { LegalPageShell } from '@/components/legal/LegalPageShell';

import type { Metadata } from 'next';

import { findStoreBySlug, getCategoryTree, getSharedDbClient } from '@hh/db';
import { DEFAULT_BRAND_IDENTITY } from '@hh/domain';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Privacy Policy & Data Protection | ${DEFAULT_BRAND_IDENTITY.name}`,
  description:
    'Privacy Policy detailing personal data processing, purpose limitation, retention, and customer rights under the Digital Personal Data Protection (DPDP) Act, 2023.'
};

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export default async function PrivacyPage() {
  const db = getDatabase();
  const store = await findStoreBySlug(db, 'hh');
  const categories = store ? await getCategoryTree(db, store.id) : [];

  return (
    <LegalPageShell
      title="Privacy Policy & Data Protection"
      subtitle={`How ${DEFAULT_BRAND_IDENTITY.name} processes, safeguards, and respects your personal data in accordance with the Digital Personal Data Protection (DPDP) Act, 2023 and the Information Technology Act, 2000.`}
      badgeText="DPDP Act, 2023 Compliant"
      lastUpdated="September 2026"
      storeName={store?.name ?? DEFAULT_BRAND_IDENTITY.name}
      categories={categories}
      instagramHandle={store?.settings.instagramHandle}
    >
      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          1. Identity of Data Fiduciary
        </h2>
        <p>
          <strong className="text-foreground">{DEFAULT_BRAND_IDENTITY.legalName}</strong> acts as
          the Data Fiduciary under the Digital Personal Data Protection (DPDP) Act, 2023 in respect
          of personal data collected from customers, visitors, and registered users of this
          e-commerce storefront.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          2. Personal Data We Collect
        </h2>
        <p>
          We collect and process only the minimal personal data strictly necessary to fulfill
          e-commerce services:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            <strong className="text-foreground">Identity &amp; Contact Data:</strong> Full name,
            10-digit mobile number, email address.
          </li>
          <li>
            <strong className="text-foreground">Delivery Data:</strong> Recipient name, street
            address, landmark, city, state, and 6-digit Indian postal PIN code.
          </li>
          <li>
            <strong className="text-foreground">Transaction &amp; Order Data:</strong> Order
            reference number, line items, order totals, payment transaction IDs issued by Razorpay
            (we never collect or store card numbers or CVVs).
          </li>
          <li>
            <strong className="text-foreground">Technical &amp; Telemetry Data:</strong> IP address,
            browser type, and session identifiers strictly used for rate limiting, brute-force
            defense, and cart retention.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          3. Purpose of Processing &amp; Legal Basis
        </h2>
        <p>Your personal data is processed exclusively for specified, lawful purposes:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Processing, packing, and dispatching your modest wear orders.</li>
          <li>
            Generating statutory Tax Invoices compliant with Rule 46 of the Central Goods and
            Services Tax (CGST) Rules, 2017.
          </li>
          <li>Communicating order status notifications and courier dispatch tracking links.</li>
          <li>Authenticating customer login sessions via one-time SMS passwords (OTP).</li>
          <li>
            Investigating and redressing consumer grievances through our designated Grievance
            Officer.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          4. Data Sharing &amp; Third-Party Processors
        </h2>
        <p>
          H&amp;H does not sell, rent, or trade your personal data to data brokers or advertising
          exchanges. Data is shared solely with trusted operational partners under strict data
          processing agreements:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            <strong className="text-foreground">Payment Processing:</strong> Razorpay Software
            Private Limited (PCI DSS v4.0 certified).
          </li>
          <li>
            <strong className="text-foreground">Logistics &amp; Courier Partners:</strong> India
            Post, DTDC Express Limited, and Shiprocket for parcel delivery.
          </li>
          <li>
            <strong className="text-foreground">Transactional Communications:</strong> Resend and
            Meta Cloud API for order confirmation emails and tracking updates.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          5. Statutory Data Retention &amp; Erasure
        </h2>
        <p>
          In accordance with Section 8(7) of the DPDP Act, 2023, personal data is retained only for
          as long as necessary to fulfill the original purpose or comply with Indian statutory
          obligations:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            <strong className="text-foreground">Tax Invoices &amp; Accounting Records:</strong>{' '}
            Retained for 8 statutory years as mandated by Section 36 of the CGST Act, 2017.
          </li>
          <li>
            <strong className="text-foreground">Authentication OTPs:</strong> Ephemeral codes are
            automatically erased within 24 hours of generation.
          </li>
          <li>
            <strong className="text-foreground">Transactional Outbox Payloads:</strong> Anonymized
            and archived after 30 calendar days.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-foreground">
          6. Your Rights Under DPDP Act, 2023
        </h2>
        <p>
          As a Data Principal, you have the right to request access to the personal data we hold
          about you, request correction of inaccurate details, or request erasure of personal data
          that is no longer required for legal or contractual purposes.
        </p>
        <p>
          To exercise your rights or submit a data privacy inquiry, please visit our dedicated{' '}
          <Link href="/grievance" className="text-accent hover:underline font-medium">
            Grievance Redressal Desk
          </Link>{' '}
          or contact our Nodal Officer at{' '}
          <a
            href={`mailto:${DEFAULT_BRAND_IDENTITY.grievanceOfficer.email}`}
            className="text-accent hover:underline"
          >
            {DEFAULT_BRAND_IDENTITY.grievanceOfficer.email}
          </a>
          .
        </p>
      </section>
    </LegalPageShell>
  );
}
