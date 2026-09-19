import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import type { StorefrontHero } from '@hh/domain';

export function HeroSection({ hero }: { hero: StorefrontHero }) {
  return (
    <section
      style={{
        paddingTop: '64px',
        paddingBottom: '64px',
        textAlign: 'center',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'rgba(253, 251, 247, 0.6)'
      }}
    >
      <div className="royale-container" style={{ maxWidth: '840px' }}>
        {hero.badgeText && (
          <div style={{ marginBottom: '16px' }}>
            <span className="royale-badge royale-badge-gold">{hero.badgeText}</span>
          </div>
        )}

        {hero.eyebrow && (
          <p className="royale-eyebrow" style={{ margin: '0 0 12px 0' }}>
            {hero.eyebrow}
          </p>
        )}

        <h1
          className="royale-heading"
          style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            lineHeight: 1.15,
            margin: '0 0 20px 0'
          }}
        >
          {hero.title}
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.15rem)',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6,
            maxWidth: '580px',
            margin: '0 auto 32px'
          }}
        >
          {hero.subtitle}
        </p>

        <div>
          <Link href={hero.ctaLink} className="royale-button-primary">
            <span>{hero.ctaText}</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
