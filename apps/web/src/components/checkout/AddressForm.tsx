'use client';

import React from 'react';
import { INDIAN_STATES, type ShippingAddressInput } from '@hh/domain';
import { MapPin } from 'lucide-react';

export interface AddressFormValues extends ShippingAddressInput {
  customerNotes?: string;
}

interface AddressFormProps {
  values: AddressFormValues;
  errors: Partial<Record<keyof AddressFormValues, string>>;
  onChange: (field: keyof AddressFormValues, value: string) => void;
  disabled?: boolean;
}

export function AddressForm({ values, errors, onChange, disabled = false }: AddressFormProps) {
  const inputStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '48px',
    padding: '12px 14px',
    fontSize: '1rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    backgroundColor: '#FFFFFF',
    color: 'var(--color-text)',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--color-text)',
    marginBottom: '6px'
  };

  const errorStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    color: '#DC2626',
    marginTop: '4px',
    display: 'block'
  };

  const handleFieldChange = (field: keyof AddressFormValues, val: string) => {
    onChange(field, val);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        padding: '24px 20px'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '16px',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={20} color="var(--color-primary-emerald)" />
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              color: 'var(--color-primary-emerald)',
              margin: 0
            }}
          >
            Shipping Details
          </h2>
        </div>
        <span
          className="royale-badge royale-badge-gold"
          style={{ fontSize: '0.7rem', textTransform: 'uppercase' }}
        >
          India Delivery
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" style={labelStyle}>
            Full Name <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="e.g. Maryam Siddiqui"
              value={values.fullName}
              onChange={(e) => handleFieldChange('fullName', e.target.value)}
              disabled={disabled}
              style={{
                ...inputStyle,
                borderColor: errors.fullName ? '#DC2626' : 'var(--color-border)'
              }}
            />
          </div>
          {errors.fullName && <span style={errorStyle}>{errors.fullName}</span>}
        </div>

        {/* Contact Info Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px'
          }}
        >
          {/* Mobile Phone */}
          <div>
            <label htmlFor="phone" style={labelStyle}>
              Mobile Number (for SMS & Courier) <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <div style={{ position: 'relative', display: 'flex' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0 12px',
                  backgroundColor: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRight: 'none',
                  borderTopLeftRadius: 'var(--radius-sm)',
                  borderBottomLeftRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  color: 'var(--color-text-muted)',
                  fontWeight: 500
                }}
              >
                +91
              </span>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={10}
                placeholder="10-digit mobile"
                value={values.phone}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                  handleFieldChange('phone', cleaned);
                }}
                disabled={disabled}
                style={{
                  ...inputStyle,
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  borderColor: errors.phone ? '#DC2626' : 'var(--color-border)'
                }}
              />
            </div>
            {errors.phone && <span style={errorStyle}>{errors.phone}</span>}
          </div>

          {/* Email Address */}
          <div>
            <label htmlFor="email" style={labelStyle}>
              Email Address (for Order Confirmation) <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="e.g. maryam@example.com"
              value={values.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              disabled={disabled}
              style={{
                ...inputStyle,
                borderColor: errors.email ? '#DC2626' : 'var(--color-border)'
              }}
            />
            {errors.email && <span style={errorStyle}>{errors.email}</span>}
          </div>
        </div>

        {/* Address Line 1 */}
        <div>
          <label htmlFor="line1" style={labelStyle}>
            Flat / House No. / Building & Street <span style={{ color: '#DC2626' }}>*</span>
          </label>
          <input
            id="line1"
            name="line1"
            type="text"
            autoComplete="address-line1"
            placeholder="e.g. Flat 104, Crescent Pearl Apartments, Banjara Hills Road No. 12"
            value={values.line1}
            onChange={(e) => handleFieldChange('line1', e.target.value)}
            disabled={disabled}
            style={{
              ...inputStyle,
              borderColor: errors.line1 ? '#DC2626' : 'var(--color-border)'
            }}
          />
          {errors.line1 && <span style={errorStyle}>{errors.line1}</span>}
        </div>

        {/* Address Line 2 */}
        <div>
          <label htmlFor="line2" style={labelStyle}>
            Landmark / Area (Optional)
          </label>
          <input
            id="line2"
            name="line2"
            type="text"
            autoComplete="address-line2"
            placeholder="e.g. Near Star Hospital / Opposite City Center"
            value={values.line2 ?? ''}
            onChange={(e) => handleFieldChange('line2', e.target.value)}
            disabled={disabled}
            style={{
              ...inputStyle,
              borderColor: errors.line2 ? '#DC2626' : 'var(--color-border)'
            }}
          />
          {errors.line2 && <span style={errorStyle}>{errors.line2}</span>}
        </div>

        {/* City, State, PIN Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px'
          }}
        >
          {/* PIN Code */}
          <div>
            <label htmlFor="postalCode" style={labelStyle}>
              PIN Code <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              id="postalCode"
              name="postalCode"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              placeholder="6 digits (e.g. 500034)"
              value={values.postalCode}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                handleFieldChange('postalCode', cleaned);
              }}
              disabled={disabled}
              style={{
                ...inputStyle,
                borderColor: errors.postalCode ? '#DC2626' : 'var(--color-border)'
              }}
            />
            {errors.postalCode && <span style={errorStyle}>{errors.postalCode}</span>}
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" style={labelStyle}>
              City <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              id="city"
              name="city"
              type="text"
              autoComplete="address-level2"
              placeholder="e.g. Hyderabad"
              value={values.city}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              disabled={disabled}
              style={{
                ...inputStyle,
                borderColor: errors.city ? '#DC2626' : 'var(--color-border)'
              }}
            />
            {errors.city && <span style={errorStyle}>{errors.city}</span>}
          </div>

          {/* State */}
          <div>
            <label htmlFor="state" style={labelStyle}>
              State / UT <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <select
              id="state"
              name="state"
              autoComplete="address-level1"
              value={values.state}
              onChange={(e) => handleFieldChange('state', e.target.value)}
              disabled={disabled}
              style={{
                ...inputStyle,
                borderColor: errors.state ? '#DC2626' : 'var(--color-border)',
                appearance: 'auto'
              }}
            >
              <option value="">Select State</option>
              {INDIAN_STATES.map((stateName) => (
                <option key={stateName} value={stateName}>
                  {stateName}
                </option>
              ))}
            </select>
            {errors.state && <span style={errorStyle}>{errors.state}</span>}
          </div>
        </div>

        {/* Customer Notes */}
        <div>
          <label htmlFor="customerNotes" style={labelStyle}>
            Special Instructions / Delivery Notes (Optional)
          </label>
          <textarea
            id="customerNotes"
            name="customerNotes"
            rows={2}
            maxLength={500}
            placeholder="e.g. Fragile artisanal item - please call before delivery or leave at front desk."
            value={values.customerNotes ?? ''}
            onChange={(e) => handleFieldChange('customerNotes', e.target.value)}
            disabled={disabled}
            style={{
              ...inputStyle,
              minHeight: '64px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </div>
      </div>
    </div>
  );
}
