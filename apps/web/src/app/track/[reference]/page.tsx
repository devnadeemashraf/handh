import { MessageCircle, PackageX } from 'lucide-react';

import { findFulfillmentByReference, getSharedDbClient } from '@hh/db';

import TrackingCard from './TrackingCard';

export const dynamic = 'force-dynamic';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return getSharedDbClient(databaseUrl);
}

export default async function TrackingPage(props: { params: Promise<{ reference: string }> }) {
  const params = await props.params;
  const db = getDatabase();

  const record = await findFulfillmentByReference(db, params.reference);

  if (!record) {
    return (
      <div className="track-wrapper">
        <div className="admin-card track-box text-center p-8 sm:p-10 flex flex-col items-center gap-4 mt-10">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-center">
            <PackageX className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-semibold text-foreground m-0">
            Shipment Not Found
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed m-0 max-w-md">
            We could not find an active dispatch matching reference{' '}
            <span className="font-mono text-accent font-semibold">{params.reference}</span>. Please
            verify your consignment link or reach out to our workshop concierge.
          </p>
          <div className="pt-2">
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-border/80 bg-card hover:bg-muted/50 text-foreground transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Contact Concierge on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="track-wrapper">
      <TrackingCard fulfillment={record.fulfillment} order={record.order} />
    </div>
  );
}
