'use client';

import {
  AlertTriangle,
  ArrowRight,
  Check,
  CreditCard,
  Edit2,
  Lock,
  MessageSquare,
  Package,
  ShieldCheck,
  Truck
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import * as React from 'react';
import { AddressForm, type AddressFormValues } from '@/components/checkout/AddressForm';
import { SavedAddressSelector } from '@/components/checkout/SavedAddressSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import {
  calculateCheckoutFinancials,
  DEFAULT_BRAND_IDENTITY,
  extractIndianPhoneDigits,
  Money
} from '@hh/domain';

import type { CartSummary, User, UserAddress } from '@hh/domain';

export interface ContinuousCheckoutProps {
  user: User | null;
  cartSummary: CartSummary;
  values: AddressFormValues;
  errors: Partial<Record<keyof AddressFormValues, string>>;
  onFieldChange: (field: keyof AddressFormValues, value: string) => void;
  savedAddresses: UserAddress[];
  selectedAddressId: string | null;
  isManualAddress: boolean;
  onSelectSavedAddress: (addr: UserAddress) => void;
  onSwitchToManualAddress: () => void;
  activeStep: number;
  completedSteps: number[];
  goToStep: (step: number) => void;
  completeContactStep: () => boolean;
  completeAddressStep: () => boolean;
  completeShippingStep: () => void;
  completePaymentStep: () => void;
  shippingMethod: 'standard' | 'express';
  onShippingMethodChange: (method: 'standard' | 'express') => void;
  paymentMethod: 'razorpay' | 'cod';
  onPaymentMethodChange: (method: 'razorpay' | 'cod') => void;
  billingSameAsShipping: boolean;
  onBillingSameAsShippingChange: (same: boolean) => void;
  emailMarketingOptIn: boolean;
  onEmailMarketingOptInChange: (optIn: boolean) => void;
  whatsappOptIn: boolean;
  onWhatsappOptInChange: (optIn: boolean) => void;
  isSubmitting: boolean;
  isProcessingPayment: boolean;
  submitError: string | null;
  isServicePaused: boolean;
  appliedPromo?: { code: string; discountMinor: number } | null;
  onAppliedPromoChange?: (promo: { code: string; discountMinor: number } | null) => void;
  onSubmit: (couponCode?: string) => void;
  onOpenAuthModal: () => void;
}

