import { Clock, Shield, Sparkles, Truck } from 'lucide-react';

import type { StorefrontReassurance } from '@hh/domain';

export function ReassuranceSection({ items }: { items: StorefrontReassurance[] }) {
  if (items.length === 0) return null;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'truck':
        return <Truck size={22} style={{ color: 'var(--color-primary)' }} />;
      case 'shield':
        return <Shield size={22} style={{ color: 'var(--color-primary)' }} />;
      case 'clock':
        return <Clock size={22} style={{ color: 'var(--color-primary)' }} />;
      case 'sparkles':
      default:
        return <Sparkles size={22} style={{ color: 'var(--color-accent)' }} />;
    }
  };

  return (
    <section
      style={{
        paddingTop: '48px',
        paddingBottom: '48px',
        borderTop: '1px solid var(--color-border)',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        marginTop: '64px'
      }}
    >
      <div className="royale-container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '32px'
          }}
        >
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '12px'
              }}
            >
              <div
                style={{
                  padding: '10px',
                  backgroundColor: 'var(--color-bg)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {renderIcon(item.icon)}
              </div>
              <div>
                <h4
                  style={{
                    margin: '0 0 4px 0',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--color-primary)'
                  }}
                >
                  {item.title}
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.5
                  }}
                >
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
