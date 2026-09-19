import { Check, CheckCircle2, Clock, Copy, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import type { CheckoutOrderResult } from '@hh/domain';

export interface OrderSuccessViewProps {
  orderPlaced: CheckoutOrderResult;
  reservationRemainingSecs: number;
  isProcessingPayment: boolean;
  onLaunchGateway: (order: CheckoutOrderResult) => void;
}

export function OrderSuccessView({
  orderPlaced,
  reservationRemainingSecs,
  isProcessingPayment,
  onLaunchGateway
}: OrderSuccessViewProps) {
  const [copied, setCopied] = React.useState(false);

  const minutes = Math.floor(reservationRemainingSecs / 60);
  const seconds = reservationRemainingSecs % 60;
  const formattedTimer = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(orderPlaced.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto flex-1 max-w-2xl px-4 py-16 sm:py-24">
        <Card className="border-border bg-card p-8 sm:p-12 text-center shadow-lg">
          <CardContent className="p-0">
            {/* Header Icon */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>

            <span className="mb-2 block text-xs uppercase tracking-[0.25em] font-semibold text-accent">
              Order Reserved
            </span>

            <h1 className="mb-3 font-serif text-2xl sm:text-3xl font-semibold text-primary">
              Awaiting Payment Confirmation
            </h1>

            <p className="mx-auto mb-6 max-w-md text-sm text-muted-foreground leading-relaxed">
              Your handcrafted pieces have been reserved exclusively for you. Please complete
              payment to lock in your order and initiate courier packing.
            </p>

            {/* Order Reference Badge */}
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-border bg-secondary/50 px-5 py-2.5">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Order Reference:
              </span>
              <span className="font-mono text-sm font-bold text-primary">
                {orderPlaced.orderNumber}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="ml-1 text-muted-foreground hover:text-foreground transition-colors p-1"
                aria-label="Copy order number"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Reservation Timer Banner */}
            <div className="mb-8 rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs text-primary">
              <div className="flex items-center justify-center gap-2 font-bold mb-1">
                <Clock className="h-4 w-4 text-accent" />
                <span>Time Remaining to Complete Payment: {formattedTimer}</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                If payment is not completed before the reservation expires, inventory is
                automatically returned to the public collection.
              </p>
            </div>

            {/* Payment Trigger CTA */}
            <div className="space-y-3">
              <Button
                onClick={() => onLaunchGateway(orderPlaced)}
                disabled={isProcessingPayment}
                size="lg"
                className="w-full text-base font-semibold shadow-md"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Processing Payment Gateway...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Open Payment Window</span>
                  </>
                )}
              </Button>

              <Button asChild variant="outline" size="lg" className="w-full">
                <Link href="/">Return to Storefront</Link>
              </Button>
            </div>

            {/* Trust Footer */}
            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Razorpay 256-Bit Encrypted Secure Checkout</span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