export function ContinuousCheckout({
  user,
  cartSummary,
  values,
  errors,
  onFieldChange,
  savedAddresses,
  selectedAddressId,
  isManualAddress,
  onSelectSavedAddress,
  onSwitchToManualAddress,
  activeStep,
  completedSteps,
  goToStep,
  completeContactStep,
  completeAddressStep,
  completeShippingStep,
  completePaymentStep,
  shippingMethod,
  onShippingMethodChange,
  paymentMethod,
  onPaymentMethodChange,
  billingSameAsShipping,
  onBillingSameAsShippingChange,
  emailMarketingOptIn,
  onEmailMarketingOptInChange,
  whatsappOptIn,
  onWhatsappOptInChange,
  isSubmitting,
  isProcessingPayment,
  submitError,
  isServicePaused,
  appliedPromo,
  onSubmit,
  onOpenAuthModal
}: ContinuousCheckoutProps) {
  const isStepComplete = (stepNum: number) => completedSteps.includes(stepNum);

  const financials = calculateCheckoutFinancials(cartSummary.subtotalMinor, 'INR', {
    discountMinor: appliedPromo?.discountMinor ?? 0,
    destinationState: values.state
  });

  const standardFeeFormatted = financials.isFreeDelivery ? 'FREE' : '₹99.00';
  const expressFeeFormatted = financials.isFreeDelivery ? '₹99.00' : '₹199.00';
  const totalFormatted = Money.fromMinor(financials.totalMinor, 'INR').format();

  return (
    <div className="space-y-4">
      {/* Non-dismissible Global Error Alert if submission or payment failed */}
      {submitError && (
        <div
          role="alert"
          className="rounded-md border border-status-error/40 bg-status-error-bg/50 p-4 text-sm text-text-primary space-y-1.5"
        >
          <div className="flex items-center gap-2 font-semibold text-status-error">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Unable to process payment</span>
          </div>
          <p className="text-xs leading-relaxed text-text-secondary">{submitError}</p>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STEP 1: CONTACT INFORMATION
         ───────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="step-1-heading"
        className={cn(
          'rounded-md border bg-card transition-colors duration-fast shadow-sm',
          activeStep === 1 ? 'border-royal ring-1 ring-royal' : 'border-border-subtle'
        )}
      >
        {activeStep === 1 ? (
          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-royal text-text-inverse text-xs font-semibold">
                  1
                </span>
                <h2
                  id="step-1-heading"
                  className="font-serif text-lg font-semibold text-text-primary"
                >
                  Contact Information
                </h2>
              </div>

              {!user && (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="text-xs text-royal hover:underline font-semibold"
                >
                  Already have an account? Sign in
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="contact-email"
                  className="mb-1.5 block text-xs uppercase tracking-wider font-semibold text-text-secondary"
                >
                  Email Address <span className="text-status-error">*</span>
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  autoComplete="email"
                  placeholder="e.g. aisha@example.com"
                  value={values.email}
                  onChange={(e) => onFieldChange('email', e.target.value)}
                  disabled={isSubmitting}
                  {...(errors.email ? { error: errors.email } : {})}
                  className="rounded-md"
                />
              </div>

              <div>
                <Label
                  htmlFor="contact-phone"
                  className="mb-1.5 block text-xs uppercase tracking-wider font-semibold text-text-secondary"
                >
                  Mobile Number (SMS &amp; Courier) <span className="text-status-error">*</span>
                </Label>
                <div className="flex items-center overflow-hidden rounded-md border border-input bg-surface focus-within:ring-1 focus-within:ring-royal">
                  <span className="border-r border-border-subtle bg-surface-sunken px-3.5 py-2.5 text-sm font-mono font-medium text-text-secondary select-none">
                    +91
                  </span>
                  <input
                    id="contact-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={16}
                    placeholder="10-digit mobile"
                    value={
                      extractIndianPhoneDigits(values.phone) || values.phone.replace(/^\+91/, '')
                    }
                    onChange={(e) => {
                      const digits = extractIndianPhoneDigits(e.target.value);
                      onFieldChange('phone', digits ? `+91${digits}` : e.target.value);
                    }}
                    disabled={isSubmitting}
                    className="w-full bg-transparent px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none font-mono tabular-nums"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-status-error font-medium" role="alert">
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Optional Newsletter Checkbox */}
            <label className="flex items-center gap-2.5 text-xs text-text-secondary select-none cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={emailMarketingOptIn}
                onChange={(e) => onEmailMarketingOptInChange(e.target.checked)}
                className="h-4 w-4 rounded-sm border-border-subtle text-royal focus:ring-royal"
              />
              <span>Email me with exclusive collection previews and artisanal offers</span>
            </label>

            <div className="pt-2">
              <Button
                type="button"
                size="lg"
                onClick={() => completeContactStep()}
                className="w-full sm:w-auto px-6 h-11 text-sm font-semibold rounded-md gap-2"
              >
                <span>Continue to Delivery Address</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          /* Collapsed Summary Row with Edit */
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold shrink-0',
                  isStepComplete(1)
                    ? 'bg-status-success text-text-inverse'
                    : 'bg-surface-sunken text-text-tertiary'
                )}
              >
                {isStepComplete(1) ? <Check className="h-3.5 w-3.5" /> : '1'}
              </span>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider font-semibold text-text-secondary">
                  Contact Information
                </div>
                <div className="text-sm font-medium text-text-primary truncate">
                  {values.email ? `${values.email} · ${values.phone}` : 'Enter contact details'}
                </div>
              </div>
            </div>

            {isStepComplete(1) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => goToStep(1)}
                className="h-8 px-2.5 text-xs font-semibold text-royal hover:underline gap-1.5 shrink-0"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Button>
            )}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          STEP 2: DELIVERY ADDRESS
         ───────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="step-2-heading"
        className={cn(
          'rounded-md border bg-card transition-colors duration-fast shadow-sm',
          activeStep === 2 ? 'border-royal ring-1 ring-royal' : 'border-border-subtle'
        )}
      >
        {activeStep === 2 ? (
          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-royal text-text-inverse text-xs font-semibold">
                  2
                </span>
                <h2
                  id="step-2-heading"
                  className="font-serif text-lg font-semibold text-text-primary"
                >
                  Delivery Address
                </h2>
              </div>
            </div>

            {user && savedAddresses.length > 0 && !isManualAddress ? (
              <div className="space-y-4">
                <SavedAddressSelector
                  addresses={savedAddresses}
                  selectedAddressId={selectedAddressId}
                  isManualAddress={isManualAddress}
                  onSelectAddress={onSelectSavedAddress}
                  onSwitchToManual={onSwitchToManualAddress}
                />
              </div>
            ) : (
              <AddressForm
                values={values}
                errors={errors}
                onChange={onFieldChange}
                disabled={isSubmitting}
              />
            )}

            <div className="pt-2">
              <Button
                type="button"
                size="lg"
                onClick={() => completeAddressStep()}
                className="w-full sm:w-auto px-6 h-11 text-sm font-semibold rounded-md gap-2"
              >
                <span>Continue to Shipping Method</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          /* Collapsed Summary Row with Edit */
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold shrink-0',
                  isStepComplete(2)
                    ? 'bg-status-success text-text-inverse'
                    : 'bg-surface-sunken text-text-tertiary'
                )}
              >
                {isStepComplete(2) ? <Check className="h-3.5 w-3.5" /> : '2'}
              </span>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider font-semibold text-text-secondary">
                  Delivery Address
                </div>
                <div className="text-sm font-medium text-text-primary truncate">
                  {values.fullName
                    ? `${values.fullName}, ${values.line1}, ${values.city}, ${values.state} ${values.postalCode}`
                    : 'Enter shipping destination'}
                </div>
              </div>
            </div>

            {isStepComplete(2) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => goToStep(2)}
                className="h-8 px-2.5 text-xs font-semibold text-royal hover:underline gap-1.5 shrink-0"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Button>
            )}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          STEP 3: SHIPPING METHOD
         ───────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="step-3-heading"
        className={cn(
          'rounded-md border bg-card transition-colors duration-fast shadow-sm',
          activeStep === 3 ? 'border-royal ring-1 ring-royal' : 'border-border-subtle'
        )}
      >
        {activeStep === 3 ? (
          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-royal text-text-inverse text-xs font-semibold">
                3
              </span>
              <h2
                id="step-3-heading"
                className="font-serif text-lg font-semibold text-text-primary"
              >
                Shipping Method
              </h2>
            </div>

            <div className="space-y-3" role="radiogroup" aria-label="Shipping Method">
              {/* Option 1: Standard Courier Delivery */}
              <label
                className={cn(
                  'flex items-center justify-between p-4 rounded-md border cursor-pointer transition-colors',
                  shippingMethod === 'standard'
                    ? 'border-royal bg-royal/5 text-text-primary'
                    : 'border-border-subtle hover:border-border-strong text-text-secondary'
                )}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="standard"
                    checked={shippingMethod === 'standard'}
                    onChange={() => onShippingMethodChange('standard')}
                    className="h-4 w-4 text-royal focus:ring-royal"
                  />
                  <div>
                    <div className="font-semibold text-sm text-text-primary flex items-center gap-2">
                      <Truck className="h-4 w-4 text-royal shrink-0" />
                      <span>Standard Courier Delivery (4–6 business days)</span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Complimentary surface courier across all serviceable Indian pin codes
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    'font-mono tabular-nums text-sm font-semibold shrink-0',
                    financials.isFreeDelivery ? 'text-status-success' : 'text-text-primary'
                  )}
                >
                  {standardFeeFormatted}
                </span>
              </label>

              {/* Option 2: Express Courier Delivery */}
              <label
                className={cn(
                  'flex items-center justify-between p-4 rounded-md border cursor-pointer transition-colors',
                  shippingMethod === 'express'
                    ? 'border-royal bg-royal/5 text-text-primary'
                    : 'border-border-subtle hover:border-border-strong text-text-secondary'
                )}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value="express"
                    checked={shippingMethod === 'express'}
                    onChange={() => onShippingMethodChange('express')}
                    className="h-4 w-4 text-royal focus:ring-royal"
                  />
                  <div>
                    <div className="font-semibold text-sm text-text-primary flex items-center gap-2">
                      <Package className="h-4 w-4 text-royal shrink-0" />
                      <span>Express Air Dispatch (1–2 business days)</span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-0.5">
                      Priority courier dispatch with air expedited routing
                    </p>
                  </div>
                </div>
                <span className="font-mono tabular-nums text-sm font-semibold text-text-primary shrink-0">
                  {expressFeeFormatted}
                </span>
              </label>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                size="lg"
                onClick={() => completeShippingStep()}
                className="w-full sm:w-auto px-6 h-11 text-sm font-semibold rounded-md gap-2"
              >
                <span>Continue to Payment Selection</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          /* Collapsed Summary Row with Edit */
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold shrink-0',
                  isStepComplete(3)
                    ? 'bg-status-success text-text-inverse'
                    : 'bg-surface-sunken text-text-tertiary'
                )}
              >
                {isStepComplete(3) ? <Check className="h-3.5 w-3.5" /> : '3'}
              </span>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider font-semibold text-text-secondary">
                  Shipping Method
                </div>
                <div className="text-sm font-medium text-text-primary truncate">
                  {shippingMethod === 'express'
                    ? 'Express Air Dispatch (1–2 business days)'
                    : 'Standard Courier Delivery (4–6 business days)'}
                </div>
              </div>
            </div>

            {isStepComplete(3) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => goToStep(3)}
                className="h-8 px-2.5 text-xs font-semibold text-royal hover:underline gap-1.5 shrink-0"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Button>
            )}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          STEP 4: PAYMENT SELECTION
         ───────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="step-4-heading"
        className={cn(
          'rounded-md border bg-card transition-colors duration-fast shadow-sm',
          activeStep === 4 ? 'border-royal ring-1 ring-royal' : 'border-border-subtle'
        )}
      >
        {activeStep === 4 ? (
          <div className="p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-royal text-text-inverse text-xs font-semibold">
                4
              </span>
              <h2
                id="step-4-heading"
                className="font-serif text-lg font-semibold text-text-primary"
              >
                Payment Selection
              </h2>
            </div>

            <div className="space-y-3" role="radiogroup" aria-label="Payment Method">
              {/* Option 1: Razorpay Secure Gateway */}
              <label
                className={cn(
                  'flex items-start justify-between p-4 rounded-md border cursor-pointer transition-colors',
                  paymentMethod === 'razorpay'
                    ? 'border-royal bg-royal/5 text-text-primary'
                    : 'border-border-subtle hover:border-border-strong text-text-secondary'
                )}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={() => onPaymentMethodChange('razorpay')}
                    className="h-4 w-4 mt-0.5 text-royal focus:ring-royal"
                  />
                  <div>
                    <div className="font-semibold text-sm text-text-primary flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-royal shrink-0" />
                      <span>Razorpay Secure Gateway (Instant Confirmation)</span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-1">
                      UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, NetBanking, and Wallets
                    </p>
                  </div>
                </div>
              </label>

              {/* Option 2: Cash on Delivery (COD) */}
              <label
                className={cn(
                  'flex items-start justify-between p-4 rounded-md border cursor-pointer transition-colors',
                  paymentMethod === 'cod'
                    ? 'border-royal bg-royal/5 text-text-primary'
                    : 'border-border-subtle hover:border-border-strong text-text-secondary'
                )}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => onPaymentMethodChange('cod')}
                    className="h-4 w-4 mt-0.5 text-royal focus:ring-royal"
                  />
                  <div>
                    <div className="font-semibold text-sm text-text-primary flex items-center gap-2">
                      <Package className="h-4 w-4 text-royal shrink-0" />
                      <span>Cash on Delivery (Pay upon Receipt)</span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-1">
                      Hand payment to delivery courier upon receipt of artisanal package
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {/* Billing Address Same as Shipping */}
            <div className="pt-2 border-t border-border-subtle">
              <label className="flex items-center gap-2.5 text-xs text-text-primary select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={billingSameAsShipping}
                  onChange={(e) => onBillingSameAsShippingChange(e.target.checked)}
                  className="h-4 w-4 rounded-sm border-border-subtle text-royal focus:ring-royal"
                />
                <span className="font-medium">Billing address is same as delivery address</span>
              </label>
            </div>

            {/* Plain Restrained Trust Reassurance per spec 07_CART_AND_CHECKOUT.md §7.2 */}
            <div className="flex items-center gap-2 text-xs text-text-tertiary py-1">
              <Lock className="h-3.5 w-3.5 text-royal shrink-0" aria-hidden="true" />
              <span>
                Secure checkout with 256-bit encryption. We never store your full card details or
                passwords.
              </span>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                size="lg"
                onClick={() => completePaymentStep()}
                className="w-full sm:w-auto px-6 h-11 text-sm font-semibold rounded-md gap-2"
              >
                <span>Continue to Review &amp; Place Order</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          /* Collapsed Summary Row with Edit */
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold shrink-0',
                  isStepComplete(4)
                    ? 'bg-status-success text-text-inverse'
                    : 'bg-surface-sunken text-text-tertiary'
                )}
              >
                {isStepComplete(4) ? <Check className="h-3.5 w-3.5" /> : '4'}
              </span>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider font-semibold text-text-secondary">
                  Payment Method
                </div>
                <div className="text-sm font-medium text-text-primary truncate">
                  {paymentMethod === 'razorpay'
                    ? 'Razorpay Secure Gateway (UPI, Cards, NetBanking)'
                    : 'Cash on Delivery (Pay on Receipt)'}
                </div>
              </div>
            </div>

            {isStepComplete(4) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => goToStep(4)}
                className="h-8 px-2.5 text-xs font-semibold text-royal hover:underline gap-1.5 shrink-0"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Button>
            )}
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          STEP 5: REVIEW & PLACE ORDER
         ───────────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="step-5-heading"
        className={cn(
          'rounded-md border bg-card transition-colors duration-fast shadow-sm',
          activeStep === 5 ? 'border-royal ring-1 ring-royal' : 'border-border-subtle opacity-75'
        )}
      >
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2.5 border-b border-border-subtle pb-3">
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                activeStep === 5
                  ? 'bg-royal text-text-inverse'
                  : 'bg-surface-sunken text-text-tertiary'
              )}
            >
              5
            </span>
            <h2 id="step-5-heading" className="font-serif text-lg font-semibold text-text-primary">
              Review &amp; Place Order
            </h2>
          </div>

          {activeStep === 5 && (
            <div className="space-y-5 animate-in fade-in-50 duration-fast">
              {/* Condensed Thumbnail Strip */}
              <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {cartSummary.items.map((item) => (
                  <div
                    key={item.variantId}
                    className="relative w-14 h-18 aspect-[4/5] shrink-0 rounded-md border border-border-subtle bg-surface-sunken overflow-hidden"
                  >
                    {item.primaryImageUrl ? (
                      <Image
                        src={item.primaryImageUrl}
                        alt={item.productTitle}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-royal">
                        H&amp;H
                      </div>
                    )}
                    <span className="absolute bottom-1 right-1 bg-surface text-text-primary text-[10px] font-mono px-1 rounded-sm shadow-sm font-semibold">
                      ×{item.effectiveQuantity}
                    </span>
                  </div>
                ))}
              </div>

              {/* Statutory GST Tax Itemization */}
              {financials.taxMinor > 0 && (
                <div
                  data-testid="gst-breakdown"
                  className="rounded-md bg-surface-sunken/60 p-3.5 border border-border-subtle text-xs space-y-1.5 text-text-secondary"
                >
                  <div className="flex justify-between font-semibold text-text-primary">
                    <span>Statutory GST Included ({financials.gst?.ratePercent ?? 18}%)</span>
                    <span className="font-mono tabular-nums">
                      {Money.fromMinor(financials.taxMinor, 'INR').format()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] pl-2 border-l-2 border-royal/30">
                    <span>Taxable Base</span>
                    <span className="font-mono tabular-nums">
                      {Money.fromMinor(financials.taxableAmountMinor, 'INR').format()}
                    </span>
                  </div>
                  {financials.gst?.isInterState ? (
                    <div className="flex justify-between text-[11px] pl-2 border-l-2 border-royal/30">
                      <span>IGST ({financials.gst.ratePercent}%) · Inter-state</span>
                      <span className="font-mono tabular-nums">
                        {Money.fromMinor(financials.igstMinor, 'INR').format()}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-[11px] pl-2 border-l-2 border-royal/30">
                        <span>CGST ({financials.gst ? financials.gst.ratePercent / 2 : 9}%)</span>
                        <span className="font-mono tabular-nums">
                          {Money.fromMinor(financials.cgstMinor, 'INR').format()}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] pl-2 border-l-2 border-royal/30">
                        <span>SGST ({financials.gst ? financials.gst.ratePercent / 2 : 9}%)</span>
                        <span className="font-mono tabular-nums">
                          {Money.fromMinor(financials.sgstMinor, 'INR').format()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* WhatsApp Notification Opt-In (E-COM-082) */}
              <div className="rounded-md border border-status-success/30 bg-status-success-bg/30 p-3 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    id="whatsapp-opt-in-checkbox"
                    data-testid="whatsapp-opt-in-checkbox"
                    checked={whatsappOptIn}
                    onChange={(e) => onWhatsappOptInChange(e.target.checked)}
                    disabled={isSubmitting || isProcessingPayment}
                    className="mt-0.5 h-4 w-4 rounded-sm border-status-success/40 text-royal focus:ring-royal cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-medium text-text-primary">
                      <MessageSquare className="h-3.5 w-3.5 text-status-success shrink-0" />
                      <span>Receive order and delivery updates on WhatsApp</span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-normal">
                      Instant shipment tracking and concierge assistance sent directly to your
                      phone.
                    </p>
                  </div>
                </label>
              </div>

              {/* Affirmative Pre-Purchase Legal Terms Notice */}
              <div
                id="contract-formation-notice"
                data-testid="contract-formation-notice"
                className="text-xs text-text-tertiary leading-relaxed text-center px-1"
              >
                By placing this order, you confirm and agree to {DEFAULT_BRAND_IDENTITY.name}&apos;s{' '}
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-royal font-medium underline underline-offset-2 hover:text-royal/80"
                >
                  Terms of Sale
                </Link>
                ,{' '}
                <Link
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-royal font-medium underline underline-offset-2 hover:text-royal/80"
                >
                  Privacy Policy
                </Link>
                , and{' '}
                <Link
                  href="/refunds"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-royal font-medium underline underline-offset-2 hover:text-royal/80"
                >
                  Refund Policy
                </Link>
                .
              </div>

              {/* Primary Place Order CTA */}
              <Button
                type="button"
                onClick={() => onSubmit(appliedPromo?.code)}
                disabled={
                  isServicePaused ||
                  isSubmitting ||
                  isProcessingPayment ||
                  !cartSummary.isValidForCheckout
                }
                size="lg"
                aria-describedby="contract-formation-notice"
                className="w-full text-base font-semibold rounded-md shadow-sm min-h-12 active:scale-[0.98]"
              >
                {isSubmitting || isProcessingPayment ? (
                  <span>Securing Handcrafted Stock &amp; Connecting...</span>
                ) : (
                  <span>Place Order &amp; Pay {totalFormatted}</span>
                )}
              </Button>

              {/* Reassurance Seal */}
              <div className="flex items-center justify-center gap-1.5 text-xs text-text-tertiary">
                <ShieldCheck className="h-3.5 w-3.5 text-royal" />
                <span>256-Bit Encrypted Secure Checkout</span>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
