'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItem {
  id: string;
  title: string;
  content: string;
}

export function ProductAccordion({
  items = [
    {
      id: 'craftsmanship',
      title: 'Artisanal Craftsmanship',
      content:
        'Individually handcrafted and hand-finished with meticulous attention to line, balance, and contour. Designed to sit comfortably and securely on top of an Abaya or statement modesty wear without snagging fabric.'
    },
    {
      id: 'shipping',
      title: 'Courier Shipping & Tracking',
      content:
        'Every parcel is personally inspected, packaged, and handed directly to India Post or DTDC couriers. Once dispatched, you will receive a direct tracking link accessible through your H&H account and email notifications.'
    },
    {
      id: 'care',
      title: 'Care Instructions',
      content:
        'Keep away from direct moisture, perfumes, and harsh chemicals. Gently polish with a dry microfiber cloth after wear and store in the provided protective pouch.'
    }
  ]
}: {
  items?: AccordionItem[];
}) {
  const [openItem, setOpenItem] = useState<string | null>('craftsmanship');

  const toggle = (id: string) => {
    setOpenItem(openItem === id ? null : id);
  };

  return (
    <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '32px' }}>
      {items.map((item) => {
        const isOpen = openItem === item.id;
        return (
          <div key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
            <button
              onClick={() => toggle(item.id)}
              style={{
                width: '100%',
                padding: '20px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'transparent',
                border: 'none',
                textAlign: 'left',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--color-primary)',
                cursor: 'pointer'
              }}
              aria-expanded={isOpen}
            >
              <span>{item.title}</span>
              <ChevronDown
                size={18}
                style={{
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  color: 'var(--color-accent)'
                }}
              />
            </button>
            {isOpen && (
              <div
                style={{
                  paddingBottom: '20px',
                  color: 'var(--color-text-muted)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6
                }}
              >
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
