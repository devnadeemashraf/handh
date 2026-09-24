import { Boxes, History } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import type { AdminInventoryItem, InventoryAuditReason } from '@hh/domain';

interface InventoryTableProps {
  items: AdminInventoryItem[];
  isLoading: boolean;
  editingPriceVariantId: string | null;
  newPriceInput: string;
  selectedVariantAuditId: string | null;
  onSetEditingPriceVariantId: (variantId: string | null) => void;
  onSetNewPriceInput: (input: string) => void;
  onPriceUpdate: (variantId: string, priceRupees: number) => Promise<void>;
  onStatusToggle: (productId: string, currentStatus: string) => Promise<void>;
  onQuickAdjust: (
    variantId: string,
    delta: number,
    reason: InventoryAuditReason,
    note?: string
  ) => Promise<void>;
  onOpenCustomAdjust: (item: AdminInventoryItem) => void;
  onToggleVariantAudit: (variantId: string) => void;
}

export function InventoryTable({
  items,
  isLoading,
  editingPriceVariantId,
  newPriceInput,
  selectedVariantAuditId,
  onSetEditingPriceVariantId,
  onSetNewPriceInput,
  onPriceUpdate,
  onStatusToggle,
  onQuickAdjust,
  onOpenCustomAdjust,
  onToggleVariantAudit
}: InventoryTableProps) {
  const formatPrice = (minor: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(minor / 100);
  };

  return (
    <Card className="border-border bg-card shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Artisanal Piece
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Price (₹)
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Stock (Available)
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Quick Restock
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Audit
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 px-4 text-muted-foreground">
                  <Boxes className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
                  <div>No inventory items matched your filter.</div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.variantId} className="hover:bg-muted/20 transition-colors">
                  {/* Product & Variant */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.primaryImageUrl ? (
                        <Image
                          src={item.primaryImageUrl}
                          alt={item.productTitle}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-md object-cover border border-border"
                          unoptimized
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center border border-border">
                          <Boxes className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/products/${item.productSlug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-foreground hover:text-accent transition-colors block text-sm"
                        >
                          {item.productTitle}
                        </Link>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          {item.variantSku} &bull; {item.variantTitle}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status Toggle */}
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onStatusToggle(item.productId, item.productStatus)}
                      disabled={isLoading}
                      title="Click to toggle status"
                      className="cursor-pointer focus:outline-none"
                    >
                      <Badge
                        variant={item.productStatus === 'published' ? 'default' : 'secondary'}
                        className="capitalize cursor-pointer"
                      >
                        {item.productStatus}
                      </Badge>
                    </button>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3">
                    {editingPriceVariantId === item.variantId ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          value={newPriceInput}
                          onChange={(e) => onSetNewPriceInput(e.target.value)}
                          placeholder="Price ₹"
                          className="w-20 h-7 text-xs px-2"
                        />
                        <Button
                          size="sm"
                          onClick={() => onPriceUpdate(item.variantId, parseFloat(newPriceInput))}
                          className="h-7 px-2 text-xs"
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSetEditingPriceVariantId(null)}
                          className="h-7 px-2 text-xs text-muted-foreground"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-accent">
                          {formatPrice(item.priceMinor)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            onSetEditingPriceVariantId(item.variantId);
                            onSetNewPriceInput(String(item.priceMinor / 100));
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>

                  {/* Stock Level Details */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          'text-base font-bold',
                          item.available <= 0
                            ? 'text-destructive'
                            : item.isLowStock
                              ? 'text-amber-500'
                              : 'text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        {item.available}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {item.onHand} on hand &bull; {item.reserved} held
                      </span>
                    </div>
                  </td>

                  {/* Quick Restock Buttons */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[1, 5, 10, 20].map((num) => (
                        <Button
                          key={num}
                          variant="outline"
                          size="sm"
                          onClick={() => onQuickAdjust(item.variantId, num, 'manual_restock')}
                          disabled={isLoading}
                          className="h-7 px-2 text-xs"
                          title={`Add +${num} stock`}
                        >
                          +{num}
                        </Button>
                      ))}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenCustomAdjust(item)}
                        className="h-7 px-2 text-xs text-accent border-accent/40 hover:bg-accent/10"
                        title="Custom stock adjustment"
                      >
                        Custom &plusmn;
                      </Button>
                    </div>
                  </td>

                  {/* Audit Logs */}
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant={selectedVariantAuditId === item.variantId ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onToggleVariantAudit(item.variantId)}
                      className="h-7 px-2.5 text-xs gap-1.5"
                      title="View audit logs"
                    >
                      <History className="h-3.5 w-3.5" />
                      <span>History</span>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
