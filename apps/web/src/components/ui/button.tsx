import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';

import type { VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-medium tracking-[0.02em] transition-all duration-instant ease-standard focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-royal text-white hover:bg-royal-hover active:bg-royal-hover shadow-none border border-transparent',
        default:
          'bg-royal text-white hover:bg-royal-hover active:bg-royal-hover shadow-none border border-transparent',
        secondary:
          'border border-border-strong bg-transparent text-text-primary hover:bg-sunken active:bg-sunken/80',
        outline:
          'border border-border-strong bg-transparent text-text-primary hover:bg-sunken active:bg-sunken/80',
        ghost: 'text-text-primary hover:bg-sunken active:bg-sunken/80',
        destructive:
          'border border-status-error/30 text-status-error hover:bg-status-error-tint active:bg-status-error-tint/80',
        link: 'text-royal underline-offset-4 hover:underline p-0 h-auto active:scale-100',
        gold: 'bg-accent text-primary font-semibold hover:bg-gold-hover shadow-sm border border-accent/40 active:scale-[0.98]'
      },
      size: {
        default: 'h-11 min-h-[44px] px-5 py-2.5',
        md: 'h-11 min-h-[44px] px-5 py-2.5',
        sm: 'h-9 min-h-[36px] min-w-[44px] px-3.5 py-1.5 text-xs',
        lg: 'h-12 min-h-[48px] px-8 py-3 text-base',
        icon: 'h-11 w-11 min-h-[44px] min-w-[44px] p-0'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, disabled, children, ...props },
    ref
  ) => {
    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" aria-hidden="true" />
            <span className="opacity-80">{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
