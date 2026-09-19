import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface AuthOtpStepProps {
  otp: string;
  setOtp: (otp: string) => void;
  devCode: string | null;
  isLoading: boolean;
  resendTimer: number;
  onVerify: (e: React.FormEvent) => void;
  onChangeNumber: () => void;
  onResend: () => void;
}

export function AuthOtpStep({
  otp,
  setOtp,
  devCode,
  isLoading,
  resendTimer,
  onVerify,
  onChangeNumber,
  onResend
}: AuthOtpStepProps) {
  return (
    <form onSubmit={onVerify} className="space-y-5">
      {devCode && (
        <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900">
          <span>
            Development OTP: <strong>{devCode}</strong>
          </span>
          <span className="text-[11px] opacity-75">Auto-filled</span>
        </div>
      )}

      <div>
        <Label
          htmlFor="auth-otp-input"
          className="mb-2 block text-xs uppercase tracking-wider font-semibold text-foreground"
        >
          Enter 6-Digit Code
        </Label>
        <Input
          id="auth-otp-input"
          type="text"
          maxLength={6}
          required
          autoFocus
          placeholder="• • • • • •"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="h-12 text-center text-xl font-bold tracking-[0.35em] text-primary"
        />
      </div>

      <Button
        type="submit"
        disabled={isLoading || otp.length !== 6}
        size="lg"
        className="w-full text-sm font-semibold tracking-wider"
      >
        {isLoading ? 'Verifying...' : 'Verify & Continue'}
      </Button>

      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <button
          type="button"
          onClick={onChangeNumber}
          className="text-primary hover:text-accent font-medium underline underline-offset-4 transition-colors"
        >
          Change number
        </button>

        {resendTimer > 0 ? (
          <span>Resend in {resendTimer}s</span>
        ) : (
          <button
            type="button"
            onClick={onResend}
            className="text-accent hover:text-primary font-semibold transition-colors"
          >
            Resend Code
          </button>
        )}
      </div>
    </form>
  );
}
