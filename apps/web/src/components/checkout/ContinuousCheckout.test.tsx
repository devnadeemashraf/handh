import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import type { AddressFormValues } from '@/components/checkout/AddressForm';

import type { CartSummary } from '@hh/domain';

import { ContinuousCheckout } from './ContinuousCheckout';

const sampleCartSummary: CartSummary = {
  items: [
    {
      variantId: 'var-1',
      productId: 'prod-1',
      productSlug: 'filigree-pin',
      productTitle: 'Vintage Filigree Pin',
      variantTitle: 'Gold',
      sku: 'HH-PIN-01',
      priceMinor: 129900,
      availableQuantity: 5,
      requestedQuantity: 1,
      effectiveQuantity: 1,
      lineTotalMinor: 129900,
      currency: 'INR',
      isAvailable: true,
      primaryImageUrl: '/images/pin.jpg'
    }
  ],
  totalQuantity: 1,
  subtotalMinor: 129900,
  currency: 'INR',
  isValidForCheckout: true
};

const initialValues: AddressFormValues = {
  fullName: 'Aisha Rahman',
  phone: '+919876543210',
  email: 'aisha@example.com',
  line1: '42 Marina Coast Road',
  line2: 'Apartment 4B',
  city: 'Chennai',
  state: 'Tamil Nadu',
  postalCode: '600001',
  country: 'IN',
  customerNotes: ''
};

