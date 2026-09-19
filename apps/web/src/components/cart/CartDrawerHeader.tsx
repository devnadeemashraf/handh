import { ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';

export function CartDrawerHeader({ totalItemCount }: { totalItemCount: number }) {
  return (
    <SheetHeader className="flex flex-row items-center justify-between border-b border-border px-6 py-4">
      <div className="flex items-center gap-2.5">
        <ShoppingBag className="h-5 w-5 text-primary" />
        <SheetTitle className="font-serif text-xl font-semibold text-primary">
          Collection Bag
        </SheetTitle>
        {totalItemCount > 0 && (
          <Badge variant="gold" className="text-xs px-2 py-0.5 font-bold">
            {totalItemCount}
          </Badge>
        )}
      </div>
    </SheetHeader>
  );
}
