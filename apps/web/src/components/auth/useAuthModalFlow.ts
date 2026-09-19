import * as React from 'react';

import { normalizeIndianPhone } from '@hh/domain';

import type { User } from '@hh/domain';

import type { AuthModalStep } from './auth.types';

export function useAuthModalFlow(
  initialPhone: string = '',
  onSuccess?: (user: User) => void,
  onClose?: () => void
) {
  const [step, setStep] = React.useState<AuthModalStep>('phone');
  const [phone, setPhone] = React.useState(initialPhone);
  const [otp, setOtp] = React.useState('');
  const [whatsappOptIn, setWhatsappOptIn] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [devCode, setDevCode] = React.useState<string | null>(null);
  const [resendTimer, setResendTimer] = React.useState(30);

  React.useEffect(() => {
    if (initialPhone) {
      setPhone(initialPhone);
    }
  }, [initialPhone]);

  // Countdown timer for resend
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && resendTimer > 0) {
      timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, resendTimer]);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const normalizedPhone = normalizeIndianPhone(phone);
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone, purpose: 'login' })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to send verification code. Please try again.');
        setIsLoading(false);
        return;
      }

      if (data.devCode) {
        setDevCode(data.devCode);
        setOtp(data.devCode); // Auto-fill for developer convenience
      }

      setStep('otp');
      setResendTimer(30);
      setIsLoading(false);
    } catch {
      setError('A network error occurred. Please verify your internet connection.');
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const normalizedPhone = normalizeIndianPhone(phone);
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: normalizedPhone,
          code: otp,
          purpose: 'login',
          whatsappOptIn
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Incorrect verification code.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onClose?.();
      if (onSuccess) {
        onSuccess(data.user);
      }
    } catch {
      setError('Failed to complete verification. Please try again.');
      setIsLoading(false);
    }
  };

  return {
    step,
    setStep,
    phone,
    setPhone,
    otp,
    setOtp,
    whatsappOptIn,
    setWhatsappOptIn,
    isLoading,
    error,
    devCode,
    resendTimer,
    handleRequestOtp,
    handleVerifyOtp
  };
}
