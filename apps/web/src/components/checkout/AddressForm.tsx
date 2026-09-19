'use client';

import { MapPin } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { INDIAN_STATES } from '@hh/domain';

import type { ShippingAddressInput } from '@hh/domain';

export interface AddressFormValues extends ShippingAddressInput {
  customerNotes?: string;
}

export interface AddressFormProps {
  values: AddressFormValues;
  errors: Partial<Record<keyof AddressFormValues, string>>;
  onChange: (field: keyof AddressFormValues, value: string) => void;
  disabled?: boolean;
}

export function AddressForm({ values, errors, onChange, disabled = false }: AddressFormProps) {
  const handleFieldChange = (field: keyof AddressFormValues, val: string) => {
    onChange(field, val);
  };

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="p-6">
        <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-xl font-semibold text-primary">Shipping Details</h2>
          </div>
          <Badge variant="gold" className="text-[0.65rem] uppercase font-semibold tracking-wider">
            India Delivery
          </Badge>
        </div>

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <Label
              htmlFor="fullName"
              className="mb-1.5 block text-xs uppercase tracking-wider font-semibold text-foreground"
            >
              Full Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="e.g. Maryam Siddiqui"
              value={values.fullName}
              onChange={(e) => handleFieldChange('fullName', e.target.value)}
              disabled={disabled}
              className={cn(errors.fullName && 'border-destructive focus-visible:ring-destructive')}
            />
            {errors.fullName && (
              <span className="mt-1 block text-xs text-destructive">{errors.fullName}</span>
            )}
          </div>

          {/* Contact Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mobile Phone */}
            <div>
              <Label
                htmlFor="phone"
                className="mb-1.5 block text-xs uppercase tracking-wider font-semibold text-foreground"
              >
                Mobile Number (for SMS &amp; Courier) <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center overflow-hidden rounded-md border border-input bg-card shadow-sm focus-within:ring-1 focus-within:ring-ring focus-within:border-accent">
                <span className="border-r border-border bg-secondary/50 px-3.5 py-2.5 text-sm font-semibold text-primary select-none">
                  +91
                </span>
                <Input
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
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:border-transparent px-3 py-2 text-sm"
                />
              </div>
              {errors.phone && (
                <span className="mt-1 block text-xs text-destructive">{errors.phone}</span>
              )}
            </div>

            {/* Email Address */}
            <div>
              <Label
                htmlFor="email"
                className="mb-1.5 block text-xs uppercase tracking-wider font-semibold text-foreground"
              >
                Email Address (for Order Confirmation) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="e.g. maryam@example.com"
                value={values.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                disabled={disabled}
                className={cn(errors.email && 'border-destructive focus-visible:ring-destructive')}
              />
              {errors.email && (
                <span className="mt-1 block text-xs text-destructive">{errors.email}</span>
              )}
            </div>
          </div>

          {/* Address Line 1 */}
          <div>
            <Label
              htmlFor="line1"
              className="mb-1.5 block text-xs uppercase tracking-wider font-semibold text-foreground"
            >
              Flat / House No. / Building &amp; Street <span className="text-destructive">*</span>
            </Label>
            <Input
              id="line1"
              name="line1"
              type="text"
              autoComplete="address-line1"
              placeholder="e.g. Flat 104, Crescent Pearl Apartments, Banjara Hills Road No. 12"
              value={values.line1}
              onChange={(e) => handleFieldChange('line1', e.target.value)}
              disabled={disabled}
              className={cn(errors.line1 && 'border-destructive focus-visible:ring-destructive')}
            />
            {errors.line1 && (
              <span className="mt-1 block text-xs text-destructive">{errors.line1}</span>
            )}
          </div>

          {/* Address Line 2 */}
          <div>
            <Label
              htmlFor="line2"
              className="mb-1.5 block text-xs uppercase tracking-wider font-semibold text-muted-foreground"
            >
              Landmark / Area (Optional)
            </Label>
            <Input
              id="line2"
              name="line2"
              type="text"
              autoComplete="address-line2"
              placeholder="e.g. Near Star Hospital / Opposite City Center"
              value={values.line2 ?? ''}
              onChange={(e) => handleFieldChange('line2', e.target.value)}
              disabled={disabled}
              className={cn(errors.line2 && 'border-destructive focus-visible:ring-destructive')}
            />
            {errors.line2 && (
              <span className="mt-1 block text-xs text-destructive">{errors.line2}</span>
            )}
          </div>

          {/* City, State, PIN Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* PIN Code */}
            <div>
              <Label
                htmlFor="postalCode"
                className="mb-1.5 block text-xs uppercase tracking-wider font-semibold text-foreground"
              >
                PIN Code <span className="text-destructive">*</span>
              </Label>
              <Input
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
                className={cn(
                  errors.postalCode && 'border-destructive focus-visible:ring-destructive'
                )}
              />
              {errors.postalCode && (
                <span className="mt-1 block text-xs text-destructive">{errors.postalCode}</span>
              )}
            </div>

            {/* City */}
            <div>
              <Label
                htmlFor="city"
                className="mb-1.5 block text-xs uppercase tracking-wider font-semibold text-foreground"
              >
                City <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city"
                name="city"
                type="text"
                autoComplete="address-level2"
                placeholder="e.g. Hyderabad"
                value={values.city}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                disabled={disabled}
                className={cn(errors.city && 'border-destructive focus-visible:ring-destructive')}
              />
              {errors.city && (
                <span className="mt-1 block text-xs text-destructive">{errors.city}</span>
              )}
            </div>

            {/* State */}
            <div>
              <Label
                htmlFor="state"
                className="mb-1.5 block text-xs uppercase tracking-wider font-semibold text-foreground"
              >
                State / UT <span className="text-destructive">*</span>
              </Label>
              <select
                id="state"
                name="state"
                autoComplete="address-level1"
                value={values.state}
                onChange={(e) => handleFieldChange('state', e.target.value)}
                disabled={disabled}
                className={cn(
                  'flex h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
                  errors.state && 'border-destructive'
                )}
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((stateName) => (
                  <option key={stateName} value={stateName}>
                    {stateName}
                  </option>
                ))}
              </select>
              {errors.state && (
                <span className="mt-1 block text-xs text-destructive">{errors.state}</span>
              )}
            </div>
          </div>

          {/* Customer Notes */}
          <div>
            <Label
              htmlFor="customerNotes"
              className="mb-1.5 block text-xs uppercase tracking-wider font-semibold text-muted-foreground"
            >
              Special Instructions / Delivery Notes (Optional)
            </Label>
            <Textarea
              id="customerNotes"
              name="customerNotes"
              rows={2}
              maxLength={500}
              placeholder="e.g. Fragile artisanal item - please call before delivery or leave at front desk."
              value={values.customerNotes ?? ''}
              onChange={(e) => handleFieldChange('customerNotes', e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
