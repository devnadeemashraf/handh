'use client';

import { ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/ui/button';
import { triggerHaptic } from '@/lib/haptic';

import { AccountNav } from '../../components/account/AccountNav';
import { useAuth } from '../../context/AuthContext';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, openAuthModal } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm font-medium animate-pulse">
          Loading your profile...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full bg-card rounded-2xl border border-border/80 p-8 sm:p-9 text-center shadow-sm">
          <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4 text-primary">
            <Lock className="h-6 w-6" />
          </div>

          <h1 className="font-serif text-2xl font-semibold text-foreground mb-2">
            Sign In Required
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Please sign in with your mobile number to view your order history, manage saved delivery
            addresses, and tailor family size preferences.
          </p>

          <Button
            onClick={() => {
              triggerHaptic('medium');
              openAuthModal({ reason: 'Sign in to access your patron account.' });
            }}
            className="w-full h-11 text-sm font-medium tracking-wide active:scale-[0.96] transition-transform duration-150"
          >
            Sign In with Mobile OTP
          </Button>

          <div className="mt-5">
            <Link
              href="/"
              onClick={() => triggerHaptic('selection')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group active:scale-[0.98]"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-[90vh] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb Ribbon */}
        <div className="mb-6 flex items-center gap-2 text-xs">
          <Link
            href="/"
            onClick={() => triggerHaptic('selection')}
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors group active:scale-[0.98]"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Store</span>
          </Link>
          <span className="text-muted-foreground/40">•</span>
          <span className="font-semibold text-foreground">Patron Account</span>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-4 w-full">
            <AccountNav />
          </div>

          {/* Main Content Area */}
          <main className="lg:col-span-8 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
