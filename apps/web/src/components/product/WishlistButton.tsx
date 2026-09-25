'use client';

import { Heart } from 'lucide-react';
import * as React from 'react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export interface WishlistButtonProps {
  productId: string;
  variantId?: string | undefined;
  variant?: 'icon' | 'pill' | 'button';
  size?: number;
  initialWishlisted?: boolean;
  onToggle?: (wishlisted: boolean) => void;
}

export function WishlistButton({
  productId,
  variantId,
  variant = 'icon',
  size = 20,
  initialWishlisted = false,
  onToggle
}: WishlistButtonProps) {
  const { user, openAuthModal } = useAuth();
  const [isWishlisted, setIsWishlisted] = React.useState(initialWishlisted);
  const [isBusy, setIsBusy] = React.useState(false);

  // Sync with initialWishlisted if prop changes
  React.useEffect(() => {
    setIsWishlisted(initialWishlisted);
  }, [initialWishlisted]);

  const handleToggle = React.useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!user) {
        openAuthModal({
          reason: 'Sign in to save this exquisite handcrafted piece to your wishlist.'
        });
        return;
      }

      if (isBusy) return;
      setIsBusy(true);

      const nextState = !isWishlisted;
      setIsWishlisted(nextState);

      try {
        if (nextState) {
          const res = await fetch('/api/user/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, variantId })
          });
          if (!res.ok) throw new Error();
        } else {
          const res = await fetch(`/api/user/wishlist/${productId}`, {
            method: 'DELETE'
          });
          if (!res.ok) throw new Error();
        }

        onToggle?.(nextState);
      } catch {
        // Revert on failure
        setIsWishlisted(!nextState);
      } finally {
        setIsBusy(false);
      }
    },
    [user, isBusy, isWishlisted, productId, variantId, openAuthModal, onToggle]
  );

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isBusy}
        className={cn(
          'inline-flex w-full items-center justify-center gap-2 rounded-md border border-border px-5 py-3.5 text-sm font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          isWishlisted
            ? 'bg-accent/15 text-primary border-accent/40'
            : 'bg-transparent text-foreground hover:bg-secondary/60'
        )}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
      >
        <Heart
          size={size}
          className={cn(
            'transition-colors',
            isWishlisted ? 'fill-accent text-accent' : 'text-current'
          )}
        />
        <span>{isWishlisted ? 'Saved in Wishlist' : 'Save to Wishlist'}</span>
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isBusy}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-2 text-xs font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          isWishlisted
            ? 'bg-accent/15 text-primary border-accent/40'
            : 'bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
        )}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
      >
        <Heart
          size={size}
          className={cn(
            'transition-colors',
            isWishlisted ? 'fill-accent text-accent' : 'text-current'
          )}
        />
        <span>{isWishlisted ? 'Saved' : 'Wishlist'}</span>
      </button>
    );
  }

  // Default 'icon' floating style with 44x44px touch target (03_COMPONENT_LIBRARY.md)
  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isBusy}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-sm border border-border/80 bg-card/90 backdrop-blur-sm shadow-xs transition-transform active:scale-125 duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 select-none',
        isWishlisted ? 'text-primary' : 'text-foreground hover:text-primary'
      )}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
    >
      <Heart
        size={size}
        className={cn(
          'transition-all duration-fast',
          isWishlisted ? 'fill-primary text-primary' : 'text-current'
        )}
      />
    </button>
  );
}
