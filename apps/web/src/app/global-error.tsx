'use client';

import { AlertOctagon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 font-sans antialiased text-zinc-900 dark:text-zinc-50">
        <Card className="w-full max-w-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md rounded-2xl p-6 text-center">
          <CardHeader className="flex flex-col items-center p-0 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 mb-3">
              <AlertOctagon className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Application Interruption</h1>
          </CardHeader>

          <CardContent className="p-0 mb-6">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
              A critical error occurred while rendering the storefront shell. Please reload to
              continue.
            </p>
            {error.digest && (
              <p className="font-mono text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 py-1 px-2 rounded-md inline-block">
                Digest: {error.digest}
              </p>
            )}
          </CardContent>

          <CardFooter className="p-0 flex gap-2">
            <Button
              type="button"
              onClick={() => reset()}
              className="w-full gap-2 active:scale-[0.96] transition-transform duration-150"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Application
            </Button>
          </CardFooter>
        </Card>
      </body>
    </html>
  );
}
