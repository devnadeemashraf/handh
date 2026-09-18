import { Money } from '@hh/domain';

export default function HomePage() {
  // Demonstration of server-side domain primitive invocation
  const startingPrice = Money.fromMinor(59900, 'INR');

  return (
    <main style={{ maxWidth: 800, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <header>
        <span
          style={{
            fontSize: 13,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#666'
          }}
        >
          H&amp;H Official
        </span>
        <h1
          style={{
            fontSize: '2.5rem',
            fontWeight: 600,
            margin: '16px 0 8px',
            letterSpacing: '-0.02em'
          }}
        >
          Crafted with Precision
        </h1>
        <p
          style={{
            color: '#555',
            fontSize: '1.1rem',
            maxWidth: 480,
            margin: '0 auto 32px',
            lineHeight: 1.5
          }}
        >
          Curated collections and modest essentials. Launching with signature pieces starting at{' '}
          <strong>{startingPrice.format('en-IN')}</strong>.
        </p>
      </header>

      <section
        style={{
          border: '1px solid #eaeaea',
          borderRadius: 8,
          padding: 32,
          backgroundColor: '#fff'
        }}
      >
        <p style={{ margin: 0, color: '#444', fontSize: '0.95rem' }}>
          Storefront initializing. Powered by our reliable, modular commerce engine.
        </p>
      </section>
    </main>
  );
}