describe('ContinuousCheckout Component', () => {
  const mockOnFieldChange = vi.fn();
  const mockGoToStep = vi.fn();
  const mockCompleteContactStep = vi.fn();
  const mockCompleteAddressStep = vi.fn();
  const mockCompleteShippingStep = vi.fn();
  const mockCompletePaymentStep = vi.fn();
  const mockOnShippingMethodChange = vi.fn();
  const mockOnPaymentMethodChange = vi.fn();
  const mockOnBillingSameAsShippingChange = vi.fn();
  const mockOnEmailMarketingOptInChange = vi.fn();
  const mockOnWhatsappOptInChange = vi.fn();
  const mockOnSubmit = vi.fn();
  const mockOnOpenAuthModal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderContinuousCheckout = (overrides = {}) => {
    const props = {
      user: null,
      cartSummary: sampleCartSummary,
      values: initialValues,
      errors: {},
      onFieldChange: mockOnFieldChange,
      savedAddresses: [],
      selectedAddressId: null,
      isManualAddress: true,
      onSelectSavedAddress: vi.fn(),
      onSwitchToManualAddress: vi.fn(),
      activeStep: 1,
      completedSteps: [],
      goToStep: mockGoToStep,
      completeContactStep: mockCompleteContactStep,
      completeAddressStep: mockCompleteAddressStep,
      completeShippingStep: mockCompleteShippingStep,
      completePaymentStep: mockCompletePaymentStep,
      shippingMethod: 'standard' as const,
      onShippingMethodChange: mockOnShippingMethodChange,
      paymentMethod: 'razorpay' as const,
      onPaymentMethodChange: mockOnPaymentMethodChange,
      billingSameAsShipping: true,
      onBillingSameAsShippingChange: mockOnBillingSameAsShippingChange,
      emailMarketingOptIn: false,
      onEmailMarketingOptInChange: mockOnEmailMarketingOptInChange,
      whatsappOptIn: true,
      onWhatsappOptInChange: mockOnWhatsappOptInChange,
      isSubmitting: false,
      isProcessingPayment: false,
      submitError: null,
      isServicePaused: false,
      appliedPromo: null,
      onSubmit: mockOnSubmit,
      onOpenAuthModal: mockOnOpenAuthModal,
      ...overrides
    };

    return render(<ContinuousCheckout {...props} />);
  };

  it('renders Step 1 (Contact Information) active with email, phone, and guest sign-in link', () => {
    renderContinuousCheckout({ activeStep: 1 });

    expect(screen.getByRole('heading', { name: /Contact Information/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/aisha@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/10-digit mobile/i)).toBeInTheDocument();

    const signinButton = screen.getByRole('button', { name: /Already have an account\? Sign in/i });
    expect(signinButton).toBeInTheDocument();
    fireEvent.click(signinButton);
    expect(mockOnOpenAuthModal).toHaveBeenCalledTimes(1);

    const continueBtn = screen.getByRole('button', { name: /Continue to Delivery Address/i });
    fireEvent.click(continueBtn);
    expect(mockCompleteContactStep).toHaveBeenCalledTimes(1);
  });

  it('renders collapsed Step 1 summary with Edit button when completed', () => {
    renderContinuousCheckout({
      activeStep: 2,
      completedSteps: [1]
    });

    expect(screen.getByText('aisha@example.com · +919876543210')).toBeInTheDocument();
    const editBtn = screen.getByRole('button', { name: /Edit/i });
    expect(editBtn).toBeInTheDocument();

    fireEvent.click(editBtn);
    expect(mockGoToStep).toHaveBeenCalledWith(1);
  });

  it('renders Step 2 (Delivery Address) active with shipping form inputs', () => {
    renderContinuousCheckout({
      activeStep: 2,
      completedSteps: [1]
    });

    expect(screen.getByRole('heading', { name: /Delivery Address/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toHaveValue('Aisha Rahman');

    const continueBtn = screen.getByRole('button', { name: /Continue to Shipping Method/i });
    fireEvent.click(continueBtn);
    expect(mockCompleteAddressStep).toHaveBeenCalledTimes(1);
  });

  it('renders Step 3 (Shipping Method) with radio options for standard and express', () => {
    renderContinuousCheckout({
      activeStep: 3,
      completedSteps: [1, 2]
    });

    expect(screen.getByRole('heading', { name: /Shipping Method/i })).toBeInTheDocument();
    expect(screen.getByText(/Standard Courier Delivery/i)).toBeInTheDocument();
    expect(screen.getByText(/Express Air Dispatch/i)).toBeInTheDocument();

    const expressRadio = screen.getByRole('radio', { name: /Express Air Dispatch/i });
    fireEvent.click(expressRadio);
    expect(mockOnShippingMethodChange).toHaveBeenCalledWith('express');

    const continueBtn = screen.getByRole('button', { name: /Continue to Payment Selection/i });
    fireEvent.click(continueBtn);
    expect(mockCompleteShippingStep).toHaveBeenCalledTimes(1);
  });

  it('renders Step 4 (Payment Selection) with Razorpay, COD, and billing address checkbox', () => {
    renderContinuousCheckout({
      activeStep: 4,
      completedSteps: [1, 2, 3]
    });

    expect(screen.getByRole('heading', { name: /Payment Selection/i })).toBeInTheDocument();
    expect(screen.getByText(/Razorpay Secure Gateway/i)).toBeInTheDocument();
    expect(screen.getByText(/Cash on Delivery/i)).toBeInTheDocument();

    const codRadio = screen.getByRole('radio', { name: /Cash on Delivery/i });
    fireEvent.click(codRadio);
    expect(mockOnPaymentMethodChange).toHaveBeenCalledWith('cod');

    const billingCheckbox = screen.getByRole('checkbox', {
      name: /Billing address is same as delivery address/i
    });
    expect(billingCheckbox).toBeChecked();

    const continueBtn = screen.getByRole('button', { name: /Continue to Review & Place Order/i });
    fireEvent.click(continueBtn);
    expect(mockCompletePaymentStep).toHaveBeenCalledTimes(1);
  });

  it('renders Step 5 (Review & Place Order) with item thumbnail, GST breakdown, WhatsApp opt-in, and Place Order button', () => {
    renderContinuousCheckout({
      activeStep: 5,
      completedSteps: [1, 2, 3, 4]
    });

    expect(screen.getByRole('heading', { name: /Review & Place Order/i })).toBeInTheDocument();
    expect(screen.getByTestId('gst-breakdown')).toBeInTheDocument();
    expect(screen.getByTestId('whatsapp-opt-in-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('contract-formation-notice')).toBeInTheDocument();

    const placeOrderBtn = screen.getByRole('button', { name: /Place Order & Pay/i });
    expect(placeOrderBtn).toBeInTheDocument();

    fireEvent.click(placeOrderBtn);
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  it('displays non-dismissible Alert on payment failure and keeps entered data intact', () => {
    renderContinuousCheckout({
      activeStep: 4,
      completedSteps: [1, 2, 3],
      submitError: 'Payment authorization declined by issuing bank.'
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Payment authorization declined by issuing bank.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Continue to Review & Place Order/i })
    ).toBeInTheDocument();
  });
});
