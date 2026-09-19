import { AlertTriangle, Boxes, Package, X } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import type { AdminInventorySummary } from '@hh/domain';

interface InventoryKpiCardsProps {
  summary: AdminInventorySummary;
}

export function InventoryKpiCards({ summary }: InventoryKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Total Available Units */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2 flex flex-row items-center justify-between space-y-0">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Available Stock
          </span>
          <Boxes className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
          <div className="text-2xl sm:text-3xl font-bold font-serif text-foreground">
            {summary.totalAvailable}
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
            {summary.totalOnHand} total on hand &bull; {summary.totalReserved} reserved
          </p>
        </CardContent>
      </Card>

      {/* Low Stock Warning */}
      <Card
        className={cn(
          'border-border bg-card shadow-xs',
          summary.lowStockCount > 0 && 'border-accent/40 bg-accent/5'
        )}
      >
        <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2 flex flex-row items-center justify-between space-y-0">
          <span
            className={cn(
              'text-[11px] sm:text-xs font-semibold uppercase tracking-wider',
              summary.lowStockCount > 0 ? 'text-accent font-bold' : 'text-muted-foreground'
            )}
          >
            Low Stock (&le; 3)
          </span>
          <AlertTriangle
            className={cn(
              'h-4 w-4',
              summary.lowStockCount > 0 ? 'text-accent' : 'text-muted-foreground'
            )}
          />
        </CardHeader>
        <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
          <div className="text-2xl sm:text-3xl font-bold font-serif text-foreground">
            {summary.lowStockCount}
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">SKUs needing reorder</p>
        </CardContent>
      </Card>

      {/* Out of Stock */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2 flex flex-row items-center justify-between space-y-0">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Out of Stock
          </span>
          <X className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
          <div className="text-2xl sm:text-3xl font-bold font-serif text-foreground">
            {summary.outOfStockCount}
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">Sold out variants</p>
        </CardContent>
      </Card>

      {/* Total Variants */}
      <Card className="border-border bg-card shadow-xs">
        <CardHeader className="p-4 pb-1 sm:p-5 sm:pb-2 flex flex-row items-center justify-between space-y-0">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total SKUs
          </span>
          <Package className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent className="p-4 pt-1 sm:p-5 sm:pt-2">
          <div className="text-2xl sm:text-3xl font-bold font-serif text-foreground">
            {summary.totalVariants}
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">Catalog active models</p>
        </CardContent>
      </Card>
    </div>
  );
}
