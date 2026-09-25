import {
  Building2,
  ChevronRight,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Scale,
  ShieldAlert,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { ThemeInjector } from '@/components/layout/ThemeInjector';

import type { Metadata } from 'next';

import { findStoreBySlug, getCategoryTree, getSharedDbClient } from '@hh/db';
import {
  DEFAULT_BRAND_IDENTITY,
  DEFAULT_CORPORATE_COORDINATES,
  DEFAULT_GRIEVANCE_OFFICER,
  resolveStorefrontConfig
} from '@hh/domain';

import { GrievanceForm } from './GrievanceForm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Statutory Consumer Grievance Redressal | ${DEFAULT_BRAND_IDENTITY.name}`,
  description:
    'Designated Grievance Officer disclosures, statutory 48-hour SLA acknowledgement, and official grievance redressal mechanism under Consumer Protection (E-Commerce) Rules, 2020.'
};

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export default async function GrievancePage() {
  const db = getDatabase();
  const store = await findStoreBySlug(db, 'hh');

  const categories = store ? await getCategoryTree(db, store.id) : [];
  const storefrontConfig = store ? resolveStorefrontConfig(store.settings.storefront) : undefined;

  const officerName = process.env['GRIEVANCE_OFFICER_NAME'] || DEFAULT_GRIEVANCE_OFFICER.name;
  const officerDesignation =
    process.env['GRIEVANCE_OFFICER_DESIGNATION'] || DEFAULT_GRIEVANCE_OFFICER.designation;
  const officerEmail = process.env['GRIEVANCE_OFFICER_EMAIL'] || DEFAULT_GRIEVANCE_OFFICER.email;
  const officerPhone = process.env['GRIEVANCE_OFFICER_PHONE'] || DEFAULT_GRIEVANCE_OFFICER.phone;

  const companyLegalName =
    process.env['COMPANY_LEGAL_NAME'] || DEFAULT_CORPORATE_COORDINATES.legalName;
  const companyAddress =
    process.env['COMPANY_REGISTERED_ADDRESS'] || DEFAULT_CORPORATE_COORDINATES.registeredAddress;
  const companyCin = process.env['COMPANY_CIN'] || DEFAULT_CORPORATE_COORDINATES.cin;
  const companyGstin = process.env['COMPANY_GSTIN'] || DEFAULT_CORPORATE_COORDINATES.gstin;

  return (
    <>
      {storefrontConfig && <ThemeInjector theme={storefrontConfig.theme} />}
      {storefrontConfig?.announcement && (
        <AnnouncementBar announcement={storefrontConfig.announcement} />
      )}
      <Header storeName={store?.name ?? DEFAULT_BRAND_IDENTITY.name} categories={categories} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Breadcrumb Navigation */}
        <nav
          className="mb-8 flex items-center gap-2 text-xs text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          <span className="text-foreground font-medium">Grievance Redressal</span>
        </nav>

        {/* Hero & Statutory Authority Header */}
        <div className="border-b border-border pb-8 mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent tracking-wide uppercase">
            <Scale className="h-3.5 w-3.5" />
            <span>Consumer Protection (E-Commerce) Rules, 2020</span>
          </div>

          <h1 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            Statutory Grievance Redressal
          </h1>
          <p className="mt-3 max-w-3xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            In compliance with Rule 4(4) and Rule 5(3)(f) of the Consumer Protection (E-Commerce)
            Rules, 2020 notified under the Consumer Protection Act, 2019, H&amp;H has established an
            official nodal grievance redressal desk to address customer concerns with guaranteed
            timelines.
          </p>
        </div>

        {/* Grid: Statutory Disclosures */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Card 1: Nodal Grievance Officer */}
          <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-3 text-accent mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Designated Officer
                  </span>
                  <h2 className="text-base font-serif font-bold text-foreground">
                    Grievance Officer
                  </h2>
                </div>
              </div>

              <div className="space-y-3.5 text-xs sm:text-sm">
                <div>
                  <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">
                    Officer Name
                  </span>
                  <p className="font-semibold text-foreground text-sm mt-0.5">{officerName}</p>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">
                    Designation
                  </span>
                  <p className="text-foreground mt-0.5">{officerDesignation}</p>
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <Mail className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">
                      Direct Email
                    </span>
                    <a
                      href={`mailto:${officerEmail}`}
                      className="text-foreground hover:text-accent font-medium transition-colors"
                    >
                      {officerEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <Phone className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">
                      Direct Telephone
                    </span>
                    <a
                      href={`tel:${officerPhone.replace(/\s+/g, '')}`}
                      className="text-foreground hover:text-accent font-medium transition-colors"
                    >
                      {officerPhone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <Clock className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">
                      Operating Hours
                    </span>
                    <p className="text-foreground mt-0.5">
                      {DEFAULT_GRIEVANCE_OFFICER.workingHours}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-border/80 bg-secondary/30 p-3.5 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground block mb-1">
                Statutory SLA Guarantees:
              </span>
              <p>• 48 Hours: Acknowledgment with unique reference</p>
              <p>• 30 Days: Full investigation &amp; dispute resolution</p>
            </div>
          </div>

          {/* Card 2: Registered Corporate Coordinates */}
          <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-3 text-accent mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Rule 5(3)(f) Mandate
                  </span>
                  <h2 className="text-base font-serif font-bold text-foreground">
                    Corporate Identity
                  </h2>
                </div>
              </div>

              <div className="space-y-3.5 text-xs sm:text-sm">
                <div>
                  <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">
                    Registered Legal Entity
                  </span>
                  <p className="font-semibold text-foreground mt-0.5">{companyLegalName}</p>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">
                    Corporate Identity Number (CIN)
                  </span>
                  <p className="font-mono text-xs font-medium text-foreground mt-0.5">
                    {companyCin}
                  </p>
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">
                    GSTIN
                  </span>
                  <p className="font-mono text-xs font-medium text-foreground mt-0.5">
                    {companyGstin}
                  </p>
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">
                      Registered Office Address
                    </span>
                    <p className="text-foreground leading-relaxed mt-0.5">{companyAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-border/80 bg-secondary/30 p-3.5 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground block mb-1">
                Tax &amp; Regulatory Compliance:
              </span>
              <p>
                Registered under Ministry of Corporate Affairs (MCA) &amp; Central Goods &amp;
                Services Tax (CGST) Act, 2017.
              </p>
            </div>
          </div>

          {/* Card 3: External Escalation Pathways */}
          <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-3 text-accent mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    Consumer Rights
                  </span>
                  <h2 className="text-base font-serif font-bold text-foreground">
                    External Escalations
                  </h2>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                If your grievance remains unaddressed past our 30-day statutory resolution window,
                you have the legal right to escalate your complaint directly to the Government of
                India&apos;s Department of Consumer Affairs:
              </p>

              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-border p-3 bg-background">
                  <span className="font-semibold text-foreground block">
                    National Consumer Helpline (NCH)
                  </span>
                  <p className="text-muted-foreground mt-0.5">
                    Toll-Free Helpline: <span className="font-semibold text-foreground">1915</span>{' '}
                    or SMS to 8800001915
                  </p>
                  <a
                    href="https://consumerhelpline.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-accent hover:underline mt-1 font-medium"
                  >
                    <span>consumerhelpline.gov.in</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <div className="rounded-xl border border-border p-3 bg-background">
                  <span className="font-semibold text-foreground block">
                    e-Daakhil Consumer Commission Portal
                  </span>
                  <p className="text-muted-foreground mt-0.5">
                    Online electronic filing of consumer disputes before District, State, and
                    National Commissions.
                  </p>
                  <a
                    href="https://edaakhil.nic.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-accent hover:underline mt-1 font-medium"
                  >
                    <span>edaakhil.nic.in</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Full compliance with Consumer Protection Act, 2019</span>
            </div>
          </div>
        </div>

        {/* Section: Interactive Grievance Form */}
        <div className="max-w-3xl mx-auto">
          <GrievanceForm />
        </div>
      </main>

      <Footer
        storeName={store?.name ?? DEFAULT_BRAND_IDENTITY.name}
        instagramHandle={store?.settings.instagramHandle}
      />
    </>
  );
}
