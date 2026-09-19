'use client';

import {
  AlertTriangle,
  ArrowRight,
  Flame,
  MessageSquare,
  PackageOpen,
  Receipt,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import { buildVipWhatsAppUrl } from '@hh/domain';

import type { ExecutiveInsightsData, InsightTimeframe } from '@hh/domain';

interface InsightsDashboardProps {
  initialInsights: ExecutiveInsightsData;
}

export default function InsightsDashboard({ initialInsights }: InsightsDashboardProps) {
  const [insights, setInsights] = useState<ExecutiveInsightsData>(initialInsights);
  const [timeframe, setTimeframe] = useState<InsightTimeframe>(initialInsights.timeframe);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async (selectedTimeframe: InsightTimeframe) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/insights?timeframe=${selectedTimeframe}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to refresh executive insights.');
      }
      setInsights(data.insights);
      setTimeframe(selectedTimeframe);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading insights.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (minor: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(minor / 100);
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  };

  const sales = insights.sales;
  const customers = insights.customers;
  const productVelocity = insights.productVelocity;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Timeframe Filter Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-accent" />
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
              Executive Insights &amp; Intelligence
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Real-time trajectory of gross revenue, customer repeat loyalty, and product velocity.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Timeframe selector tabs */}
          <div
            className="inline-flex rounded-lg border border-border bg-card p-1 shadow-xs overflow-x-auto max-w-full"
            role="tablist"
          >
            {(
              [
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
                { id: 'all', label: 'All Time' }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={timeframe === tab.id}
                disabled={isLoading}
                onClick={() => fetchInsights(tab.id)}
                className={cn(
                  'rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors select-none whitespace-nowrap',
                  timeframe === tab.id
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchInsights(timeframe)}
            disabled={isLoading}
            className="h-9 px-3"
            title="Refresh metrics"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 text-accent', isLoading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: Sales & Volume KPI Scoreboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Gross Revenue */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Gross Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-accent" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
            <div
              data-testid="kpi-gross-revenue"
              className="text-2xl sm:text-3xl font-bold font-serif text-foreground"
            >
              {formatPrice(sales.revenueMinor)}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
              Captured payments in {timeframe === 'all' ? 'total' : timeframe}
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Paid Orders */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Paid Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
            <div
              data-testid="kpi-paid-orders"
              className="text-2xl sm:text-3xl font-bold font-serif text-foreground"
            >
              {sales.orderCount}
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              Successfully processed orders
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Average Order Value (AOV) */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Average Order Value
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
              <Receipt className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
            <div
              data-testid="kpi-aov"
              className="text-2xl sm:text-3xl font-bold font-serif text-foreground"
            >
              {formatPrice(sales.aovMinor)}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
              Average patron cart spend
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Pending Packaging */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2 flex flex-row items-center justify-between space-y-0">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Packaging
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <PackageOpen className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
            <div
              data-testid="kpi-pending-fulfillment"
              className="text-2xl sm:text-3xl font-bold font-serif text-foreground"
            >
              {sales.pendingFulfillmentCount}
            </div>
            <Link
              href="/admin/orders"
              className="text-[11px] sm:text-xs text-accent hover:text-foreground font-medium inline-flex items-center gap-1 mt-1 transition-colors"
            >
              <span>Fulfill orders</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: Customer Frequency & Loyalty Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left: Customer Retention Rate Card */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-3 flex flex-row items-center gap-3 border-b border-border space-y-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Patron Retention &amp; Frequency
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customer repeat loyalty across paid orders
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-muted/20 border border-border flex flex-col gap-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-muted-foreground font-medium">
                  Repeat Patron Rate
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {customers.repeatRatePercentage}%
                </span>
              </div>

              {/* Visual Retention Progress Bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 dark:bg-emerald-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(0, customers.repeatRatePercentage))}%`
                  }}
                />
              </div>

              <div className="flex justify-between pt-2 border-t border-border text-xs text-muted-foreground">
                <div>
                  Total Patrons:{' '}
                  <strong className="text-foreground font-semibold">
                    {customers.totalCustomers}
                  </strong>
                </div>
                <div>
                  Repeat Patrons:{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {customers.repeatCustomers}
                  </strong>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Patrons who place 2 or more orders represent your highest-LTV audience. Use the
              1-click VIP Concierge button below to reach out directly via WhatsApp with tailored
              styling recommendations or early drop access.
            </p>
          </CardContent>
        </Card>

        {/* Right: Top Customer Frequency Leaderboard */}
        <Card className="border-border bg-card shadow-xs">
          <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-3 flex flex-row items-center justify-between border-b border-border space-y-0">
            <CardTitle className="text-base font-semibold">Top Patrons by Lifetime Value</CardTitle>
            <Badge variant="secondary" className="text-xs font-semibold text-accent">
              Top {customers.topCustomers.length} Patrons
            </Badge>
          </CardHeader>

          <CardContent className="p-4 sm:p-5">
            {customers.topCustomers.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs">
                No customer orders captured yet for this timeframe.
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {customers.topCustomers.map((patron, idx) => {
                  const waUrl = buildVipWhatsAppUrl(
                    patron.customerPhone,
                    patron.customerName,
                    'H&H Atelier'
                  );

                  return (
                    <div
                      key={patron.customerEmail}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border bg-muted/20 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                            idx === 0
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground text-sm">
                              {patron.customerName}
                            </span>
                            {patron.isRepeatCustomer && (
                              <Badge
                                variant="default"
                                className="text-[10px] px-1.5 py-0 font-medium"
                              >
                                Repeat VIP
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {patron.customerEmail} &bull; {patron.customerPhone}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                        <div className="text-left sm:text-right">
                          <div className="font-bold text-foreground text-sm">
                            {formatPrice(patron.totalSpendMinor)}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {patron.orderCount} {patron.orderCount === 1 ? 'order' : 'orders'}{' '}
                            &bull; Last: {formatDate(patron.lastOrderAt)}
                          </div>
                        </div>

                        {patron.customerPhone && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-xs transition-colors"
                            title="Open WhatsApp VIP Concierge greeting"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>VIP Concierge</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3: Product Sales Velocity Leaderboard */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border space-y-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center text-destructive">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Product Sales Velocity &amp; Stock Burn
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Artisanal pieces ranked by units sold and revenue during this timeframe
              </p>
            </div>
          </div>

          <Link href="/admin/inventory">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
              <span>Manage Workshop Inventory</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          {productVelocity.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              No sales recorded yet for products in this timeframe.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Rank
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Artisanal Piece &amp; Variant
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      SKU
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Units Sold
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Revenue (₹)
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Atelier Stock
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {productVelocity.map((item, index) => (
                    <tr key={item.sku} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className="font-mono font-bold text-xs text-accent"
                        >
                          #{index + 1}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground text-sm">
                          {item.productTitle}
                        </div>
                        <div className="text-xs text-muted-foreground">{item.variantTitle}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {item.sku}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-foreground">
                        {item.unitsSold}
                      </td>
                      <td className="px-4 py-3 text-right font-serif font-bold text-accent">
                        {formatPrice(item.revenueMinor)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.currentStock === 0 ? (
                          <Badge variant="destructive" className="text-xs">
                            Sold Out
                          </Badge>
                        ) : item.currentStock <= 3 ? (
                          <Badge
                            variant="secondary"
                            className="text-xs border-amber-500/40 text-amber-600 dark:text-amber-400"
                          >
                            {item.currentStock} left (Low)
                          </Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">
                            {item.currentStock} in stock
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
