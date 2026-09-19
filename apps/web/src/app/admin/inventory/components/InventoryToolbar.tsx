import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import type { FilterTab } from '../types';

interface InventoryToolbarProps {
  activeTab: FilterTab;
  setActiveTab: (tab: FilterTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export function InventoryToolbar({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  totalCount,
  lowStockCount,
  outOfStockCount
}: InventoryToolbarProps) {
  const needsRestockTotal = lowStockCount + outOfStockCount;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Filter Tabs */}
      <div className="inline-flex rounded-lg border border-border bg-card p-1 shadow-xs overflow-x-auto max-w-full">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={cn(
            'rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors select-none whitespace-nowrap',
            activeTab === 'all'
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          All SKUs ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('needs_restock')}
          className={cn(
            'rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors select-none whitespace-nowrap',
            activeTab === 'needs_restock'
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : needsRestockTotal > 0
                ? 'text-accent font-semibold hover:text-foreground'
                : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Needs Restock ({needsRestockTotal})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('published')}
          className={cn(
            'rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors select-none whitespace-nowrap',
            activeTab === 'published'
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Published
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('drafts')}
          className={cn(
            'rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors select-none whitespace-nowrap',
            activeTab === 'drafts'
              ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Drafts
        </button>
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search piece by title or SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-8 h-10 text-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
            title="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
