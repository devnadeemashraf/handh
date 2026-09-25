import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, helperText, id, ...props }, ref) => {
    const errorId = id && error ? `${id}-error` : undefined;
    const helperId = id && helperText && !error ? `${id}-helper` : undefined;

    return (
      <div className="w-full">
        <input
          type={type}
          id={id}
          aria-invalid={!!error}
          aria-describedby={errorId || helperId}
          className={cn(
            'flex h-11 w-full rounded-sm border bg-surface px-3 py-2 text-sm text-text-primary transition-colors duration-fast file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-text-tertiary focus-visible:outline-none focus-visible:border-royal focus-visible:ring-1 focus-visible:ring-royal disabled:cursor-not-allowed disabled:bg-sunken disabled:text-text-tertiary',
            error
              ? 'border-status-error bg-status-error-tint/20 focus-visible:border-status-error focus-visible:ring-status-error'
              : 'border-border-subtle hover:border-border-strong',
            className
          )}
          ref={ref}
          {...props}
        />
        {(error || helperText) && (
          <div
            id={errorId || helperId}
            className={cn(
              'mt-1 min-h-[18px] text-xs transition-opacity duration-fast',
              error ? 'text-status-error font-medium' : 'text-text-secondary'
            )}
          >
            {error || helperText}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
