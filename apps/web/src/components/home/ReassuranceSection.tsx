import { Clock, Shield, Sparkles, Truck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import type { StorefrontReassurance } from '@hh/domain';

export function ReassuranceSection({ items }: { items: StorefrontReassurance[] }) {
  if (items.length === 0) return null;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'truck':
        return <Truck className="h-5 w-5 text-primary" />;
      case 'shield':
        return <Shield className="h-5 w-5 text-primary" />;
      case 'clock':
        return <Clock className="h-5 w-5 text-primary" />;
      case 'sparkles':
      default:
        return <Sparkles className="h-5 w-5 text-accent" />;
    }
  };

  return (
    <section className="my-16 border-y border-border bg-card/60 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, idx) => {
            const isCard = item.cardStyle === 'card';
            const isOutline = item.cardStyle === 'outline';

            return (
              <Card
                key={idx}
                className={cn(
                  'border-0 shadow-none bg-transparent',
                  isCard && 'border border-border bg-card shadow-sm',
                  isOutline && 'border border-border/80 bg-transparent'
                )}
              >
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    {renderIcon(item.icon)}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-primary leading-tight mb-1">
                      {item.title}
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
