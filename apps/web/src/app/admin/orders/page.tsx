import { Clock, IndianRupee, ShoppingBag, Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

import { createDbClient, getAdminOrderMetrics, listAdminOrders } from '@hh/db';

import OrdersTable from './OrdersTable';

export const dynamic = 'force-dynamic';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export default async function AdminOrdersPage() {
  const db = getDatabase();

  const [metrics, orders] = await Promise.all([
    getAdminOrderMetrics(db),
    listAdminOrders(db, { limit: 100 })
  ]);

  const formattedRevenue = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(metrics.totalRevenueMinor / 100);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-primary">
          Order Queue
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
          Review incoming purchases, dispatch artisanal pieces, and record courier tracking.
        </p>
      </div>

      {/* KPI Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Captured Revenue */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs uppercase font-semibold tracking-wider">Revenue</span>
              <IndianRupee className="h-4 w-4 text-accent" />
            </div>
            <div className="mt-2 font-serif text-2xl font-bold text-primary">
              {formattedRevenue}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">Total captured online</div>
          </CardContent>
        </Card>

        {/* To Pack (Urgent) */}
        <Card className="border-accent/40 bg-secondary/30 shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-accent">
              <span className="text-xs uppercase font-semibold tracking-wider text-primary">
                To Pack
              </span>
              <Clock className="h-4 w-4 text-accent" />
            </div>
            <div className="mt-2 font-serif text-2xl font-bold text-primary">
              {metrics.toPackCount}
            </div>
            <div className="mt-1 text-[11px] text-accent-foreground font-medium">
              Awaiting courier handover
            </div>
          </CardContent>
        </Card>

        {/* In Transit */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs uppercase font-semibold tracking-wider">In Transit</span>
              <Truck className="h-4 w-4 text-emerald-700" />
            </div>
            <div className="mt-2 font-serif text-2xl font-bold text-primary">
              {metrics.shippedCount}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">Dispatched with tracking</div>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs uppercase font-semibold tracking-wider">Total</span>
              <ShoppingBag className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-2 font-serif text-2xl font-bold text-primary">
              {metrics.totalOrdersCount}
            </div>
            <div className="mt-1 text-[11px] text-muted-foreground">All recorded transactions</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <OrdersTable initialOrders={orders} />
    </div>
  );
}
