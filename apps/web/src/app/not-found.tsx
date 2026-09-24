import { ArrowLeft, Compass, Search, Truck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

export default function RootNotFound() {
  return (
    <div className="flex min-h-[75vh] flex-col items-center justify-center p-4 md:p-8 bg-background">
      <Card className="w-full max-w-lg border border-border bg-card shadow-sm rounded-2xl overflow-hidden text-center animate-in fade-in zoom-in-95 duration-200">
        <CardHeader className="flex flex-col items-center pt-10 pb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 mb-4 ring-8 ring-zinc-50 dark:ring-zinc-900">
            <Search className="h-7 w-7 text-muted-foreground" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-1">
            HTTP 404 &bull; Not Found
          </span>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
            Page Not Located
          </h1>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto mb-6">
            The page you are looking for may have been moved, renamed, or is temporarily
            unavailable. Explore our curated collections or track an existing order below.
          </p>

          <div className="grid grid-cols-2 gap-2 text-left mb-2">
            <Link
              href="/#catalog"
              className="flex items-center gap-2.5 p-3 rounded-xl border border-border/80 bg-muted/30 hover:bg-muted/60 transition-all active:scale-[0.98]"
            >
              <Compass className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="block text-xs font-semibold text-foreground">Catalog</span>
                <span className="block text-[10px] text-muted-foreground">Browse all pieces</span>
              </div>
            </Link>

            <Link
              href="/account/orders"
              className="flex items-center gap-2.5 p-3 rounded-xl border border-border/80 bg-muted/30 hover:bg-muted/60 transition-all active:scale-[0.98]"
            >
              <Truck className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="block text-xs font-semibold text-foreground">Orders</span>
                <span className="block text-[10px] text-muted-foreground">Track shipments</span>
              </div>
            </Link>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 px-6 pb-10 pt-0">
          <Button
            asChild
            className="w-full sm:flex-1 gap-2 font-medium active:scale-[0.96] transition-transform duration-150"
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Return to Storefront
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full sm:flex-1 font-medium active:scale-[0.96] transition-transform duration-150"
          >
            <Link href="/contact">Concierge Desk</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
