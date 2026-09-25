'use client';

import {
  ChevronRight,
  Heart,
  MapPin,
  Package,
  Shield,
  User as UserIcon,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { useAuth } from '@/context/AuthContext';
import { triggerHaptic } from '@/lib/haptic';
import { cn } from '@/lib/utils';

import { getBrandPatronLabel } from '@hh/domain';

export function AccountNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    { href: '/account', label: 'My Profile & Preferences', icon: UserIcon },
    { href: '/account/orders', label: 'Order History', icon: Package },
    { href: '/account/wishlist', label: 'Saved Wishlist', icon: Heart },
    { href: '/account/addresses', label: 'Saved Addresses', icon: MapPin },
    { href: '/account/family', label: 'Family & Sizes', icon: Users }
  ];

  // User initials
  const initials = user?.name
    ? user.name
        .trim()
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'P';

  return (
    <div className="bg-card border border-border/80 rounded-md shadow-xs overflow-hidden">
      {/* 1. Header: Initials circle + Name + Phone/Email */}
      <div className="p-4 sm:p-5 border-b border-border/60 flex items-center gap-3.5 bg-secondary/20">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-serif text-base font-semibold shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-serif font-semibold text-base text-foreground truncate">
            {getBrandPatronLabel(user?.name)}
          </p>
          <p className="text-xs text-muted-foreground truncate font-mono tabular-nums">
            {user?.phone || user?.email || 'Patron'}
          </p>
        </div>
      </div>

      {/* 2. Navigation Rows (56px high on mobile per spec 09 §9.1) */}
      <nav className="divide-y divide-border/60" aria-label="Account navigation">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => triggerHaptic('selection')}
              className={cn(
                'min-h-[56px] px-4 py-3.5 flex items-center justify-between text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-foreground hover:bg-secondary/40'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <span>{link.label}</span>
              </div>
              <ChevronRight
                className={cn(
                  'w-4 h-4 transition-transform',
                  isActive ? 'text-primary translate-x-0.5' : 'text-muted-foreground/60'
                )}
              />
            </Link>
          );
        })}
      </nav>

      {/* 3. Admin Portal (if applicable) */}
      {(user?.role === 'admin' || user?.role === 'super_admin') && (
        <div className="p-3 border-t border-border/60 bg-secondary/10">
          <Link
            href="/admin"
            className="flex items-center justify-between h-10 px-3 rounded-sm bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 4. Visually Separated Logout (Spec 09 §9.1: own section, space-6, red text, no icon) */}
      <div className="p-4 border-t border-border/60 bg-muted/20">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            logout();
          }}
          className="w-full h-11 flex items-center justify-center text-sm font-medium text-destructive hover:bg-destructive/10 rounded-sm transition-colors text-center"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
