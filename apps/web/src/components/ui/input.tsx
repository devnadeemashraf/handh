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
            'flex h-11 w-full rounded-sm border bg-background px-3 py-2 text-sm text-foreground transition-colors duration-fast file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
            error
              ? 'border-destructive bg-destructive/10 focus-visible:border-destructive focus-visible:ring-destructive'
              : 'border-input hover:border-ring/50',
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
              error ? 'text-destructive font-medium' : 'text-muted-foreground'
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
