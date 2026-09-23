import { ChevronRight, FileText, Scale, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

import { DEFAULT_CORPORATE_COORDINATES, DEFAULT_GRIEVANCE_OFFICER } from '@hh/domain';

import type { CategoryTreeItem } from '@hh/domain';

export interface LegalPageShellProps {
  title: string;
  subtitle: string;
  badgeText: string;
  lastUpdated: string;
  storeName?: string | undefined;
  categories?: CategoryTreeItem[] | undefined;
  instagramHandle?: string | undefined;
  children: React.ReactNode;
}

export function LegalPageShell({
  title,
  subtitle,
  badgeText,
  lastUpdated,
  storeName = 'H&H',
  categories = [],
  instagramHandle,
  children
}: LegalPageShellProps) {
  return (
    <>
      <Header storeName={storeName} categories={categories} />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Breadcrumb Navigation */}
        <nav
          className="mb-8 flex items-center gap-2 text-xs text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          <span className="text-foreground font-medium">{title}</span>
        </nav>

        {/* Hero Header */}
        <div className="border-b border-border pb-8 mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent tracking-wide uppercase">
            <Scale className="h-3.5 w-3.5" />
            <span>{badgeText}</span>
          </div>

          <h1 className="mt-4 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl">
            {subtitle}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>
              <strong>Effective Date:</strong> {lastUpdated}
            </span>
            <span>•</span>
            <span>
              <strong>Jurisdiction:</strong> Hyderabad, Telangana, India
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Statutory Compliance Verified</span>
            </span>
          </div>
        </div>

        {/* Policy Body Content */}
        <article className="prose prose-invert max-w-none space-y-8 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {children}
        </article>

        {/* Corporate Disclosure & Grievance Box */}
        <div className="mt-14 rounded-2xl border border-border bg-card/60 p-6 sm:p-8 text-xs sm:text-sm shadow-sm">
          <div className="flex items-center gap-3 text-accent mb-3">
            <FileText className="h-5 w-5" />
            <h3 className="font-serif font-bold text-foreground text-base">
              Corporate Legal Coordinates &amp; Grievance Redressal
            </h3>
          </div>
          <p className="text-muted-foreground leading-relaxed mb-4">
            This policy is published in accordance with the Information Technology Act, 2000 and the
            Consumer Protection (E-Commerce) Rules, 2020 by{' '}
            <strong className="text-foreground">{DEFAULT_CORPORATE_COORDINATES.legalName}</strong>.
            For dispute resolution, you may reach our designated Grievance Officer:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs border-t border-border/80 pt-4">
            <div>
              <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">
                Grievance Officer
              </span>
              <p className="font-semibold text-foreground mt-0.5">
                {DEFAULT_GRIEVANCE_OFFICER.name} ({DEFAULT_GRIEVANCE_OFFICER.designation})
              </p>
              <p className="text-muted-foreground mt-0.5">
                Email:{' '}
                <a
                  href={`mailto:${DEFAULT_GRIEVANCE_OFFICER.email}`}
                  className="text-accent hover:underline"
                >
                  {DEFAULT_GRIEVANCE_OFFICER.email}
                </a>
              </p>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px] uppercase tracking-wider">
                Registered Office
              </span>
              <p className="text-foreground mt-0.5">
                {DEFAULT_CORPORATE_COORDINATES.registeredAddress}
              </p>
              <p className="text-muted-foreground mt-0.5">
                CIN: {DEFAULT_CORPORATE_COORDINATES.cin} | GSTIN:{' '}
                {DEFAULT_CORPORATE_COORDINATES.gstin}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
            <Link
              href="/grievance"
              className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1.5"
            >
              <span>Visit Consumer Grievance Desk (48-Hour SLA)</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer storeName={storeName} instagramHandle={instagramHandle} />
    </>
  );
}
