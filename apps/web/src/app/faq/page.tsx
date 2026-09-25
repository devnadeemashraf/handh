import { LegalPageShell } from '@/components/legal/LegalPageShell';
import { getCachedCategories, getCachedStore } from '@/lib/catalog-cache';

import type { Metadata } from 'next';

import { DEFAULT_BRAND_IDENTITY } from '@hh/domain';

import { FaqClient } from './FaqClient';

export const metadata: Metadata = {
  title: `Frequently Asked Questions | ${DEFAULT_BRAND_IDENTITY.name}`,
  description:
    'Answers to questions regarding orders, payment security, delivery timelines, modest sizing, returns, and silk garment care.',
  alternates: {
    canonical: `${DEFAULT_BRAND_IDENTITY.websiteUrl}/faq`
  }
};

export default async function FaqPage() {
  const store = await getCachedStore('hh');
  const categories = store ? await getCachedCategories(store.id) : [];

  return (
    <LegalPageShell
      title="Frequently Asked Questions"
      subtitle="Find fast, transparent answers regarding orders, domestic shipping, fabric care, and our 7-day return guarantee."
      badgeText="Client Care & Self-Serve"
      lastUpdated="September 2026"
      storeName={store?.name ?? DEFAULT_BRAND_IDENTITY.name}
      categories={categories}
      instagramHandle={store?.settings.instagramHandle}
    >
      <div className="not-prose">
        <FaqClient />
      </div>
    </LegalPageShell>
  );
}
