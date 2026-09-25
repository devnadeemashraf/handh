'use client';

import { Check, CheckCircle2, MessageSquare, Phone } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { triggerHaptic } from '@/lib/haptic';

import { DEFAULT_BRAND_IDENTITY } from '@hh/domain';

import { useAuth } from '../../context/AuthContext';

export default function AccountProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [whatsappOptIn, setWhatsappOptIn] = useState(user?.whatsappOptIn ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
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
      setIsSaving(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setErrorMessage('Network error while saving profile.');
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border/80 p-6 sm:p-8 shadow-sm">
      <div className="border-b border-border/60 pb-4 mb-6">
        <h1 className="font-serif text-2xl font-semibold text-foreground mb-1.5">
          My Profile & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Manage your personal details, email receipts, and WhatsApp concierge communication
          preferences.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mb-5 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Your profile preferences were updated successfully.</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-destructive/10 border border-destructive/30 rounded-xl mb-5 text-destructive text-sm font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* Mobile Number (Read-only / verified primary key) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Registered Mobile Number
          </label>
          <div className="flex items-center justify-between p-3 bg-muted/40 border border-border/70 rounded-lg text-foreground text-sm font-medium">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{user?.phone}</span>
            </div>
            <Badge
              variant="outline"
              className="gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-medium text-xs"
            >
              <Check className="h-3 w-3" /> Verified
            </Badge>
          </div>
          <span className="text-[11px] text-muted-foreground/80 mt-1 block">
            Primary account identifier used for OTP verification and WhatsApp delivery updates.
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
            className="h-10 text-sm"
          />
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Email Address (for tax invoices & receipts)
          </label>
          <Input
            type="email"
            placeholder={`e.g. patron@${DEFAULT_BRAND_IDENTITY.supportEmail.split('@')[1]}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 text-sm"
          />
        </div>

        {/* WhatsApp Concierge Communication */}
        <div className="p-4 bg-secondary/40 border border-border/70 rounded-xl">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={whatsappOptIn}
              onChange={(e) => {
                triggerHaptic('selection');
                setWhatsappOptIn(e.target.checked);
              }}
              className="mt-1 h-4 w-4 rounded border-border accent-primary cursor-pointer"
            />
            <div>
              <span className="font-semibold text-sm text-foreground flex items-center gap-1.5 mb-1">
                <MessageSquare className="h-4 w-4 text-primary" /> WhatsApp Concierge Updates
              </span>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Receive instant order placement confirmations, live DTDC / India Post courier scan
                alerts, and doorstep delivery notifications directly to your WhatsApp.
              </p>
            </div>
          </label>
        </div>

        <Button
          type="submit"
          disabled={isSaving}
          onClick={() => triggerHaptic('medium')}
          className="self-start px-6 h-10 text-sm font-medium active:scale-[0.96] transition-transform duration-150"
        >
          {isSaving ? 'Saving Changes...' : 'Save Profile Details'}
        </Button>
      </form>
    </div>
  );
}
