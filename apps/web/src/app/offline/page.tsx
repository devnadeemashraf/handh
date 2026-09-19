import { WifiOff } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <Card className="max-w-md border-border bg-card p-8 shadow-lg">
        <CardContent className="p-0">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-accent">
            <WifiOff className="h-8 w-8" />
          </div>

          <span className="mb-2 block text-xs uppercase tracking-[0.25em] font-semibold text-accent">
            Connection Lost
          </span>

          <h1 className="mb-3 font-serif text-2xl font-semibold text-primary">
            You Are Currently Offline
          </h1>

          <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
            It looks like your device is disconnected from the internet. Your bag and saved items
            are safely preserved locally.
          </p>

          <Button asChild size="lg" className="w-full">
            <Link href="/">Retry Connection</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
