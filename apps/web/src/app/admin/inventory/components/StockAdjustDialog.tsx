import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import type { AdminInventoryItem, InventoryAuditReason } from '@hh/domain';

interface StockAdjustDialogProps {
  item: AdminInventoryItem | null;
  customDelta: number;
  customReason: InventoryAuditReason;
  customNote: string;
  isLoading: boolean;
  onClose: () => void;
  onDeltaChange: (delta: number) => void;
  onReasonChange: (reason: InventoryAuditReason) => void;
  onNoteChange: (note: string) => void;
  onConfirm: () => void;
}

export function StockAdjustDialog({
  item,
  customDelta,
  customReason,
  customNote,
  isLoading,
  onClose,
  onDeltaChange,
  onReasonChange,
  onNoteChange,
  onConfirm
}: StockAdjustDialogProps) {
  return (
    <Dialog
      open={Boolean(item)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Adjust Inventory Stock</DialogTitle>
          {item && (
            <DialogDescription className="text-xs">
              {item.productTitle} &bull;{' '}
              <span className="font-mono font-medium text-foreground">{item.variantSku}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        {item && (
          <div className="flex flex-col gap-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-accent">Units to Adjust (+/-)</label>
              <Input
                type="number"
                value={customDelta}
                onChange={(e) => onDeltaChange(parseInt(e.target.value) || 0)}
                className="font-semibold text-base"
              />
              <div className="text-[11px] text-muted-foreground">
                Current on hand: {item.onHand} &bull; Resulting on hand: {item.onHand + customDelta}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-accent">Adjustment Reason</label>
              <select
                value={customReason}
                onChange={(e) => onReasonChange(e.target.value as InventoryAuditReason)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <option value="manual_restock">Artisan Batch Restock (+)</option>
                <option value="manual_correction">Count Correction (&plusmn;)</option>
                <option value="damaged">Damaged / Defective Stock (-)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-accent">Note (Optional)</label>
              <Input
                type="text"
                placeholder="e.g. Received shipment from artisan workshop"
                value={customNote}
                onChange={(e) => onNoteChange(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading || customDelta === 0}>
            {isLoading ? 'Updating...' : 'Confirm Adjustment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
