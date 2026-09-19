import { ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SheetFooter } from '@/components/ui/sheet';

import type { ServiceControlConfig } from '@hh/domain';

interface CartDrawerFooterProps {
  subtotalFormatted: string;
  isCheckoutReady: boolean;
  isServicePaused: boolean;
  serviceControl: ServiceControlConfig | null;
  onClose: () => void;
}

export function CartDrawerFooter({
  subtotalFormatted,
  isCheckoutReady,
  isServicePaused,
  serviceControl,
  onClose
}: CartDrawerFooterProps) {
  return (
    <SheetFooter className="mt-auto flex flex-col border-t border-border bg-card/90 p-6">
      {/* Subtotal */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-muted-foreground">Subtotal</span>
        <span className="font-serif text-xl font-bold text-primary">{subtotalFormatted}</span>
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        Applicable shipping and taxes are computed at checkout.
      </p>

      {/* Customer Reassurance Maintenance Banner */}
      {isServicePaused && serviceControl && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <Clock className="h-4 w-4 text-amber-700" />
            <span>{serviceControl.headline}</span>
          </div>
          <p className="text-amber-800 leading-relaxed">{serviceControl.maintenanceNotice}</p>
        </div>
      )}

      {/* Checkout Action Button */}
      <Button
        asChild
        size="lg"
        disabled={!isCheckoutReady}
        className="w-full text-sm font-semibold shadow-sm"
      >
        <Link
          href="/checkout"
          onClick={(e) => {
            if (!isCheckoutReady) {
              e.preventDefault();
            } else {
              onClose();
            }
          }}
          className="flex items-center justify-center gap-2"
        >
          <span>{isServicePaused ? 'Checkout Temporarily Paused' : 'Proceed to Checkout'}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>

      {/* View Full Cart Route */}
      <div className="mt-3 text-center">
        <Link
          href="/cart"
          onClick={onClose}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          View full bag details
        </Link>
      </div>

      {/* Trust badge */}
      <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span>Safe &amp; Secure Direct Checkout</span>
      </div>
    </SheetFooter>
  );
}
