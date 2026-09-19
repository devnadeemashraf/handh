'use client';

import { Heart, LogOut, MapPin, Package, Shield, User as UserIcon, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export function AccountNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    { href: '/account', label: 'My Profile', icon: UserIcon },
    { href: '/account/orders', label: 'Order History', icon: Package },
    { href: '/account/addresses', label: 'Saved Addresses', icon: MapPin },
    { href: '/account/family', label: 'Family & Sizes', icon: Users },
    { href: '/account/wishlist', label: 'Saved Wishlist', icon: Heart }
  ];

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="p-3">
        {/* User Ribbon */}
        <div className="mb-2 border-b border-border px-3 py-3">
          <p className="font-bold text-sm text-primary leading-tight">
            {user?.name || 'H&H Patron'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{user?.phone}</p>
        </div>

        {/* Links */}
        <div className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary text-primary font-semibold shadow-xs'
                    : 'text-muted-foreground hover:bg-secondary/40 hover:text-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Admin Portal Link */}
        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <div className="mt-2 pt-2 border-t border-border">
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-md bg-primary px-3 py-2.5 text-sm font-semibold text-accent hover:bg-primary/90 transition-colors shadow-xs"
            >
              <Shield className="h-4 w-4 shrink-0 text-accent" />
              <span>Admin Portal</span>
            </Link>
          </div>
        )}

        {/* Sign Out Action */}
        <div className="mt-2 border-t border-border pt-2">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
