import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import type { StorefrontAnnouncement } from '@hh/domain';

export function AnnouncementBar({ announcement }: { announcement: StorefrontAnnouncement }) {
  if (!announcement.enabled || !announcement.text) {
    return null;
  }

  const variantClasses = {
    default: 'bg-primary text-primary-foreground',
    emerald: 'bg-primary text-primary-foreground',
    gold: 'bg-accent text-accent-foreground font-medium',
    subtle: 'bg-secondary text-secondary-foreground'
  }[announcement.variant ?? 'default'];

  const content = (
    <aside
      className={cn(
        'flex items-center justify-center gap-2.5 px-4 py-2 text-center text-xs tracking-wide transition-colors',
        variantClasses
      )}
      role="region"
      aria-label="Announcement"
    >
      {announcement.badge && (
        <Badge
          variant={announcement.badgeVariant ?? 'gold'}
          className="text-[0.65rem] uppercase font-bold tracking-widest px-2 py-0.5"
        >
          {announcement.badge}
        </Badge>
      )}
      <span className="font-medium">{announcement.text}</span>
    </aside>
  );

  if (announcement.link) {
    return (
      <Link href={announcement.link} className="block transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
