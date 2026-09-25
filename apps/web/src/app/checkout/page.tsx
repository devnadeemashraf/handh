'use client';

import { Clock, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';
import * as React from 'react';
import { CheckoutHeader } from '@/components/checkout/CheckoutHeader';
import { ContinuousCheckout } from '@/components/checkout/ContinuousCheckout';
import { MobileOrderSummaryBar } from '@/components/checkout/MobileOrderSummaryBar';
import { OrderReviewCard } from '@/components/checkout/OrderReviewCard';
import { OrderSuccessView } from '@/components/checkout/OrderSuccessView';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

import { useCheckoutFlow } from './useCheckoutFlow';

export default function CheckoutPage() {
  const { user, openAuthModal } = useAuth();
  const { cartSummary, isLoading: isCartLoading, clearCart, refreshCart } = useCart();

  const [appliedPromo, setAppliedPromo] = React.useState<{
    code: string;
    discountMinor: number;
  } | null>(null);

  const {
    values,
    errors,
    handleFieldChange,
    savedAddresses,
    selectedAddressId,
    isManualAddress,
    handleSelectSavedAddress,
    handleSwitchToManualAddress,
    activeStep,
    completedSteps,
    goToStep,
    completeContactStep,
    completeAddressStep,
    completeShippingStep,
    completePaymentStep,
    shippingMethod,
    setShippingMethod,
    paymentMethod,
    setPaymentMethod,
    billingSameAsShipping,
    setBillingSameAsShipping,
    emailMarketingOptIn,
    setEmailMarketingOptIn,
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

  // 2. Empty Bag Guard per 11_UX_STATE_CATALOGUE.md
  if (!isCartLoading && (!cartSummary || cartSummary.items.length === 0)) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <CheckoutHeader />
        <main className="mx-auto flex-1 max-w-lg px-4 py-24 text-center">
          <div className="rounded-md border border-border bg-card p-8 shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h2 className="font-serif text-2xl font-semibold text-foreground mb-2">
              Your bag is empty
            </h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Everything you add will show up here.
            </p>
            <Button asChild size="lg" className="w-full rounded-md">
              <Link href="/shop">Start Shopping</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <CheckoutHeader />

      {/* Mobile Collapsible Top Order Summary Bar per spec 07_CART_AND_CHECKOUT.md §7.2 */}
      {cartSummary && (
        <MobileOrderSummaryBar
          cartSummary={cartSummary}
          appliedPromo={appliedPromo}
          destinationState={values.state}
        />
      )}

      <main className="mx-auto flex-1 max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Maintenance Notice Banner if active */}
        {isServicePaused && serviceControl && (
          <div
            role="alert"
            className="mb-6 rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground"
          >
            <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-400 mb-1">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{serviceControl.headline}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {serviceControl.maintenanceNotice}
            </p>
          </div>
        )}

        {/* 2-Column Responsive Checkout Grid: Left 5-step accordion + Right sticky order summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: 5-Step Continuous Accordion */}
          <div className="lg:col-span-7">
            {cartSummary && (
              <ContinuousCheckout
                user={user}
                cartSummary={cartSummary}
                values={values}
                errors={errors}
                onFieldChange={handleFieldChange}
                savedAddresses={savedAddresses}
                selectedAddressId={selectedAddressId}
                isManualAddress={isManualAddress}
                onSelectSavedAddress={handleSelectSavedAddress}
                onSwitchToManualAddress={handleSwitchToManualAddress}
                activeStep={activeStep}
                completedSteps={completedSteps}
                goToStep={goToStep}
                completeContactStep={completeContactStep}
                completeAddressStep={completeAddressStep}
                completeShippingStep={completeShippingStep}
                completePaymentStep={completePaymentStep}
                shippingMethod={shippingMethod}
                onShippingMethodChange={setShippingMethod}
                paymentMethod={paymentMethod}
                onPaymentMethodChange={setPaymentMethod}
                billingSameAsShipping={billingSameAsShipping}
                onBillingSameAsShippingChange={setBillingSameAsShipping}
                emailMarketingOptIn={emailMarketingOptIn}
                onEmailMarketingOptInChange={setEmailMarketingOptIn}
                whatsappOptIn={whatsappOptIn}
                onWhatsappOptInChange={setWhatsappOptIn}
                isSubmitting={isSubmitting}
                isProcessingPayment={isProcessingPayment}
                submitError={submitError}
                isServicePaused={isServicePaused}
                appliedPromo={appliedPromo}
                onAppliedPromoChange={setAppliedPromo}
                onSubmit={(code) => handleSubmit(code || appliedPromo?.code)}
                onOpenAuthModal={() =>
                  openAuthModal({
                    reason: 'Sign in to access your saved addresses and order history.',
                    initialPhone: values.phone
                  })
                }
              />
            )}
          </div>

          {/* Right Column: Desktop Sticky Order Review & Summary Panel */}
          <div className="hidden lg:block lg:col-span-5">
            {cartSummary && (
              <OrderReviewCard
                cartSummary={cartSummary}
                isSubmitting={isSubmitting || isProcessingPayment}
                onSubmit={(code) => handleSubmit(code || appliedPromo?.code)}
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
