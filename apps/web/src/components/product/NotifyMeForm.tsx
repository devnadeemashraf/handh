'use client';

import { Bell, Check, Loader2 } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export interface NotifyMeFormProps {
  productId?: string;
  variantId?: string;
  variantTitle?: string;
  className?: string;
}

export function NotifyMeForm({ variantTitle, className }: NotifyMeFormProps) {
  const [email, setEmail] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setIsSubmitting(true);
    // Simulate notification subscription
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSubmitting(false);
    setIsSubmitted(true);

    toast({
      message: "You'll be notified when this piece is back in stock.",
      variant: 'success'
    });
  };

  if (isSubmitted) {
    return (
      <div className="flex items-center gap-2 rounded-sm border border-border bg-muted/50 p-3 text-xs text-foreground">
        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
        <span>
          We will notify you at <strong className="font-medium">{email}</strong> as soon as
          restocked.
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="rounded-sm border border-border bg-muted/30 p-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Bell className="h-3.5 w-3.5 text-primary" />
          <span>
            Notify me when {variantTitle ? `"${variantTitle}"` : 'available'} is restocked
          </span>
        </div>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-10 text-xs bg-background"
          />
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={isSubmitting || !email}
            className="h-10 shrink-0 text-xs px-4"
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Notify Me'}
          </Button>
        </div>
      </div>
    </form>
  );
}
