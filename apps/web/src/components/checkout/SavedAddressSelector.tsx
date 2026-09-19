import { Check, MapPin, Plus } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import type { UserAddress } from '@hh/domain';

export interface SavedAddressSelectorProps {
  addresses: UserAddress[];
  selectedAddressId: string | null;
  isManualAddress: boolean;
  onSelectAddress: (address: UserAddress) => void;
  onSwitchToManual: () => void;
}

export function SavedAddressSelector({
  addresses,
  selectedAddressId,
  isManualAddress,
  onSelectAddress,
  onSwitchToManual
}: SavedAddressSelectorProps) {
  if (addresses.length === 0) return null;

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
          Delivering To Saved Address
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onSwitchToManual}
          className={cn(
            'text-xs text-accent hover:text-primary font-medium',
            isManualAddress && 'underline text-primary'
          )}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          <span>Enter new address</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {addresses.map((addr) => {
          const isSelected = !isManualAddress && selectedAddressId === addr.id;

          return (
            <Card
              key={addr.id}
              onClick={() => onSelectAddress(addr)}
              className={cn(
                'cursor-pointer border transition-all select-none',
                isSelected
                  ? 'border-primary bg-secondary/30 ring-1 ring-primary shadow-sm'
                  : 'border-border bg-card hover:bg-secondary/20'
              )}
            >
              <CardContent className="p-4 relative">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-sm text-foreground">
                    <MapPin className="h-3.5 w-3.5 text-accent" />
                    <span>{addr.recipientName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {addr.isDefault && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
                        Default
                      </Badge>
                    )}
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground border border-border rounded px-1.5 py-0.5">
                      {addr.label}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} -{' '}
                  {addr.postalCode}
                </p>

                <p className="text-xs font-medium text-foreground mt-2">Phone: +91 {addr.phone}</p>

                {isSelected && (
                  <div className="absolute bottom-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
