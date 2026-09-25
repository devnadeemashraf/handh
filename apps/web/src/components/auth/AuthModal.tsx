'use client';

import { ShieldCheck, X } from 'lucide-react';
import * as React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

import { getBrandSecureAccessTitle } from '@hh/domain';

import { AuthOtpStep } from './AuthOtpStep';
import { AuthPhoneStep } from './AuthPhoneStep';
import { useAuthModalFlow } from './useAuthModalFlow';

import type { AuthModalProps } from './auth.types';

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  reason,
  initialPhone = ''
}: AuthModalProps) {
  const {
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
  } = useAuthModalFlow(initialPhone, onSuccess, onClose);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md overflow-hidden p-0 border-border bg-card shadow-2xl">
        {/* Header Ribbon */}
        <div className="relative bg-primary px-6 py-6 text-primary-foreground">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close authentication modal"
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-1.5 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <span className="text-[0.7rem] uppercase tracking-[0.2em] font-semibold text-accent">
              {getBrandSecureAccessTitle()}
            </span>
          </div>

          <DialogTitle className="font-serif text-xl sm:text-2xl font-semibold tracking-wide text-primary-foreground">
            {step === 'phone' ? 'Sign In or Create Account' : 'Verify Mobile Number'}
          </DialogTitle>

          <DialogDescription className="mt-1 text-xs text-primary-foreground/80 leading-relaxed">
            {reason ||
              (step === 'phone'
                ? 'Enter your phone number to manage orders, wishlist, and family preferences.'
                : `We sent a 6-digit code to ${phone}`)}
          </DialogDescription>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <AuthPhoneStep
              phone={phone}
              setPhone={setPhone}
              whatsappOptIn={whatsappOptIn}
              setWhatsappOptIn={setWhatsappOptIn}
              isLoading={isLoading}
              onSubmit={handleRequestOtp}
            />
          ) : (
            <AuthOtpStep
              otp={otp}
              setOtp={setOtp}
              devCode={devCode}
              isLoading={isLoading}
              resendTimer={resendTimer}
              onVerify={handleVerifyOtp}
              onChangeNumber={() => setStep('phone')}
              onResend={() => handleRequestOtp()}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { AuthModalProps };
