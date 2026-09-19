'use client';

import { ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { AccountNav } from '../../components/account/AccountNav';
import { useAuth } from '../../context/AuthContext';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, openAuthModal } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FDFBF7'
        }}
      >
        <p style={{ color: '#5C6460', fontSize: '0.95rem' }}>Loading your profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: '75vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FDFBF7',
          padding: '24px'
        }}
      >
        <div
          style={{
            maxWidth: '420px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #EBE7DF',
            padding: '36px 28px',
            textAlign: 'center',
            boxShadow: '0 12px 32px rgba(10, 46, 36, 0.05)'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#F5EFE6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: '#0A2E24'
            }}
          >
            <Lock size={26} color="#0A2E24" />
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.6rem',
              color: '#0A2E24',
              margin: '0 0 8px'
            }}
          >
            Sign In Required
          </h1>
          <p
            style={{
              fontSize: '0.88rem',
              color: '#5C6460',
              lineHeight: 1.5,
              margin: '0 0 24px'
            }}
          >
            Please sign in with your mobile number to view your order history, manage saved delivery addresses, and tailor family size preferences.
          </p>

          <button
            onClick={() => openAuthModal({ reason: 'Sign in to access your patron account.' })}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#0A2E24',
              color: '#FDFBF7',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              letterSpacing: '0.05em'
            }}
          >
            Sign In with Mobile OTP
          </button>

          <div style={{ marginTop: '20px' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                color: '#5C6460',
                textDecoration: 'none'
              }}
            >
              <ArrowLeft size={14} /> Back to Storefront
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#FDFBF7', minHeight: '90vh', padding: '32px 16px 64px' }}>
      <div className="royale-container" style={{ maxWidth: '1120px', margin: '0 auto' }}>
        {/* Breadcrumb Ribbon */}
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.82rem',
              color: '#5C6460',
              textDecoration: 'none'
            }}
          >
            <ArrowLeft size={14} /> Back to Store
          </Link>
          <span style={{ color: '#D1C9BE' }}>•</span>
          <span style={{ fontSize: '0.82rem', color: '#0A2E24', fontWeight: 600 }}>Patron Account</span>
        </div>

        {/* 2-Column Responsive Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            alignItems: 'start'
          }}
        >
          {/* Navigation Sidebar */}
          <div style={{ maxWidth: '300px', width: '100%' }}>
            <AccountNav />
          </div>

          {/* Main Content Area */}
          <main style={{ minWidth: 0, flex: 1 }}>{children}</main>
        </div>
      </div>
    </div>
  );
}
