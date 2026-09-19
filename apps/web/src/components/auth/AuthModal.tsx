'use client';

import { MessageSquare, ShieldCheck, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { normalizeIndianPhone, type User } from '@hh/domain';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: ((user: User) => void) | undefined;
  reason?: string | undefined;
  initialPhone?: string | undefined;
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  reason,
  initialPhone = ''
}: AuthModalProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState(initialPhone);
  const [otp, setOtp] = useState('');
  const [whatsappOptIn, setWhatsappOptIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(30);

  useEffect(() => {
    if (initialPhone) {
      setPhone(initialPhone);
    }
  }, [initialPhone]);

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'otp' && resendTimer > 0) {
      timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [step, resendTimer]);

  if (!isOpen) return null;

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
      onClose();
      if (onSuccess) {
        onSuccess(data.user);
      }
    } catch {
      setError('Failed to complete verification. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(10, 46, 36, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 24px 48px rgba(10, 46, 36, 0.25)',
          border: '1px solid #EBE7DF',
          overflow: 'hidden',
          animation: 'fadeInScale 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header Ribbon */}
        <div
          style={{
            backgroundColor: '#0A2E24',
            padding: '24px 24px 20px',
            color: '#FDFBF7',
            position: 'relative'
          }}
        >
          <button
            onClick={onClose}
            aria-label="Close authentication modal"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(253, 251, 247, 0.6)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ShieldCheck size={18} color="#C5A880" />
            <span
              style={{
                fontSize: '0.75rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: '#C5A880',
                fontWeight: 600
              }}
            >
              H&H Secure Access
            </span>
          </div>

          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-serif)',
              fontSize: '1.4rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
              color: '#FDFBF7'
            }}
          >
            {step === 'phone' ? 'Sign In or Create Account' : 'Verify Mobile Number'}
          </h2>

          <p
            style={{
              margin: '6px 0 0',
              fontSize: '0.85rem',
              color: 'rgba(253, 251, 247, 0.75)',
              lineHeight: 1.4
            }}
          >
            {reason ||
              (step === 'phone'
                ? 'Enter your phone number to manage orders, wishlist, and family preferences.'
                : `We sent a 6-digit code to ${phone}`)}
          </p>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {error && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#991B1B',
                fontSize: '0.85rem',
                marginBottom: '16px'
              }}
            >
              {error}
            </div>
          )}

          {step === 'phone' ? (
            <form onSubmit={handleRequestOtp}>
              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#171A19',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Mobile Number
                </label>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1.5px solid #EBE7DF',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#FAFAF8'
                  }}
                >
                  <span
                    style={{
                      padding: '12px 14px',
                      backgroundColor: '#F5EFE6',
                      color: '#0A2E24',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      borderRight: '1px solid #EBE7DF'
                    }}
                  >
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="98765 43210"
                    value={phone.replace(/^\+91/, '')}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      border: 'none',
                      outline: 'none',
                      fontSize: '1rem',
                      backgroundColor: 'transparent',
                      color: '#171A19',
                      letterSpacing: '0.05em'
                    }}
                  />
                </div>
              </div>

              {/* WhatsApp Opt-in */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  cursor: 'pointer',
                  marginBottom: '20px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#FBF9F5',
                  border: '1px solid #F0ECE4'
                }}
              >
                <input
                  type="checkbox"
                  checked={whatsappOptIn}
                  onChange={(e) => setWhatsappOptIn(e.target.checked)}
                  style={{ marginTop: '3px', accentColor: '#0A2E24' }}
                />
                <div style={{ fontSize: '0.8rem', color: '#5C6460', lineHeight: 1.4 }}>
                  <span
                    style={{
                      fontWeight: 600,
                      color: '#0A2E24',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <MessageSquare size={14} color="#164335" /> WhatsApp Concierge Updates
                  </span>
                  Receive order confirmation, live courier dispatch, and delivery tracking via our
                  WhatsApp bot.
                </div>
              </label>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#0A2E24',
                  color: '#FDFBF7',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  letterSpacing: '0.05em',
                  transition: 'background-color 0.2s'
                }}
              >
                {isLoading ? 'Sending Code...' : 'Send Verification Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              {devCode && (
                <div
                  style={{
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FCD34D',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#92400E',
                    fontSize: '0.8rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>
                    Development OTP: <strong>{devCode}</strong>
                  </span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Auto-filled</span>
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#171A19',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Enter 6-Digit Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: '1.5px solid #0A2E24',
                    borderRadius: '8px',
                    fontSize: '1.4rem',
                    textAlign: 'center',
                    letterSpacing: '0.35em',
                    fontWeight: 700,
                    color: '#0A2E24',
                    backgroundColor: '#FAFAF8',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#0A2E24',
                  color: '#FDFBF7',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: isLoading || otp.length !== 6 ? 'not-allowed' : 'pointer',
                  opacity: isLoading || otp.length !== 6 ? 0.6 : 1,
                  letterSpacing: '0.05em',
                  marginBottom: '16px'
                }}
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.82rem',
                  color: '#5C6460'
                }}
              >
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0A2E24',
                    cursor: 'pointer',
                    fontWeight: 500,
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  Change number
                </button>

                {resendTimer > 0 ? (
                  <span>Resend in {resendTimer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRequestOtp()}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#C5A880',
                      cursor: 'pointer',
                      fontWeight: 600,
                      padding: 0
                    }}
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
