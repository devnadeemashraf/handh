'use client';

import { AlertTriangle, ShoppingBag, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';
import * as React from 'react';
import { AddressForm } from '@/components/checkout/AddressForm';
import { CheckoutHeader } from '@/components/checkout/CheckoutHeader';
import { OrderReviewCard } from '@/components/checkout/OrderReviewCard';
import { OrderSuccessView } from '@/components/checkout/OrderSuccessView';
import { SavedAddressSelector } from '@/components/checkout/SavedAddressSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

import { useCheckoutFlow } from './useCheckoutFlow';

export default function CheckoutPage() {
  const { user, openAuthModal } = useAuth();
  const { cartSummary, isLoading: isCartLoading, clearCart, refreshCart } = useCart();

  const {
    values,
    errors,
    handleFieldChange,
    savedAddresses,
    selectedAddressId,
    isManualAddress,
    handleSelectSavedAddress,
    handleSwitchToManualAddress,
    isSubmitting,
    isProcessingPayment,
    submitError,
    orderPlaced,
    reservationRemainingSecs,
    isServicePaused,
    serviceControl,
    whatsappOptIn,
    setWhatsappOptIn,
    handleSubmit,
    launchPaymentGateway,
    clearPendingOrder
  } = useCheckoutFlow({
    user,
    cartSummary,
    clearCart,
    refreshCart,
    openAuthModal
  });

  // 1. Order Placed Screen (Awaiting Payment or Retry)
  if (orderPlaced) {
    return (
      <>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <OrderSuccessView
          orderPlaced={orderPlaced}
          reservationRemainingSecs={reservationRemainingSecs}
          isProcessingPayment={isProcessingPayment}
          onLaunchGateway={launchPaymentGateway}
          onCancelReservation={clearPendingOrder}
        />
      </>
    );
  }

  // 2. Empty Bag Guard
  if (!isCartLoading && (!cartSummary || cartSummary.items.length === 0)) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <CheckoutHeader />
        <main className="mx-auto flex-1 max-w-lg px-4 py-24 text-center">
          <Card className="border-border bg-card p-8">
            <CardContent className="p-0">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-accent">
                <ShoppingBag className="h-8 w-8" />
              </div>
              <h2 className="font-serif text-2xl font-semibold text-primary mb-2">
                Your Bag is Empty
              </h2>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Add an artisanal piece from our collection to begin checkout.
              </p>
              <Button asChild size="lg" className="w-full">
                <Link href="/">Explore Collection</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <CheckoutHeader />

      <main className="mx-auto flex-1 max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Error Alert Banner */}
        {submitError && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{submitError}</div>
          </div>
        )}

        {/* Maintenance Banner */}
        {isServicePaused && serviceControl && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="font-semibold mb-1">{serviceControl.headline}</div>
            <p className="text-xs text-amber-800 leading-relaxed">
              {serviceControl.maintenanceNotice}
            </p>
          </div>
        )}

        {/* Guest Authentication Prompt Banner */}
        {!user && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-accent/40 bg-secondary/30 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm text-primary">
                  Have an account or need to create one?
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  An account is required to place and track your handcrafted order.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                openAuthModal({
                  reason: 'Sign in or enter your mobile number to complete checkout.',
                  initialPhone: values.phone
                })
              }
              className="shrink-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold text-xs"
            >
              Sign In / Register
            </Button>
          </div>
        )}

        {/* 2-Column Responsive Checkout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Shipping & Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* Saved Address Selector for Logged-In Users */}
            {user && savedAddresses.length > 0 && (
              <SavedAddressSelector
                addresses={savedAddresses}
                selectedAddressId={selectedAddressId}
                isManualAddress={isManualAddress}
                onSelectAddress={handleSelectSavedAddress}
                onSwitchToManual={handleSwitchToManualAddress}
              />
            )}

            {/* Address Input Form */}
            {(!user || savedAddresses.length === 0 || isManualAddress) && (
              <AddressForm
                values={values}
                errors={errors}
                onChange={handleFieldChange}
                disabled={isSubmitting}
              />
            )}
          </div>

          {/* Right Column: Order Summary & Review */}
          <div className="lg:col-span-5">
            {cartSummary && (
              <OrderReviewCard
                cartSummary={cartSummary}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                disabled={isServicePaused}
                destinationState={values.state}
                whatsappOptIn={whatsappOptIn}
                onWhatsappOptInChange={setWhatsappOptIn}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
