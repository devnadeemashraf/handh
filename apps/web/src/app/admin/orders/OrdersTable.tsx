'use client';

import { CheckCircle2, ChevronRight, Clock, Package, Search, Truck, X } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import type { Order } from '@hh/db';

export interface OrdersTableProps {
  initialOrders: Array<Order & { itemCount: number }>;
}

type TabKey = 'all' | 'to_pack' | 'processing' | 'shipped';

export default function OrdersTable({ initialOrders }: OrdersTableProps) {
  const [activeTab, setActiveTab] = React.useState<TabKey>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredOrders = React.useMemo(() => {
    return initialOrders.filter((order) => {
      // 1. Tab Filter
      if (activeTab === 'to_pack') {
        if (order.status !== 'paid' || order.fulfillmentStatus === 'shipped') return false;
      } else if (activeTab === 'processing') {
        if (order.status !== 'processing') return false;
      } else if (activeTab === 'shipped') {
        if (order.fulfillmentStatus !== 'shipped') return false;
      }

      // 2. Search Filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNumber = order.orderNumber.toLowerCase().includes(q);
        const matchesName = order.customerName.toLowerCase().includes(q);
        const matchesPhone = order.customerPhone.toLowerCase().includes(q);
        const matchesEmail = order.customerEmail.toLowerCase().includes(q);
        return matchesNumber || matchesName || matchesPhone || matchesEmail;
      }

      return true;
    });
  }, [initialOrders, activeTab, searchQuery]);

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

  return (
    <div className="space-y-6">
      {/* Search & Tabs Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="inline-flex rounded-lg border border-border bg-card p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors select-none',
              activeTab === 'all'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            All Orders ({initialOrders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('to_pack')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors select-none',
              activeTab === 'to_pack'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Clock className="h-3.5 w-3.5 text-accent" />
            <span>To Pack</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('processing')}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors select-none',
              activeTab === 'processing'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Processing
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shipped')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors select-none',
              activeTab === 'shipped'
                ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>In Transit</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order #, phone, name..."
            className="pl-9 pr-8 h-10 text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
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
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
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
      )}
    </div>
  );
}
