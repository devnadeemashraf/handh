'use client';

import { CheckCircle2, Loader2, Send } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const SUPPORT_TOPICS = [
  'Order issue',
  'Shipping question',
  'Return or exchange',
  'Product question',
  'Other'
] as const;

export type SupportTopic = (typeof SUPPORT_TOPICS)[number];

export function ContactForm() {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    orderNumber: '',
    topic: 'Order issue' as SupportTopic,
    message: ''
  });

  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Please enter your full name.');
      setStatus('error');
      return;
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrorMessage('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      setErrorMessage('Please provide a message with at least 10 characters.');
      setStatus('error');
      return;
    }

    setStatus('loading');

    // Simulate async submission to support queue
    await new Promise((resolve) => setTimeout(resolve, 600));
    setStatus('success');
  };

  if (status === 'success') {
    return (
      <div
        role="status"
        className="rounded-sm border border-emerald-500/30 bg-emerald-500/10 p-8 text-center text-emerald-400 space-y-3"
      >
        <div className="flex justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h3 className="font-serif text-lg font-medium text-foreground">
          Message Received With Gratitude
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          Thank you, <strong className="text-foreground">{formData.name}</strong>. Our concierge
          team has received your inquiry regarding <em>{formData.topic}</em>. We will review it and
          respond to <strong className="text-foreground">{formData.email}</strong> within 24 hours.
        </p>
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setFormData({
                name: '',
                email: '',
                orderNumber: '',
                topic: 'Order issue',
                message: ''
              });
              setStatus('idle');
            }}
            className="rounded-sm text-xs"
          >
            Send Another Inquiry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === 'error' && errorMessage && (
        <div
          role="alert"
          className="rounded-sm border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive font-medium"
        >
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="contact-name"
            className="block text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1.5"
          >
            Full Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="contact-name"
            name="name"
            type="text"
            required
            placeholder="Amina Khan"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="h-10 rounded-sm bg-background border-border text-xs sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="contact-email"
            className="block text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1.5"
          >
            Email Address <span className="text-destructive">*</span>
          </label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            placeholder="amina@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="h-10 rounded-sm bg-background border-border text-xs sm:text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="contact-order"
            className="block text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1.5"
          >
            Order Number <span className="text-muted-foreground/60 font-normal">(Optional)</span>
          </label>
          <Input
            id="contact-order"
            name="orderNumber"
            type="text"
            placeholder="HH-2026-..."
            value={formData.orderNumber}
            onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
            className="h-10 rounded-sm bg-background border-border text-xs sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="contact-topic"
            className="block text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1.5"
          >
            Inquiry Topic <span className="text-destructive">*</span>
          </label>
          <select
            id="contact-topic"
            name="topic"
            value={formData.topic}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value as SupportTopic })}
            className={cn(
              'flex h-10 w-full rounded-sm border border-border bg-background px-3 py-2 text-xs sm:text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent'
            )}
          >
            {SUPPORT_TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="contact-message"
          className="block text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1.5"
        >
          Message <span className="text-destructive">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          required
          placeholder="Please describe how we can assist you..."
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full rounded-sm border border-border bg-background p-3 text-xs sm:text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        />
      </div>

      <Button
        type="submit"
        disabled={status === 'loading'}
        className="w-full sm:w-auto h-11 px-8 rounded-sm bg-primary text-primary-foreground font-semibold text-xs uppercase tracking-wider"
      >
        {status === 'loading' ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Transmitting...</span>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            <span>Send Inquiry</span>
          </span>
        )}
      </Button>
    </form>
  );
}
