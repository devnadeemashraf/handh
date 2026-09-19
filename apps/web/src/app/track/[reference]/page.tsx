import { createDbClient, findFulfillmentByReference } from '@hh/db';
import TrackingCard from './TrackingCard';
import { PackageX, MessageCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export default async function TrackingPage(props: { params: Promise<{ reference: string }> }) {
  const params = await props.params;
  const db = getDatabase();

  const record = await findFulfillmentByReference(db, params.reference);

  if (!record) {
    return (
      <div className="track-wrapper">
        <div
          className="admin-card track-box"
          style={{
            textAlign: 'center',
            padding: '40px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            marginTop: '40px'
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '16px',
              backgroundColor: 'rgba(127, 29, 29, 0.4)',
              border: '1px solid rgba(220, 38, 38, 0.4)',
              color: '#F87171',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <PackageX style={{ width: '24px', height: '24px' }} />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontFamily: 'serif', color: '#FDFBF7', margin: 0 }}>
            Shipment Not Found
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#8BAAA0', lineHeight: 1.6, margin: 0 }}>
            We could not find an active dispatch matching reference{' '}
            <span style={{ fontFamily: 'monospace', color: '#C5A880' }}>{params.reference}</span>.
            Please verify your consignment link or reach out to our workshop concierge.
          </p>
          <div style={{ paddingTop: '8px' }}>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn-secondary"
              style={{
                color: '#C5A880',
                borderColor: '#1C4D3E',
                textDecoration: 'none'
              }}
            >
              <MessageCircle style={{ width: '16px', height: '16px' }} />
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
