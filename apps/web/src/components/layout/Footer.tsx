import Link from 'next/link';

export function Footer({
  storeName,
  instagramHandle
}: {
  storeName: string;
  instagramHandle?: string | undefined;
}) {
  return (
    <footer
      style={{
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        paddingTop: '64px',
        paddingBottom: '48px',
        marginTop: '96px'
      }}
    >
      <div className="royale-container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '48px',
            marginBottom: '48px'
          }}
        >
          {/* Column 1: Brand */}
          <div>
            <span
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--color-primary)',
                letterSpacing: '0.05em'
              }}
            >
              {storeName}
            </span>
            <p
              style={{
                color: 'var(--color-text-muted)',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                marginTop: '12px'
              }}
            >
              Crafted with intention. Delivering signature modest wear accessories and refined
              essentials directly to your doorstep.
            </p>
          </div>

          {/* Column 2: Order Journey */}
          <div>
            <span className="royale-eyebrow" style={{ display: 'block', marginBottom: '16px' }}>
              Order &amp; Fulfillment
            </span>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                fontSize: '0.9rem',
                color: 'var(--color-text-muted)',
                lineHeight: 2
              }}
            >
              <li>Encrypted Razorpay Checkout</li>
              <li>Hand-Inspected &amp; Packed</li>
              <li>India Post &amp; DTDC Couriers</li>
              <li>Direct In-App Shipment Tracking</li>
            </ul>
          </div>

          {/* Column 3: Instagram & Socials */}
          <div>
            <span className="royale-eyebrow" style={{ display: 'block', marginBottom: '16px' }}>
              Connect
            </span>
            {instagramHandle ? (
              <a
                href={`https://instagram.com/${instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--color-primary)',
                  fontSize: '0.9rem',
                  fontWeight: 500
                }}
              >
                Follow @{instagramHandle} on Instagram →
              </a>
            ) : null}
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
              Discover our story and latest design previews on Instagram.
            </p>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            paddingTop: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            fontSize: '0.8rem',
            color: 'var(--color-text-muted)'
          }}
        >
          <span>
            &copy; {new Date().getFullYear()} {storeName}. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="/track">Track Parcel</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
