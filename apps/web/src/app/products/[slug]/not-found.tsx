import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProductNotFound() {
  return (
    <main
      className="royale-container"
      style={{
        paddingTop: '96px',
        paddingBottom: '96px',
        textAlign: 'center',
        maxWidth: '540px'
      }}
    >
      <span className="royale-eyebrow" style={{ display: 'block', marginBottom: '16px' }}>
        Piece Not Found
      </span>
      <h1 className="royale-heading" style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
        A Rare Discovery
      </h1>
      <p
        style={{
          color: 'var(--color-text-muted)',
          fontSize: '1rem',
          lineHeight: 1.6,
          marginBottom: '32px'
        }}
      >
        The item or edition you are searching for is either no longer available, currently
        unreleased, or has moved to an archived collection.
      </p>
      <Link href="/" className="royale-button-primary">
        <ArrowLeft size={16} />
        <span>Return to Catalog</span>
      </Link>
    </main>
  );
}
