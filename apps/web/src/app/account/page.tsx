'use client';

import { Check, CheckCircle2, MessageSquare, Phone } from 'lucide-react';
import React, { useState } from 'react';

import { useAuth } from '../../context/AuthContext';

export default function AccountProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [whatsappOptIn, setWhatsappOptIn] = useState(user?.whatsappOptIn ?? true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          whatsappOptIn
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to update profile.');
        setIsSaving(false);
        return;
      }

      await refreshUser();
      setSaveSuccess(true);
      setIsSaving(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setErrorMessage('Network error while saving profile.');
      setIsSaving(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #EBE7DF',
        borderRadius: '12px',
        padding: '28px',
        boxShadow: '0 4px 12px rgba(10, 46, 36, 0.03)'
      }}
    >
      <div
        style={{ borderBottom: '1px solid #F0ECE4', paddingBottom: '16px', marginBottom: '24px' }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '1.6rem',
            color: '#0A2E24',
            margin: '0 0 6px'
          }}
        >
          My Profile & Preferences
        </h1>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#5C6460' }}>
          Manage your personal details, email receipts, and WhatsApp concierge communication
          preferences.
        </p>
      </div>

      {saveSuccess && (
        <div
          style={{
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#065F46',
            fontSize: '0.88rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <CheckCircle2 size={16} color="#059669" />
          <span>Your profile preferences were updated successfully.</span>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#991B1B',
            fontSize: '0.88rem',
            marginBottom: '20px'
          }}
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Mobile Number (Read-only / verified primary key) */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#171A19',
              marginBottom: '6px'
            }}
          >
            Registered Mobile Number
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              backgroundColor: '#FAFAF8',
              border: '1px solid #EBE7DF',
              borderRadius: '8px',
              color: '#171A19',
              fontSize: '0.95rem',
              fontWeight: 600
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={16} color="#5C6460" />
              <span>{user?.phone}</span>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                color: '#059669',
                backgroundColor: '#ECFDF5',
                padding: '4px 8px',
                borderRadius: '12px',
                fontWeight: 600
              }}
            >
              <Check size={12} /> Verified
            </span>
          </div>
          <span
            style={{ fontSize: '0.75rem', color: '#8C928F', marginTop: '4px', display: 'block' }}
          >
            Primary account identifier used for OTP verification and WhatsApp delivery updates.
          </span>
        </div>

        {/* Full Name */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#171A19',
              marginBottom: '6px'
            }}
          >
            Full Name
          </label>
          <input
            type="text"
            placeholder="e.g. Fatima Al-Zahra"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #EBE7DF',
              borderRadius: '8px',
              fontSize: '0.92rem',
              color: '#171A19',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Email Address */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#171A19',
              marginBottom: '6px'
            }}
          >
            Email Address (for tax invoices & receipts)
          </label>
          <input
            type="email"
            placeholder="e.g. patron@handh.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 14px',
              border: '1px solid #EBE7DF',
              borderRadius: '8px',
              fontSize: '0.92rem',
              color: '#171A19',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* WhatsApp Concierge Communication */}
        <div
          style={{
            padding: '16px',
            backgroundColor: '#FBF9F5',
            border: '1px solid #F0ECE4',
            borderRadius: '8px'
          }}
        >
          <label
            style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}
          >
            <input
              type="checkbox"
              checked={whatsappOptIn}
              onChange={(e) => setWhatsappOptIn(e.target.checked)}
              style={{ marginTop: '3px', accentColor: '#0A2E24' }}
            />
            <div>
              <span
                style={{
                  fontWeight: 700,
                  color: '#0A2E24',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '2px'
                }}
              >
                <MessageSquare size={15} color="#164335" /> WhatsApp Concierge Updates
              </span>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#5C6460', lineHeight: 1.4 }}>
                Receive instant order placement confirmations, live DTDC / India Post courier scan
                alerts, and doorstep delivery notifications directly to your WhatsApp.
              </p>
            </div>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          style={{
            alignSelf: 'flex-start',
            padding: '12px 28px',
            backgroundColor: '#0A2E24',
            color: '#FDFBF7',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.7 : 1,
            letterSpacing: '0.04em'
          }}
        >
          {isSaving ? 'Saving Changes...' : 'Save Profile Details'}
        </button>
      </form>
    </div>
  );
}
