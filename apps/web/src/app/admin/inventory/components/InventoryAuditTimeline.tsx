import { ArrowDownRight, ArrowUpRight, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import type { AdminInventoryItem, InventoryAuditLogItem } from '@hh/domain';

interface InventoryAuditTimelineProps {
  auditLogs: InventoryAuditLogItem[];
  selectedVariantAuditId: string | null;
  items: AdminInventoryItem[];
  onClearVariantFilter: () => void;
}

export function InventoryAuditTimeline({
  auditLogs,
  selectedVariantAuditId,
  items,
  onClearVariantFilter
}: InventoryAuditTimelineProps) {
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  };

  const selectedItem = items.find((i) => i.variantId === selectedVariantAuditId);
  const displayedLogs = auditLogs
    .filter((log) => !selectedVariantAuditId || log.variantId === selectedVariantAuditId)
    .slice(0, 15);

  return (
    <Card className="border-border bg-card shadow-xs">
      <CardHeader className="p-4 sm:p-5 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-accent" />
          <CardTitle className="text-base font-semibold">
            {selectedVariantAuditId
              ? `Audit History for ${selectedItem?.variantSku ?? 'Selected SKU'}`
              : 'Recent Inventory Movements'}
          </CardTitle>
        </div>
        {selectedVariantAuditId && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearVariantFilter}
            className="h-7 px-2.5 text-xs"
          >
            Show All SKUs
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
        {displayedLogs.length === 0 ? (
          <div className="text-muted-foreground text-xs text-center py-6">
            No stock movements recorded yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {displayedLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 text-xs"
              >
                <div className="flex items-center gap-3">
                  {log.delta > 0 ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-foreground">{log.productTitle}</span>{' '}
                    <span className="text-muted-foreground font-mono">({log.variantSku})</span>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      Reason:{' '}
                      <span className="text-accent font-medium">
                        {log.reason.replace(/_/g, ' ')}
                      </span>
                      {log.note ? ` &bull; "${log.note}"` : ''}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={cn(
                      'font-bold',
                      log.delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                    )}
                  >
                    {log.delta > 0 ? `+${log.delta}` : log.delta} ({log.previousOnHand} &rarr;{' '}
                    {log.newOnHand})
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {formatDate(log.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
