'use client';

import { Heart } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../context/AuthContext';

interface WishlistButtonProps {
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
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [isBusy, setIsBusy] = useState(false);

  // Sync with initialWishlisted if prop changes
  useEffect(() => {
    setIsWishlisted(initialWishlisted);
  }, [initialWishlisted]);

  const handleToggle = useCallback(
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
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '14px 20px',
          borderRadius: 'var(--radius-sm, 4px)',
          border: '1px solid var(--color-border, #E4DCCF)',
          backgroundColor: isWishlisted ? 'rgba(197, 168, 128, 0.12)' : 'transparent',
          color: isWishlisted ? 'var(--color-primary, #0A2E24)' : 'var(--color-text, #171A19)',
          fontSize: '0.9rem',
          fontWeight: 500,
          cursor: isBusy ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          width: '100%'
        }}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
      >
        <Heart
          size={size}
          color={isWishlisted ? '#C5A880' : 'currentColor'}
          fill={isWishlisted ? '#C5A880' : 'none'}
          style={{ transition: 'all 0.2s ease' }}
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
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          borderRadius: '9999px',
          border: '1px solid var(--color-border, #E4DCCF)',
          backgroundColor: isWishlisted ? 'rgba(197, 168, 128, 0.15)' : '#ffffff',
          color: isWishlisted
            ? 'var(--color-primary, #0A2E24)'
            : 'var(--color-text-muted, #71717A)',
          fontSize: '0.8rem',
          fontWeight: 500,
          cursor: isBusy ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease'
        }}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
      >
        <Heart
          size={size}
          color={isWishlisted ? '#C5A880' : 'currentColor'}
          fill={isWishlisted ? '#C5A880' : 'none'}
        />
        <span>{isWishlisted ? 'Saved' : 'Wishlist'}</span>
      </button>
    );
  }

  // Default 'icon' floating style
  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isBusy}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(4px)',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        color: isWishlisted ? '#C5A880' : '#171A19',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        cursor: isBusy ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s ease',
        padding: 0
      }}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
    >
      <Heart
        size={size}
        color={isWishlisted ? '#C5A880' : '#171A19'}
        fill={isWishlisted ? '#C5A880' : 'none'}
        style={{ transition: 'all 0.2s ease' }}
      />
    </button>
  );
}
