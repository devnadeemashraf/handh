import { CheckCircle2, ChevronRight, Clock, Package, Truck } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import type { AdminOrderItem } from '../types';

interface OrdersListProps {
  orders: AdminOrderItem[];
  searchQuery: string;
}

export function OrdersList({ orders, searchQuery }: OrdersListProps) {
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
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  };

  if (orders.length === 0) {
    return (
      <Card className="border-border bg-card p-12 text-center shadow-xs">
        <CardContent className="p-0">
          <Package className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
          <h3 className="font-serif text-lg font-semibold text-primary mb-1">
            No orders in this queue
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchQuery
              ? `No orders matching "${searchQuery}". Try searching with a different keyword.`
              : 'Orders placed and paid by customers will appear here automatically.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Link key={order.id} href={`/admin/orders/${order.id}`} className="group block">
          <Card className="border-border bg-card transition-all hover:border-primary/40 hover:shadow-xs">
            <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
              {/* Left: Order identity & customer */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-sm font-bold text-accent tracking-wider">
                    {order.orderNumber}
                  </span>

                  {/* Status Badges */}
                  {order.status === 'paid' && order.fulfillmentStatus === 'unfulfilled' && (
                    <Badge variant="gold" className="text-[10px] uppercase font-semibold">
                      <Clock className="mr-1 h-3 w-3" />
                      <span>Ready to Pack</span>
                    </Badge>
                  )}

                  {order.fulfillmentStatus === 'shipped' && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] uppercase font-semibold bg-sky-100 text-sky-800"
                    >
                      <Truck className="mr-1 h-3 w-3" />
                      <span>Shipped</span>
                    </Badge>
                  )}

                  {order.status === 'completed' && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] uppercase font-semibold bg-emerald-100 text-emerald-800"
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      <span>Completed</span>
                    </Badge>
                  )}

                  <span className="text-xs text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-foreground font-medium">
                  <span>{order.customerName}</span>
                  <span className="text-muted-foreground">&bull;</span>
                  <span className="text-muted-foreground">{order.customerPhone}</span>
                  <span className="text-muted-foreground">&bull;</span>
                  <span className="text-muted-foreground">
                    {order.shippingAddress.city}, {order.shippingAddress.state}
                  </span>
                </div>
              </div>

              {/* Right: Items, Total & Action Arrow */}
              <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                <div className="text-left sm:text-right">
                  <div className="font-serif text-base font-bold text-primary">
                    {formatPrice(order.totalMinor)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                  </div>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
