'use client';

import * as React from 'react';

import { OrdersList } from './components/OrdersList';
import { OrdersToolbar } from './components/OrdersToolbar';

import type { OrdersTableProps, TabKey } from './types';

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

  return (
    <div className="space-y-6">
      {/* Search & Tabs Controls */}
      <OrdersToolbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        totalOrdersCount={initialOrders.length}
      />

      {/* Orders List */}
      <OrdersList orders={filteredOrders} searchQuery={searchQuery} />
    </div>
  );
}

export type { OrdersTableProps };
