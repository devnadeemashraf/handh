'use client';

import {
  BarChart3,
  Boxes,
  ExternalLink,
  History,
  LogOut,
  Menu,
  Package,
  Palette,
  ShieldCheck,
  Sliders,
  Tag,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export default function AdminHeader() {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      window.location.href = '/';
    } catch {
      window.location.href = '/';
    }
  };

  const navGroups = [
    {
      group: 'Operations',
      items: [
        { href: '/admin/orders', label: 'Orders', icon: Package },
        { href: '/admin/inventory', label: 'Inventory', icon: Boxes }
      ]
    },
    {
      group: 'Store & Marketing',
      items: [
        { href: '/admin/insights', label: 'Insights', icon: BarChart3 },
        { href: '/admin/coupons', label: 'Coupons', icon: Tag },
        { href: '/admin/brand', label: 'Brand', icon: Palette }
      ]
    },
    {
      group: 'Governance',
      items: [
        { href: '/admin/service-control', label: 'Services', icon: Sliders },
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/audit-logs', label: 'Audit Logs', icon: History }
      ]
    }
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-card text-card-foreground">
      {/* Top Identity */}
      <div>
        <div className="border-b border-border p-5">
          <Link href="/admin/orders" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-xs font-bold text-accent shadow-xs">
              H&amp;H
            </div>
            <div>
              <span className="font-serif text-base font-bold text-primary block leading-tight">
                Workshop Operations
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Management Portal
              </span>
            </div>
          </Link>
          <div className="mt-3">
            <Badge
              variant="gold"
              className="text-[10px] uppercase tracking-wider font-semibold py-0.5 px-2"
            >
              <ShieldCheck className="mr-1 h-3 w-3 text-accent" />
              <span>Protected Portal</span>
            </Badge>
          </div>
        </div>

        {/* Grouped Navigation Links */}
        <nav className="p-3 space-y-5" aria-label="Admin navigation">
          {navGroups.map((group) => (
            <div key={group.group}>
              <h3 className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.group}
              </h3>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors select-none',
                        isActive
                          ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0',
                          isActive ? 'text-accent' : 'text-muted-foreground'
                        )}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-border p-3 space-y-1">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-md px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <span className="flex items-center gap-2.5">
            <ExternalLink className="h-4 w-4" />
            <span>Live Store</span>
          </span>
          <span className="text-[10px] text-muted-foreground">Open &rarr;</span>
        </Link>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full justify-start text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive px-3 py-2 h-auto"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? 'Exiting...' : 'Sign Out'}</span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Fixed Left) */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-40 border-r border-border bg-card shadow-xs">
        {sidebarContent}
      </aside>

      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/95 backdrop-blur px-4">
        <div className="flex items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 p-0"
                aria-label="Open admin navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <SheetHeader className="sr-only">
                <SheetTitle>Admin Navigation</SheetTitle>
                <SheetDescription>Access admin portal modules</SheetDescription>
              </SheetHeader>
              {sidebarContent}
            </SheetContent>
          </Sheet>

          <Link href="/admin/orders" className="flex items-center gap-2">
            <span className="font-serif text-lg font-bold text-primary">H&amp;H Admin</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            aria-label="Exit admin"
            className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
    </>
  );
}
