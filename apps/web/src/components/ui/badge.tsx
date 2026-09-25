import { cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

import type { VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.06em] transition-colors focus:outline-none select-none',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        new: 'border-transparent bg-accent text-accent-foreground',
        sale: 'border-transparent bg-destructive/10 text-destructive font-semibold',
        lowStock: 'border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-400',
        soldOut: 'border-transparent bg-muted text-muted-foreground',
        chip: 'border border-input bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground',
        chipSelected: 'border border-transparent bg-accent text-accent-foreground font-medium',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'border border-border text-foreground',
        gold: 'border border-accent bg-accent/40 text-foreground',
        emerald: 'border-transparent bg-emerald-500/10 text-emerald-700'
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
