'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NewsletterSectionProps {
  className?: string;
}

export function NewsletterSection({ className }: NewsletterSectionProps) {
  const [email, setEmail] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    setStatus('loading');

    // Simulate network delay / submit
    await new Promise((resolve) => setTimeout(resolve, 600));
    setStatus('success');
  };

  return (
    <section
      aria-label="Newsletter Subscription"
      className={cn(
        'my-12 sm:my-16 border-t border-border/60 bg-gradient-to-b from-secondary/10 to-background py-16 sm:py-20',
        className
      )}
    >
      <div className="mx-auto max-w-xl px-4 sm:px-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] font-semibold text-accent mb-2">
          The H&H Journal
        </p>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-tight text-foreground mb-3">
          Quiet Letters &amp; Private Previews
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-8 max-w-md mx-auto">
          New arrivals, bespoke releases, and modest styling edits — delivered quietly to your inbox
          before anyone else.
        </p>

        {status === 'success' ? (
          <div
            role="status"
            className="rounded-sm border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-400 flex items-center justify-center gap-3 max-w-md mx-auto"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-xs sm:text-sm font-medium">
              Thank you for subscribing. Welcome to the H&H inner circle.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Enter your email address..."
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === 'error') setStatus('idle');
                  }}
                  disabled={status === 'loading'}
                  aria-label="Email address for newsletter"
                  className={cn(
                    'h-11 rounded-sm bg-background border-border text-xs sm:text-sm focus-visible:ring-accent',
                    status === 'error' && 'border-destructive focus-visible:ring-destructive'
                  )}
                />
                {status === 'error' && errorMessage && (
                  <p className="text-[11px] text-destructive mt-1.5 text-left font-medium">
                    {errorMessage}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={status === 'loading'}
                className="h-11 rounded-sm bg-primary text-primary-foreground hover:bg-primary/90 px-6 text-xs uppercase tracking-wider font-semibold shrink-0"
              >
                {status === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Subscribe</span>
                )}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground/80 mt-3 text-center">
              We respect your quietude. Zero spam. Unsubscribe at any time.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
