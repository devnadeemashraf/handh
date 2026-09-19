import Link from 'next/link';

import type { StorefrontAnnouncement } from '@hh/domain';

export function AnnouncementBar({ announcement }: { announcement: StorefrontAnnouncement }) {
  if (!announcement.enabled || !announcement.text) {
    return null;
  }

  const content = (
    <div
      style={{
        backgroundColor: 'var(--color-primary)',
        color: '#ffffff',
        fontSize: '0.8rem',
        letterSpacing: '0.04em',
        padding: '8px 16px',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px'
      }}
    >
      {announcement.badge && (
        <span
          style={{
            backgroundColor: 'var(--color-accent)',
            color: '#000000',
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            padding: '2px 8px',
            borderRadius: '9999px'
          }}
        >
          {announcement.badge}
        </span>
      )}
      <span>{announcement.text}</span>
    </div>
  );

  if (announcement.link) {
    return (
      <Link href={announcement.link} style={{ display: 'block' }}>
        {content}
      </Link>
    );
  }

  return content;
}
