'use client';

import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { triggerHaptic } from '@/lib/haptic';

interface RootErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    // Log unexpected client exceptions
    console.error('Root error boundary caught exception:', error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 md:p-6 bg-background">
      <Card className="w-full max-w-lg border border-border bg-card shadow-sm rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <CardHeader className="flex flex-col items-center text-center pt-8 pb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 mb-4 ring-8 ring-zinc-50 dark:ring-zinc-900">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground mb-1">
            Unexpected Exception
          </span>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
            Something Went Wrong
          </h1>
        </CardHeader>

        <CardContent className="text-center px-6 pb-6">
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto mb-4">
            We encountered a temporary interruption while loading this page. Your shopping bag and
            saved preferences remain completely safe.
          </p>
          {error.digest && (
            <p className="font-mono text-[10px] text-muted-foreground/70 bg-muted/50 py-1 px-2.5 rounded-md inline-block select-all">
              Reference: {error.digest}
            </p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 px-6 pb-8 pt-0">
          <Button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              reset();
            }}
            className="w-full sm:flex-1 gap-2 font-medium active:scale-[0.96] transition-all duration-150"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full sm:flex-1 gap-2 font-medium active:scale-[0.96] transition-all duration-150"
            onClick={() => triggerHaptic('selection')}
          >
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Return Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
