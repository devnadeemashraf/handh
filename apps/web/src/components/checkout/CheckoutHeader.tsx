import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export function CheckoutHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Bag</span>
        </Link>

        <div className="text-center">
          <Link href="/" className="font-serif text-2xl font-semibold tracking-wider text-primary">
            H&amp;H
          </Link>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
          <ShieldCheck className="h-4 w-4 text-emerald-700" />
          <span className="hidden sm:inline">Secure Checkout</span>
        </div>
      </div>
    </header>
  );
}
