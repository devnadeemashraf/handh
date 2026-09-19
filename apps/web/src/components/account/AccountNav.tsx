'use client';

import { Heart, LogOut, MapPin, Package, Shield, User as UserIcon, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { useAuth } from '@/context/AuthContext';

export function AccountNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const links = [
    { href: '/account', label: 'My Profile', icon: UserIcon },
    { href: '/account/orders', label: 'Order History', icon: Package },
    { href: '/account/addresses', label: 'Saved Addresses', icon: MapPin },
    { href: '/account/family', label: 'Family & Sizes', icon: Users },
    { href: '/account/wishlist', label: 'Saved Wishlist', icon: Heart }
  ];

  return (
    <nav
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #EBE7DF',
        borderRadius: '12px',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(10, 46, 36, 0.03)'
      }}
    >
      <div
        style={{ padding: '8px 12px 14px', borderBottom: '1px solid #F0ECE4', marginBottom: '6px' }}
      >
        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: '#0A2E24' }}>
          {user?.name || 'H&H Patron'}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#5C6460' }}>{user?.phone}</p>
      </div>

      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#0A2E24' : '#5C6460',
              backgroundColor: isActive ? '#F5EFE6' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon size={18} color={isActive ? '#0A2E24' : '#8C928F'} />
            <span>{link.label}</span>
          </Link>
        );
      })}

      {(user?.role === 'admin' || user?.role === 'super_admin') && (
        <Link
          href="/admin"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: 600,
            color: '#C5A880',
            backgroundColor: '#0A2E24',
            textDecoration: 'none',
            marginTop: '8px'
          }}
        >
          <Shield size={18} color="#C5A880" />
          <span>Admin Portal</span>
        </Link>
      )}

      <div style={{ borderTop: '1px solid #F0ECE4', marginTop: '8px', paddingTop: '6px' }}>
        <button
          onClick={logout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: '8px',
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
    </nav>
  );
}
