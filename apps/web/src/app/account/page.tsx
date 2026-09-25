'use client';

import { Check, CheckCircle2, Phone } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { triggerHaptic } from '@/lib/haptic';

import { DEFAULT_BRAND_IDENTITY } from '@hh/domain';

import { useAuth } from '../../context/AuthContext';

export default function AccountProfilePage() {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [whatsappOptIn, setWhatsappOptIn] = useState(user?.whatsappOptIn ?? true);
  const [promotionsOptIn, setPromotionsOptIn] = useState(true);
  const [restockAlertsOptIn, setRestockAlertsOptIn] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setWhatsappOptIn(user.whatsappOptIn ?? true);
    }
  }, [user]);

  // Debounced auto-save for notification preferences (Spec 09 §9.1c)
  const triggerDebouncedAutoSave = (newWhatsapp: boolean) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/auth/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ whatsappOptIn: newWhatsapp })
        });
        if (res.ok) {
          await refreshUser();
          addToast({
            title: 'Preferences updated',
            description: 'Your communication preferences have been saved.'
          });
        }
      } catch {
        // Ignored
      }
    }, 600);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          whatsappOptIn
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to update profile.');
        setIsSaving(false);
        return;
      }

      await refreshUser();
      setSaveSuccess(true);
      triggerHaptic('success');
      addToast({
        title: 'Profile updated',
        description: 'Your profile changes have been saved.'
      });
      setIsSaving(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setErrorMessage('Network error while saving profile.');
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-card rounded-md border border-border/80 p-6 sm:p-8 shadow-xs flex flex-col gap-6">
      {/* Page Header */}
      <div className="border-b border-border/60 pb-4">
        <h1 className="font-serif text-2xl font-medium text-foreground tracking-tight mb-1">
          My Profile &amp; Preferences
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Manage your personal details, email receipts, and communication preferences.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Your profile preferences were updated successfully.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-sm text-destructive text-xs sm:text-sm font-medium">
          {errorMessage}
        </div>
      )}

      {/* 1. Account Details Form */}
      <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
        {/* Mobile Number (Read-only / verified primary key) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Registered Mobile Number
          </label>
          <div className="flex items-center justify-between p-3 bg-secondary/30 border border-border/70 rounded-sm text-foreground text-sm font-medium">
            <div className="flex items-center gap-2 font-mono tabular-nums">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{user?.phone}</span>
            </div>
            <Badge
              variant="outline"
              className="gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-medium text-xs rounded-sm"
            >
              <Check className="h-3 w-3" /> Verified
            </Badge>
          </div>
          <span className="text-[11px] text-muted-foreground/80 mt-1 block">
            Primary identifier used for secure OTP sign-in and delivery notifications.
          </span>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Full Name
          </label>
          <Input
            type="text"
            placeholder="e.g. Fatima Al-Zahra"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 text-sm rounded-sm"
          />
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Email Address (for tax invoices &amp; receipts)
          </label>
          <Input
            type="email"
            placeholder={`e.g. patron@${DEFAULT_BRAND_IDENTITY.supportEmail.split('@')[1]}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 text-sm rounded-sm"
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSaving}
            className="h-10 px-5 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-sm active:scale-[0.98] transition-transform"
          >
            {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
          </Button>
        </div>
      </form>

      {/* 2. Notification Preferences (Spec 09 §9.1c) */}
      <div className="border-t border-border/60 pt-6 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Notification Preferences
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure how you wish to receive order progress and collection announcements.
          </p>
        </div>

        <div className="divide-y divide-border/60 border border-border/70 rounded-sm overflow-hidden bg-secondary/15">
          {/* Row 1: Order Updates (Locked ON) */}
          <div className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Order &amp; Delivery Updates</p>
              <p className="text-xs text-muted-foreground">
                Critical dispatch, AWB tracking, and statutory tax invoices (required).
              </p>
            </div>
            <Badge
              variant="outline"
              className="text-xs text-muted-foreground border-border rounded-sm"
            >
              Always Active
            </Badge>
          </div>

          {/* Row 2: WhatsApp Concierge Updates */}
          <div className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">WhatsApp Concierge Updates</p>
              <p className="text-xs text-muted-foreground">
                Receive live courier handover and real-time tracking links directly on WhatsApp.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappOptIn}
                onChange={(e) => {
                  triggerHaptic('selection');
                  const nextVal = e.target.checked;
                  setWhatsappOptIn(nextVal);
                  triggerDebouncedAutoSave(nextVal);
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {/* Row 3: Promotions & New Arrivals */}
          <div className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Promotions &amp; Seasonal Drops</p>
              <p className="text-xs text-muted-foreground">
                Occasional announcements of private sales and new modest couture arrivals.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={promotionsOptIn}
                onChange={(e) => {
                  triggerHaptic('selection');
                  setPromotionsOptIn(e.target.checked);
                  addToast({
                    title: 'Preferences updated',
                    description: 'Promotional preferences updated.'
                  });
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {/* Row 4: Restock Alerts */}
          <div className="p-3.5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                Restock &amp; Back-in-Stock Alerts
              </p>
              <p className="text-xs text-muted-foreground">
                Alerts when out-of-stock items in your size or wishlist are replenished.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={restockAlertsOptIn}
                onChange={(e) => {
                  triggerHaptic('selection');
                  setRestockAlertsOptIn(e.target.checked);
                  addToast({
                    title: 'Preferences updated',
                    description: 'Restock notification preferences updated.'
                  });
                }}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
