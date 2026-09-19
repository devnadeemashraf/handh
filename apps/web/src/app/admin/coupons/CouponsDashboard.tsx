'use client';

import { Check, CheckCircle2, Copy, Plus, RefreshCw, Search, Sparkles, Tag } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import type { Coupon, DiscountType } from '@hh/domain';

interface CouponsDashboardProps {
  initialCoupons: Coupon[];
}

export default function CouponsDashboard({ initialCoupons }: CouponsDashboardProps) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [value, setValue] = useState<number>(10);
  const [minOrderValueRupees, setMinOrderValueRupees] = useState<number>(500);
  const [maxDiscountRupees, setMaxDiscountRupees] = useState<string>('');
  const [usageLimit, setUsageLimit] = useState<string>('');
  const [startsAt, setStartsAt] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [isActive, setIsActive] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const showSuccessNotice = (msg: string) => {
    setActionSuccess(msg);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setActionSuccess(null);
    }, 4000);
  };

  const handleCopyCode = (couponCode: string) => {
    navigator.clipboard.writeText(couponCode);
    setCopiedCode(couponCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    const updatedStatus = !coupon.isActive;
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: updatedStatus })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update coupon status.');
      }

      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, isActive: updatedStatus } : c))
      );
      showSuccessNotice(`Coupon '${coupon.code}' ${updatedStatus ? 'activated' : 'deactivated'}.`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating coupon.');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const numericValue =
        discountType === 'percentage'
          ? Math.max(1, Math.min(100, Number(value)))
          : Math.round(Number(value) * 100);

      const minOrderValueMinor = Math.round((Number(minOrderValueRupees) || 0) * 100);
      const maxDiscountMinor =
        discountType === 'percentage' && maxDiscountRupees.trim() !== ''
          ? Math.round(Number(maxDiscountRupees) * 100)
          : null;
      const parsedUsageLimit = usageLimit.trim() !== '' ? parseInt(usageLimit, 10) : null;

      const payload = {
        code: code.trim().toUpperCase(),
        discountType,
        value: numericValue,
        minOrderValueMinor,
        maxDiscountMinor,
        usageLimit: parsedUsageLimit,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        isActive
      };

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create coupon.');
      }

      setCoupons((prev) => [data.coupon, ...prev]);
      setIsModalOpen(false);
      resetForm();
      showSuccessNotice(`Coupon '${data.coupon.code}' created successfully.`);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Error creating coupon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCode('');
    setDiscountType('percentage');
    setValue(10);
    setMinOrderValueRupees(500);
    setMaxDiscountRupees('');
    setUsageLimit('');
    setStartsAt('');
    setExpiresAt('');
    setIsActive(true);
    setFormError(null);
  };

  // Filter and search
  const filteredCoupons = coupons.filter((c) => {
    const matchesTab =
      filterTab === 'all' ||
      (filterTab === 'active' && c.isActive) ||
      (filterTab === 'inactive' && !c.isActive);

    const matchesSearch =
      searchQuery.trim() === '' || c.code.toLowerCase().includes(searchQuery.toLowerCase().trim());

    return matchesTab && matchesSearch;
  });

  const totalCoupons = coupons.length;
  const activeCount = coupons.filter((c) => c.isActive).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + c.timesUsed, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Tag className="h-5 w-5 text-accent" />
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
              Promotional Coupons &amp; Discounts
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Drive social campaigns and reward loyal patrons with flexible cart and checkout discount
            codes.
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Coupon</span>
        </Button>
      </div>

      {/* KPI Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Coupons
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
            <div className="text-2xl sm:text-3xl font-bold font-serif text-foreground">
              {activeCount}
              <span className="text-xs text-muted-foreground font-normal ml-2">
                / {totalCoupons} total
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Redemptions
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
            <div className="text-2xl sm:text-3xl font-bold font-serif text-foreground">
              {totalRedemptions}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Strategies
            </span>
          </CardHeader>
          <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
            <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1">
              Percentage &amp; Flat Rupee Discounts
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Notification */}
      {actionSuccess && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Controls Bar: Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex rounded-lg border border-border bg-card p-1 shadow-xs">
          {(['all', 'active', 'inactive'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterTab(tab)}
              className={cn(
                'rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors select-none capitalize',
                filterTab === tab
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab === 'all' ? 'All Coupons' : tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search coupon code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 h-10 text-xs"
          />
        </div>
      </div>

      {/* Coupons Table */}
      <Card className="border-border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  COUPON CODE
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  DISCOUNT VALUE
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  MIN. ORDER
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  USAGE &amp; REDEMPTIONS
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  EXPIRATION
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  STATUS &amp; ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center text-muted-foreground text-xs">
                    No promotional coupons found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => {
                  const isExpired = c.expiresAt ? new Date(c.expiresAt) < new Date() : false;
                  return (
                    <tr
                      key={c.id}
                      className={cn(
                        'hover:bg-muted/20 transition-colors',
                        (!c.isActive || isExpired) && 'opacity-70 bg-muted/10'
                      )}
                    >
                      {/* Code Badge */}
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-accent bg-accent/10 border border-accent/30 px-2 py-1 rounded">
                            {c.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(c.code)}
                            aria-label={`Copy coupon ${c.code}`}
                            className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                          >
                            {copiedCode === c.code ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td className="px-4 py-3 text-sm text-foreground">
                        {c.discountType === 'percentage' ? (
                          <div>
                            <strong>{c.value}%</strong> Off
                            {c.maxDiscountMinor ? (
                              <div className="text-xs text-muted-foreground">
                                Capped at ₹{c.maxDiscountMinor / 100}
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div>
                            <strong>₹{c.value / 100}</strong> Flat Off
                          </div>
                        )}
                      </td>

                      {/* Min Order */}
                      <td className="px-4 py-3 text-xs text-foreground">
                        {c.minOrderValueMinor > 0 ? `₹${c.minOrderValueMinor / 100}` : 'None'}
                      </td>

                      {/* Usage */}
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <span className="text-foreground font-semibold">{c.timesUsed}</span>
                        {c.usageLimit ? ` / ${c.usageLimit} max` : ' (unlimited)'}
                      </td>

                      {/* Expiration */}
                      <td className="px-4 py-3 text-xs">
                        {c.expiresAt ? (
                          <>
                            <div
                              className={cn(
                                isExpired ? 'text-destructive font-medium' : 'text-muted-foreground'
                              )}
                            >
                              {new Date(c.expiresAt).toLocaleDateString('en-IN')}
                            </div>
                            {isExpired && (
                              <span className="text-[10px] text-destructive uppercase tracking-wider font-semibold">
                                Expired
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </td>

                      {/* Toggle & Action */}
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant={c.isActive ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleToggleStatus(c)}
                          aria-label={
                            c.isActive ? `Pause coupon ${c.code}` : `Activate coupon ${c.code}`
                          }
                          className="h-7 px-3 text-xs"
                        >
                          {c.isActive ? 'Active' : 'Paused'}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Coupon Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <DialogTitle className="font-serif text-xl">Create Promotional Coupon</DialogTitle>
            </div>
          </DialogHeader>

          {formError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-xs">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateCoupon} className="flex flex-col gap-4 py-2">
            {/* Code */}
            <div className="space-y-1.5">
              <label htmlFor="couponCode" className="block text-xs font-medium text-foreground">
                Coupon Code *
              </label>
              <Input
                id="couponCode"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. EIDGIFT15, WELCOME10"
                className="font-mono font-bold tracking-wider text-accent"
              />
            </div>

            {/* Discount Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground">
                Discount Strategy *
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setDiscountType('percentage')}
                  className={cn(
                    'p-2.5 rounded-md border text-xs font-semibold transition-colors',
                    discountType === 'percentage'
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  Percentage Off (%)
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed')}
                  className={cn(
                    'p-2.5 rounded-md border text-xs font-semibold transition-colors',
                    discountType === 'fixed'
                      ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  Flat Rupee Off (₹)
                </button>
              </div>
            </div>

            {/* Value & Min Order */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="discountValue"
                  className="block text-xs font-medium text-foreground"
                >
                  {discountType === 'percentage' ? 'Percentage (1-100%) *' : 'Amount in ₹ *'}
                </label>
                <Input
                  id="discountValue"
                  type="number"
                  required
                  min={1}
                  max={discountType === 'percentage' ? 100 : 50000}
                  value={value}
                  onChange={(e) => setValue(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="minOrderValue"
                  className="block text-xs font-medium text-foreground"
                >
                  Min Order Value (₹)
                </label>
                <Input
                  id="minOrderValue"
                  type="number"
                  min={0}
                  value={minOrderValueRupees}
                  onChange={(e) => setMinOrderValueRupees(Number(e.target.value))}
                  placeholder="e.g. 500"
                />
              </div>
            </div>

            {/* Optional: Max Discount Cap & Usage Limit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="maxDiscount" className="block text-xs font-medium text-foreground">
                  Max Discount Cap (₹)
                </label>
                <Input
                  id="maxDiscount"
                  type="number"
                  disabled={discountType !== 'percentage'}
                  value={maxDiscountRupees}
                  onChange={(e) => setMaxDiscountRupees(e.target.value)}
                  placeholder={
                    discountType === 'percentage' ? 'e.g. 200 (optional)' : 'N/A for flat'
                  }
                  className={discountType !== 'percentage' ? 'opacity-50' : ''}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="usageLimit" className="block text-xs font-medium text-foreground">
                  Total Redemptions Cap
                </label>
                <Input
                  id="usageLimit"
                  type="number"
                  min={1}
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="e.g. 100 (optional)"
                />
              </div>
            </div>

            {/* Expiry Date */}
            <div className="space-y-1.5">
              <label htmlFor="expiresAt" className="block text-xs font-medium text-foreground">
                Expiration Date (optional)
              </label>
              <Input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2.5 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Publish Coupon</span>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
