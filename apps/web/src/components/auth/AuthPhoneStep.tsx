import { MessageSquare } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface AuthPhoneStepProps {
  phone: string;
  setPhone: (phone: string) => void;
  whatsappOptIn: boolean;
  setWhatsappOptIn: (optIn: boolean) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function AuthPhoneStep({
  phone,
  setPhone,
  whatsappOptIn,
  setWhatsappOptIn,
  isLoading,
  onSubmit
}: AuthPhoneStepProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <Label
          htmlFor="auth-phone-input"
          className="mb-2 block text-xs uppercase tracking-wider font-semibold text-foreground"
        >
          Mobile Number
        </Label>
        <div className="flex items-center overflow-hidden rounded-md border border-input bg-card shadow-sm focus-within:ring-1 focus-within:ring-ring focus-within:border-accent">
          <span className="border-r border-border bg-secondary/50 px-3.5 py-2.5 text-sm font-semibold text-primary select-none">
            +91
          </span>
          <Input
            id="auth-phone-input"
            type="tel"
            required
            placeholder="98765 43210"
            value={phone.replace(/^\+91/, '')}
            onChange={(e) => setPhone(e.target.value)}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-transparent px-3.5 py-2.5 text-sm tracking-wider"
          />
        </div>
      </div>

      {/* WhatsApp Opt-in */}
      <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/20 p-3.5">
        <Checkbox
          id="whatsapp-opt-in"
          checked={whatsappOptIn}
          onCheckedChange={(checked) => setWhatsappOptIn(checked === true)}
          className="mt-0.5"
        />
        <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
          <label
            htmlFor="whatsapp-opt-in"
            className="flex items-center gap-1.5 font-semibold text-primary cursor-pointer"
          >
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
            <span>WhatsApp Concierge Updates</span>
          </label>
          <p>
            Receive order confirmation, live courier dispatch, and delivery tracking via our
            WhatsApp bot.
          </p>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        size="lg"
        className="w-full text-sm font-semibold tracking-wider"
      >
        {isLoading ? 'Sending Code...' : 'Send Verification Code'}
      </Button>
    </form>
  );
}
