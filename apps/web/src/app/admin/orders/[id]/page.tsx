import { ChevronLeft, CreditCard, MapPin, Package } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  createDbClient,
  findFulfillmentsForOrder,
  findOrderById,
  type ShippingAddress
} from '@hh/db';

import OrderFulfillmentActions from './OrderFulfillmentActions';

export const dynamic = 'force-dynamic';

function getDatabase() {
  const databaseUrl =
    process.env['DATABASE_URL'] ?? 'postgres://postgres:postgres@localhost:5432/hh_dev';
  return createDbClient(databaseUrl);
}

export default async function AdminOrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const db = getDatabase();

  const [order, fulfillments] = await Promise.all([
    findOrderById(db, params.id),
    findFulfillmentsForOrder(db, params.id)
  ]);

  if (!order) {
    notFound();
  }

  const formatPrice = (minor: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(minor / 100);
  };

  const formatDate = (isoString: string | Date) => {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  };

  const typedShippingAddress = order.shippingAddress as ShippingAddress;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Back Link & Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Orders</span>
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
              Order {order.orderNumber}
            </h1>
            <Badge variant="secondary" className="font-mono text-xs text-accent">
              {order.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>
        </div>

        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground block font-medium">
            Total Value
          </span>
          <p className="text-2xl sm:text-3xl font-bold font-serif text-accent">
            {formatPrice(order.totalMinor)}
          </p>
        </div>
      </div>

      {/* Main Grid: Actions, Fulfillment & Order Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Fulfillment Actions & Items */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <OrderFulfillmentActions
            order={{
              ...order,
              shippingAddress: typedShippingAddress
            }}
            initialFulfillments={fulfillments}
          />

          {/* Ordered Line Items Card */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-3 flex flex-row items-center gap-2.5 border-b border-border space-y-0">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Package className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold">
                Purchased Pieces ({order.items.length})
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              <div className="divide-y divide-border">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground text-sm">
                        {item.productNameSnapshot}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Variant: <span className="text-accent">{item.variantNameSnapshot}</span>
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground/70">
                        SKU: {item.skuSnapshot}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-semibold text-foreground text-sm">
                        {formatPrice(item.totalPriceMinor)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.unitPriceMinor)} × {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Shipping & Payment Summary */}
        <div className="flex flex-col gap-6">
          {/* Shipping Destination Card */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-3 flex flex-row items-center gap-2 border-b border-border space-y-0 text-accent">
              <MapPin className="h-4 w-4" />
              <CardTitle className="text-xs uppercase tracking-wider font-semibold">
                Delivery Address
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              <div className="p-3.5 rounded-lg border border-border bg-muted/20 text-xs flex flex-col gap-1 text-foreground leading-relaxed">
                <p className="font-semibold text-sm">{order.customerName}</p>
                <p>{typedShippingAddress.line1}</p>
                {typedShippingAddress.line2 && <p>{typedShippingAddress.line2}</p>}
                <p>
                  {typedShippingAddress.city}, {typedShippingAddress.state} -{' '}
                  <span className="font-mono">{typedShippingAddress.postalCode}</span>
                </p>
                <p className="text-muted-foreground">{typedShippingAddress.country || 'India'}</p>
                <p className="pt-2 text-muted-foreground font-mono">Phone: {order.customerPhone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Financial Trace Card */}
          <Card className="border-border bg-card shadow-xs">
            <CardHeader className="p-4 sm:p-5 pb-3 sm:pb-3 flex flex-row items-center gap-2 border-b border-border space-y-0 text-accent">
              <CreditCard className="h-4 w-4" />
              <CardTitle className="text-xs uppercase tracking-wider font-semibold">
                Financial Breakdown
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 sm:p-5 flex flex-col gap-3 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground font-mono font-medium">
                  {formatPrice(order.subtotalMinor)}
                </span>
              </div>

              <div className="flex justify-between text-muted-foreground">
                <span>Shipping Tier</span>
                <span className="text-foreground font-mono font-medium">
                  {order.shippingMinor === 0 ? 'Free' : formatPrice(order.shippingMinor)}
                </span>
              </div>

              <div className="flex justify-between text-foreground font-semibold pt-2 border-t border-border text-sm">
                <span>Grand Total</span>
                <span className="text-accent font-serif font-bold text-base">
                  {formatPrice(order.totalMinor)}
                </span>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>Payment Status:</span>
                <Badge
                  variant="secondary"
                  className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400"
                >
                  {order.paymentStatus.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
