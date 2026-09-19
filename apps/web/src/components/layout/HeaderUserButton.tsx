'use client';

import { Heart, LogOut, Package, Settings, Shield, User as UserIcon, Users } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export function HeaderUserButton() {
  const { user, isLoading, openAuthModal, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: '#F5EFE6',
          animation: 'pulse 1.5s infinite'
        }}
      />
    );
  }

  if (!user) {
    return (
      <button
        onClick={() => openAuthModal({ reason: 'Sign in to access your saved orders, addresses, and wishlist.' })}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          backgroundColor: 'transparent',
          border: '1px solid #C5A880',
          borderRadius: '24px',
          color: '#0A2E24',
          fontSize: '0.82rem',
          fontWeight: 600,
          letterSpacing: '0.05em',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#0A2E24';
          e.currentTarget.style.color = '#FDFBF7';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#0A2E24';
        }}
      >
        <UserIcon size={16} />
        <span>Sign In</span>
      </button>
    );
  }

  // Initial letter
  const initial = user.name ? user.name.charAt(0).toUpperCase() : 'H';

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setDropdownOpen((prev) => !prev)}
        aria-label="Account menu"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '24px',
          border: '1px solid #EBE7DF',
          backgroundColor: '#FAFAF8',
          cursor: 'pointer'
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: '#0A2E24',
            color: '#FDFBF7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.82rem',
            fontWeight: 700
          }}
        >
          {initial}
        </div>
        <span
          style={{
            fontSize: '0.82rem',
            fontWeight: 600,
            color: '#171A19',
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {user.name || user.phone}
        </span>
      </button>

      {dropdownOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '240px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #EBE7DF',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(10, 46, 36, 0.12)',
            zIndex: 100,
            overflow: 'hidden'
          }}
        >
          {/* User Ribbon */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #F0ECE4',
              backgroundColor: '#FBF9F5'
            }}
          >
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: '#0A2E24' }}>
              {user.name || 'H&H Patron'}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#5C6460' }}>
              {user.phone}
            </p>
          </div>

          {/* Links */}
          <div style={{ padding: '8px 0' }}>
            <Link
              href="/account"
              onClick={() => setDropdownOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                fontSize: '0.85rem',
                color: '#171A19',
                textDecoration: 'none'
              }}
            >
              <UserIcon size={16} color="#0A2E24" />
              <span>My Profile</span>
            </Link>

            <Link
              href="/account/orders"
              onClick={() => setDropdownOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                fontSize: '0.85rem',
                color: '#171A19',
                textDecoration: 'none'
              }}
            >
              <Package size={16} color="#0A2E24" />
              <span>Order History</span>
            </Link>

            <Link
              href="/account/addresses"
              onClick={() => setDropdownOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                fontSize: '0.85rem',
                color: '#171A19',
                textDecoration: 'none'
              }}
            >
              <Settings size={16} color="#0A2E24" />
              <span>Saved Addresses</span>
            </Link>

            <Link
              href="/account/family"
              onClick={() => setDropdownOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                fontSize: '0.85rem',
                color: '#171A19',
                textDecoration: 'none'
              }}
            >
              <Users size={16} color="#0A2E24" />
              <span>Family & Sizes</span>
            </Link>

            <Link
              href="/account/wishlist"
              onClick={() => setDropdownOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                fontSize: '0.85rem',
                color: '#171A19',
                textDecoration: 'none'
              }}
            >
              <Heart size={16} color="#0A2E24" />
              <span>Saved Wishlist</span>
            </Link>

            {(user.role === 'admin' || user.role === 'super_admin') && (
              <Link
                href="/admin"
                onClick={() => setDropdownOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 16px',
                  fontSize: '0.85rem',
                  color: '#C5A880',
                  fontWeight: 600,
                  textDecoration: 'none',
                  backgroundColor: '#0A2E24'
                }}
              >
                <Shield size={16} color="#C5A880" />
                <span>Admin Portal</span>
              </Link>
            )}
          </div>

          <div style={{ borderTop: '1px solid #F0ECE4', padding: '6px 0' }}>
            <button
              onClick={() => {
                setDropdownOpen(false);
                logout();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 16px',
                fontSize: '0.85rem',
                color: '#991B1B',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
