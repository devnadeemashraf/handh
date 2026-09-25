import { cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

import type { VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.06em] transition-colors focus:outline-none select-none',
  {
    variants: {
      variant: {
        default: 'bg-royal-tint text-royal border-none',
        new: 'bg-royal-tint text-royal border-none',
        sale: 'bg-status-sale/10 text-status-sale font-semibold border-none',
        lowStock: 'bg-status-warning-tint text-status-warning border-none',
        soldOut: 'bg-sunken text-text-tertiary border-none',
        chip: 'border border-border-subtle bg-transparent text-text-primary hover:border-border-strong',
        chipSelected: 'border border-transparent bg-royal-tint text-royal font-medium',
        secondary: 'bg-sunken text-text-secondary border-none',
        destructive: 'bg-status-error-tint text-status-error border-none',
        outline: 'border border-border-subtle text-text-primary',
        gold: 'border border-accent/30 bg-gold-light text-gold-bronze',
        emerald: 'bg-emerald-subtle text-emerald border-none'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
