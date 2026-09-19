'use client';

import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Eye,
  Power,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Sliders
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import type { ServiceControlConfig, StoreOperatingStatus } from '@hh/domain';

interface ServiceControlDashboardProps {
  initialConfig: ServiceControlConfig;
}

const PRESET_NOTICES = [
  {
    title: 'Payment Gateway Upgrade',
    headline: 'Payment Gateway Upgrade in Progress',
    text: 'Our payment partner is undergoing brief infrastructure enhancements. Browse freely—checkout & payment will resume shortly!'
  },
  {
    title: 'Scheduled Workshop Upgrade',
    headline: 'Checkout & Payments Temporarily Paused',
    text: 'We are currently upgrading our payment & checkout systems. Feel free to browse and keep treasures in your cart—checkout will resume shortly!'
  },
  {
    title: 'Inventory Reconciliation',
    headline: 'Artisanal Inventory Audit in Progress',
    text: 'Our workshop inventory is undergoing real-time synchronization. Your bag is saved—order processing will be back online in moments.'
  }
];

export default function ServiceControlDashboard({ initialConfig }: ServiceControlDashboardProps) {
  const [operatingStatus, setOperatingStatus] = useState<StoreOperatingStatus>(
    initialConfig.operatingStatus
  );
  const [checkoutEnabled, setCheckoutEnabled] = useState<boolean>(initialConfig.checkoutEnabled);
  const [paymentsEnabled, setPaymentsEnabled] = useState<boolean>(initialConfig.paymentsEnabled);
  const [headline, setHeadline] = useState<string>(
    initialConfig.headline || 'Checkout & Payments Temporarily Paused'
  );
  const [maintenanceNotice, setMaintenanceNotice] = useState<string>(
    initialConfig.maintenanceNotice
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const isFullyActive = operatingStatus === 'active' && checkoutEnabled && paymentsEnabled;

  const handleEmergencyPause = () => {
    setOperatingStatus('maintenance');
    setCheckoutEnabled(false);
    setPaymentsEnabled(false);
  };

  const handleRestoreLive = () => {
    setOperatingStatus('active');
    setCheckoutEnabled(true);
    setPaymentsEnabled(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const payload: ServiceControlConfig = {
        operatingStatus,
        checkoutEnabled,
        paymentsEnabled,
        headline: headline.trim() || 'Checkout & Payments Temporarily Paused',
        maintenanceNotice: maintenanceNotice.trim()
      };

      const res = await fetch('/api/admin/settings/service-control', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update service control settings.');
      }

      setSaveSuccess(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Error updating service controls.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="h-5 w-5 text-accent" />
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
              Granular Service Control &amp; Circuit Breakers
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Independently manage core storefront systems. Preserve catalog discovery and bag
            curation even during maintenance.
          </p>
        </div>

        {/* Global Operational Status Pill */}
        <div className="flex items-center gap-3">
          <Badge
            variant={isFullyActive ? 'default' : 'secondary'}
            className={cn(
              'px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider gap-1.5',
              !isFullyActive &&
                'border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10'
            )}
          >
            {isFullyActive ? (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>ALL SYSTEMS OPERATIONAL</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>MAINTENANCE MODE ACTIVE</span>
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Quick Emergency Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={handleEmergencyPause}
          className="rounded-xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 p-4 sm:p-5 flex items-center gap-4 text-left transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-lg bg-destructive/15 flex items-center justify-center shrink-0">
            <Power className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <div className="text-destructive font-semibold text-sm sm:text-base">
              Emergency Pause All Checkouts
            </div>
            <div className="text-destructive/80 text-xs mt-0.5">
              Instantly disable checkout &amp; payments while keeping catalog active
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={handleRestoreLive}
          className="rounded-xl border border-emerald-600/30 bg-emerald-500/5 hover:bg-emerald-500/10 p-4 sm:p-5 flex items-center gap-4 text-left transition-colors cursor-pointer"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm sm:text-base">
              Restore All Live Operations
            </div>
            <div className="text-emerald-600/80 dark:text-emerald-400/80 text-xs mt-0.5">
              Enable active store status, checkout submissions &amp; Razorpay
            </div>
          </div>
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Granular Service Killswitches */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-border space-y-0">
            <CardTitle className="text-base font-semibold">Granular Service Switches</CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
            {/* 1. Global Operating Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <Power className="h-5 w-5 text-accent shrink-0" />
                <div>
                  <div className="font-medium text-foreground text-sm">
                    Global Store Operating Mode
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {operatingStatus === 'active'
                      ? 'Live Mode — Storefront operates normally'
                      : 'Maintenance Mode — Core transactions restricted with customer guidance banner'}
                  </div>
                </div>
              </div>

              <div className="inline-flex rounded-lg border border-border bg-card p-1 shadow-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setOperatingStatus('active')}
                  className={cn(
                    'rounded-md px-3.5 py-1 text-xs font-semibold transition-colors',
                    operatingStatus === 'active'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setOperatingStatus('maintenance')}
                  className={cn(
                    'rounded-md px-3.5 py-1 text-xs font-semibold transition-colors',
                    operatingStatus === 'maintenance'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Maintenance
                </button>
              </div>
            </div>

            {/* 2. Checkout & Bag Processing */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-accent shrink-0" />
                <div>
                  <div className="font-medium text-foreground text-sm">
                    Checkout &amp; Order Placement
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Allows shoppers to initiate checkout and lock inventory reservations
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant={checkoutEnabled ? 'default' : 'destructive'}
                size="sm"
                onClick={() => setCheckoutEnabled(!checkoutEnabled)}
                aria-label={checkoutEnabled ? 'Disable Checkout' : 'Enable Checkout'}
                className="h-8 px-4 text-xs font-semibold self-start sm:self-auto"
              >
                {checkoutEnabled ? 'Enabled' : 'Paused'}
              </Button>
            </div>

            {/* 3. Razorpay Payment Gateway */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg border border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-accent shrink-0" />
                <div>
                  <div className="font-medium text-foreground text-sm">
                    Razorpay Payment Gateway Integration
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Allows generating payment orders and opening the Razorpay modal
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant={paymentsEnabled ? 'default' : 'destructive'}
                size="sm"
                onClick={() => setPaymentsEnabled(!paymentsEnabled)}
                aria-label={paymentsEnabled ? 'Disable Payments' : 'Enable Payments'}
                className="h-8 px-4 text-xs font-semibold self-start sm:self-auto"
              >
                {paymentsEnabled ? 'Enabled' : 'Paused'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Customer Guidance Notice & Live Preview */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 sm:p-5 border-b border-border space-y-0">
            <CardTitle className="text-base font-semibold">
              Customer Reassurance Messaging
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 flex flex-col gap-4">
            {/* Notice Headline */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <label
                  htmlFor="maintenanceHeadline"
                  className="block text-xs font-medium text-foreground"
                >
                  Notice Banner Headline
                </label>
                <span className="text-[11px] text-muted-foreground">
                  {headline.length} / 120 characters
                </span>
              </div>
              <Input
                id="maintenanceHeadline"
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                maxLength={120}
                placeholder="Notice headline..."
              />
            </div>

            {/* Notice Textarea */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <label
                  htmlFor="maintenanceNotice"
                  className="block text-xs font-medium text-foreground"
                >
                  Notice Banner Text
                </label>
                <span className="text-[11px] text-muted-foreground">
                  {maintenanceNotice.length} / 500 characters
                </span>
              </div>
              <Textarea
                id="maintenanceNotice"
                rows={3}
                value={maintenanceNotice}
                onChange={(e) => setMaintenanceNotice(e.target.value)}
                maxLength={500}
                placeholder="Notice displayed to shoppers when checkout or payment services are paused..."
                className="resize-y leading-relaxed"
              />
            </div>

            {/* Presets */}
            <div>
              <div className="text-xs text-muted-foreground mb-2 font-medium">Quick Presets:</div>
              <div className="flex flex-wrap gap-2">
                {PRESET_NOTICES.map((preset) => (
                  <Button
                    key={preset.title}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHeadline(preset.headline);
                      setMaintenanceNotice(preset.text);
                    }}
                    className="h-8 text-xs text-accent border-border hover:bg-muted"
                  >
                    {preset.title}
                  </Button>
                ))}
              </div>
            </div>

            {/* Live Customer Preview */}
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                <Eye className="h-3.5 w-3.5 text-accent" />
                <span>Customer Storefront Preview</span>
              </div>

              <div className="rounded-lg border border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-start gap-3 text-amber-900 dark:text-amber-200 shadow-xs">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-sm mb-1 text-amber-950 dark:text-amber-100">
                    {headline || 'Checkout & Payments Temporarily Paused'}
                  </div>
                  <div className="text-xs leading-relaxed text-amber-900/80 dark:text-amber-200/80">
                    {maintenanceNotice ||
                      'We are currently upgrading our payment & checkout systems. Feel free to browse and keep treasures in your cart—checkout will resume shortly!'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Messages */}
        {saveSuccess && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Service control configuration published successfully to live store.</span>
          </div>
        )}

        {saveError && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isSaving} size="lg" className="gap-2">
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Publishing Changes...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Save &amp; Apply Controls</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
