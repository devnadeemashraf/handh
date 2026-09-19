import { Clock, Search, Truck, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import type { TabKey } from '../types';

interface OrdersToolbarProps {
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalOrdersCount: number;
}

export function OrdersToolbar({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  totalOrdersCount
}: OrdersToolbarProps) {
  return (
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
          All Orders ({totalOrdersCount})
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
  );
}
