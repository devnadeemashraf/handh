'use client';

import { Check, Edit2, MapPin, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { INDIAN_STATES } from '@hh/domain';

import type { UserAddress } from '@hh/domain';

export default function AccountAddressesPage() {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    label: 'Home',
    recipientName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: 'Telangana',
    postalCode: '',
    isDefault: false
  });

  const loadAddresses = async () => {
    try {
      const res = await fetch('/api/user/addresses');
      const data = await res.json();
      if (data.success && Array.isArray(data.addresses)) {
        setAddresses(data.addresses);
      }
    } catch {
      setError('Failed to load address book.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setFormData({
      label: 'Home',
      recipientName: '',
      phone: '',
      line1: '',
      line2: '',
      city: '',
      state: 'Telangana',
      postalCode: '',
      isDefault: addresses.length === 0
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (addr: UserAddress) => {
    setEditingAddress(addr);
    setFormData({
      label: addr.label,
      recipientName: addr.recipientName,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      isDefault: addr.isDefault
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const endpoint = editingAddress
      ? `/api/user/addresses/${editingAddress.id}`
      : '/api/user/addresses';
    const method = editingAddress ? 'PATCH' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to save address.');
        return;
      }

      setShowAddModal(false);
      await loadAddresses();
    } catch {
      setError('Network error while saving address.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this delivery address?')) return;

    try {
      await fetch(`/api/user/addresses/${id}`, { method: 'DELETE' });
      await loadAddresses();
    } catch {
      setError('Failed to delete address.');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await fetch(`/api/user/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true })
      });
      await loadAddresses();
    } catch {
      setError('Failed to set default address.');
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
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #F0ECE4',
          paddingBottom: '16px',
          marginBottom: '24px'
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.6rem',
              color: '#0A2E24',
              margin: '0 0 6px'
            }}
          >
            Saved Delivery Addresses
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#5C6460' }}>
            Manage shipping destinations for swift, single-tap dispatch at checkout.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            backgroundColor: '#0A2E24',
            color: '#FDFBF7',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Plus size={16} /> Add Address
        </button>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            padding: '12px',
            color: '#991B1B',
            fontSize: '0.85rem',
            marginBottom: '20px'
          }}
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <p style={{ color: '#5C6460' }}>Loading addresses...</p>
      ) : addresses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <MapPin size={32} color="#C5A880" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontWeight: 600, color: '#0A2E24', margin: '0 0 4px' }}>
            No Saved Addresses
          </p>
          <p style={{ fontSize: '0.85rem', color: '#5C6460', margin: '0 0 16px' }}>
            Save your home or work address for seamless doorstep delivery.
          </p>
          <button
            onClick={handleOpenAdd}
            style={{
              padding: '10px 20px',
              backgroundColor: '#0A2E24',
              color: '#FDFBF7',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Add First Address
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}
        >
          {addresses.map((addr) => (
            <div
              key={addr.id}
              style={{
                border: addr.isDefault ? '2px solid #0A2E24' : '1px solid #EBE7DF',
                borderRadius: '12px',
                padding: '20px',
                backgroundColor: addr.isDefault ? '#FBF9F5' : '#FFFFFF',
                position: 'relative'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '10px'
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#0A2E24',
                    backgroundColor: '#F5EFE6',
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}
                >
                  {addr.label}
                </span>

                {addr.isDefault && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#059669',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Check size={12} /> Default
                  </span>
                )}
              </div>

              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '0.95rem', color: '#171A19' }}>
                {addr.recipientName}
              </p>
              <p style={{ margin: '0 0 2px', fontSize: '0.85rem', color: '#5C6460' }}>
                {addr.line1}
              </p>
              {addr.line2 && (
                <p style={{ margin: '0 0 2px', fontSize: '0.85rem', color: '#5C6460' }}>
                  {addr.line2}
                </p>
              )}
              <p style={{ margin: '0 0 6px', fontSize: '0.85rem', color: '#5C6460' }}>
                {addr.city}, {addr.state} — {addr.postalCode}
              </p>
              <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#0A2E24', fontWeight: 600 }}>
                Phone: {addr.phone}
              </p>

              {/* Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderTop: '1px solid #F0ECE4',
                  paddingTop: '12px'
                }}
              >
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.78rem',
                      color: '#0A2E24',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Set Default
                  </button>
                )}

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleOpenEdit(addr)}
                    aria-label="Edit address"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#5C6460',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    aria-label="Delete address"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#991B1B',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(10, 46, 36, 0.6)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #EBE7DF',
              overflow: 'hidden',
              boxShadow: '0 24px 48px rgba(10, 46, 36, 0.2)'
            }}
          >
            <div
              style={{
                backgroundColor: '#0A2E24',
                padding: '18px 24px',
                color: '#FDFBF7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <h2 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-serif)' }}>
                {editingAddress ? 'Edit Delivery Address' : 'New Delivery Address'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: '#FDFBF7', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#171A19', marginBottom: '4px' }}>
                    Label
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Home / Work"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #EBE7DF', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#171A19', marginBottom: '4px' }}>
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full recipient name"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #EBE7DF', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#171A19', marginBottom: '4px' }}>
                  Delivery Contact Phone (+91)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+919876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #EBE7DF', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#171A19', marginBottom: '4px' }}>
                  Address Line 1
                </label>
                <input
                  type="text"
                  required
                  placeholder="Flat / Villa / Street"
                  value={formData.line1}
                  onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #EBE7DF', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#171A19', marginBottom: '4px' }}>
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Apartment name, Landmark"
                  value={formData.line2}
                  onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #EBE7DF', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#171A19', marginBottom: '4px' }}>
                    City
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #EBE7DF', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#171A19', marginBottom: '4px' }}>
                    State
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #EBE7DF', borderRadius: '6px', backgroundColor: '#FFFFFF' }}
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#171A19', marginBottom: '4px' }}>
                    PIN Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="6 digits"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #EBE7DF', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  style={{ accentColor: '#0A2E24' }}
                />
                <span style={{ fontSize: '0.85rem', color: '#171A19' }}>Make this my default shipping address</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '10px 16px',
                    border: '1px solid #EBE7DF',
                    borderRadius: '6px',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#0A2E24',
                    color: '#FDFBF7',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {editingAddress ? 'Update Address' : 'Save Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
