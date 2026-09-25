import { cva } from 'class-variance-authority';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

import type { VariantProps } from 'class-variance-authority';

const alertVariants = cva(
  'relative w-full rounded-md p-4 text-sm [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground select-none',
  {
    variants: {
      variant: {
        info: 'bg-accent text-accent-foreground border border-border [&>svg]:text-accent-foreground',
        success:
          'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 [&>svg]:text-emerald-600',
        warning:
          'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20 [&>svg]:text-amber-600',
        error:
          'bg-destructive/10 text-destructive border border-destructive/20 [&>svg]:text-destructive'
      }
    },
    defaultVariants: {
      variant: 'info'
    }
  }
);

const defaultIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  onDismiss?: () => void;
  action?: React.ReactNode;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', children, onDismiss, action, ...props }, ref) => {
    const Icon = defaultIcons[variant || 'info'];

    return (
      <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
        <Icon className="h-4 w-4" aria-hidden="true" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-sm leading-relaxed">{children}</div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss alert"
            className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h5>
  )
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertDescription, AlertTitle };
