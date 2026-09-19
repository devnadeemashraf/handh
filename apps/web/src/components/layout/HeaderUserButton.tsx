'use client';

import { Heart, LogOut, Package, Settings, Shield, User as UserIcon, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';

export function HeaderUserButton() {
  const { user, isLoading, openAuthModal, logout } = useAuth();

  if (isLoading) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-secondary" />;
  }

  if (!user) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          openAuthModal({ reason: 'Sign in to access your saved orders, addresses, and wishlist.' })
        }
        className="rounded-full border-accent/60 text-xs font-semibold tracking-wider text-primary hover:bg-primary hover:text-primary-foreground transition-all"
      >
        <UserIcon className="mr-1.5 h-3.5 w-3.5" />
        <span>Sign In</span>
      </Button>
    );
  }

  // Initial letter
  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'H';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 rounded-full border border-border bg-card/80 px-2.5 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-secondary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Account menu"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initial}
          </span>
          <span className="max-w-[110px] truncate font-medium">{user.name || user.phone}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-1">
        {/* User Ribbon */}
        <DropdownMenuLabel className="bg-secondary/30 rounded-t-sm px-3 py-2.5">
          <p className="font-bold text-sm text-primary leading-tight">
            {user.name || 'H&H Patron'}
          </p>
          <p className="text-xs text-muted-foreground font-normal mt-0.5">{user.phone}</p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Links */}
        <DropdownMenuItem asChild>
          <Link
            href="/account"
            className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer"
          >
            <UserIcon className="h-4 w-4 text-primary" />
            <span>My Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/account/orders"
            className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer"
          >
            <Package className="h-4 w-4 text-primary" />
            <span>Order History</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/account/addresses"
            className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer"
          >
            <Settings className="h-4 w-4 text-primary" />
            <span>Saved Addresses</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/account/family"
            className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer"
          >
            <Users className="h-4 w-4 text-primary" />
            <span>Family & Sizes</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link
            href="/account/wishlist"
            className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer"
          >
            <Heart className="h-4 w-4 text-primary" />
            <span>Saved Wishlist</span>
          </Link>
        </DropdownMenuItem>

        {(user.role === 'admin' || user.role === 'super_admin') && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/admin"
                className="flex items-center gap-2.5 bg-primary/95 text-accent hover:bg-primary hover:text-accent font-semibold px-3 py-2 text-sm rounded-sm cursor-pointer"
              >
                <Shield className="h-4 w-4 text-accent" />
                <span>Admin Portal</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => logout()}
          className="flex items-center gap-2.5 px-3 py-2 text-sm text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
