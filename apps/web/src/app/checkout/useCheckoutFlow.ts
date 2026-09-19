import { useRouter } from 'next/navigation';
import * as React from 'react';

import type { AddressFormValues } from '@/components/checkout/AddressForm';

import { generateUUID, ShippingAddressSchema } from '@hh/domain';

import type {
  CartSummary,
  CheckoutOrderResult,
  ServiceControlConfig,
  User,
  UserAddress
} from '@hh/domain';

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

export function useCheckoutFlow({
  user,
  cartSummary,
  clearCart,
  refreshCart,
  openAuthModal
}: {
  user: User | null;
  cartSummary: CartSummary | null;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
  openAuthModal: (options: {
    reason: string;
    initialPhone?: string;
    onSuccess?: () => void;
  }) => void;
}) {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [orderPlaced, setOrderPlaced] = React.useState<CheckoutOrderResult | null>(null);
  const [reservationRemainingSecs, setReservationRemainingSecs] = React.useState<number>(15 * 60);
  const [serviceControl, setServiceControl] = React.useState<ServiceControlConfig | null>(null);

  // Saved addresses state for authenticated users
  const [savedAddresses, setSavedAddresses] = React.useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = React.useState<string | null>(null);
  const [isManualAddress, setIsManualAddress] = React.useState(false);

  // Client-side idempotency key generation (persists per session until success)
  const [idempotencyKey, setIdempotencyKey] = React.useState<string>('');

  React.useEffect(() => {
    if (!idempotencyKey && typeof window !== 'undefined') {
      setIdempotencyKey(generateUUID());
    }
  }, [idempotencyKey]);

  // Form values state
  const [values, setValues] = React.useState<AddressFormValues>({
    fullName: '',
    phone: '',
    email: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IN',
    customerNotes: ''
  });

  const [errors, setErrors] = React.useState<Partial<Record<keyof AddressFormValues, string>>>({});

  // Check live store operating status
  React.useEffect(() => {
    let isMounted = true;
    fetch('/api/service-status')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.serviceControl) {
          setServiceControl(data.serviceControl);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch and auto-select saved address when authenticated
  React.useEffect(() => {
    if (!user) {
      setSavedAddresses([]);
      setSelectedAddressId(null);
      return;
    }

    let isMounted = true;
    fetch('/api/user/addresses')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.addresses) && data.addresses.length > 0) {
          setSavedAddresses(data.addresses);
          const defaultAddr =
            data.addresses.find((a: UserAddress) => a.isDefault) || data.addresses[0];
          if (defaultAddr && !isManualAddress) {
            setSelectedAddressId(defaultAddr.id);
            setValues((prev) => ({
              ...prev,
              fullName: defaultAddr.recipientName,
              phone: defaultAddr.phone,
              line1: defaultAddr.line1,
              line2: defaultAddr.line2 || '',
              city: defaultAddr.city,
              state: defaultAddr.state,
              postalCode: defaultAddr.postalCode,
              country: 'IN',
              email: prev.email || user.email || ''
            }));
          }
        } else {
          // Pre-fill profile info if available
          setValues((prev) => ({
            ...prev,
            fullName: prev.fullName || user.name || '',
            phone: prev.phone || user.phone || '',
            email: prev.email || user.email || ''
          }));
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user, isManualAddress]);

  // Countdown timer for 15-minute reservation once order is created
  React.useEffect(() => {
    if (!orderPlaced) return;

    const expiryTime = new Date(orderPlaced.expiresAt).getTime();
    const updateCountdown = () => {
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((expiryTime - now) / 1000));
      setReservationRemainingSecs(diffSecs);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [orderPlaced]);

  const handleSelectSavedAddress = (addr: UserAddress) => {
    setSelectedAddressId(addr.id);
    setIsManualAddress(false);
    setValues((prev) => ({
      ...prev,
      fullName: addr.recipientName,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 || '',
      city: addr.city,
      state: addr.state,
      postalCode: addr.postalCode,
      country: 'IN'
    }));
    setErrors({});
  };

  const handleSwitchToManualAddress = () => {
    setIsManualAddress(true);
    setSelectedAddressId(null);
    setValues((prev) => ({
      ...prev,
      fullName: user?.name || '',
      phone: user?.phone || '',
      email: prev.email || user?.email || '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'IN'
    }));
  };

  const handleFieldChange = (field: keyof AddressFormValues, val: string) => {
    setValues((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const isServicePaused =
    serviceControl !== null &&
    (!serviceControl.checkoutEnabled ||
      !serviceControl.paymentsEnabled ||
      serviceControl.operatingStatus === 'maintenance');

  // Verify payment on server
  const verifyPayment = async (params: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    orderNumber: string;
  }) => {
    setIsProcessingPayment(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/checkout/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: params.orderId,
          razorpayOrderId: params.razorpayOrderId,
          razorpayPaymentId: params.razorpayPaymentId,
          razorpaySignature: params.razorpaySignature
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitError(data.error || 'Payment confirmation failed. Please contact support.');
        setIsProcessingPayment(false);
        return;
      }

      // Route directly to the receipt page
      router.push(`/checkout/success?orderNumber=${params.orderNumber}`);
    } catch (err) {
      console.error('Payment verification error:', err);
      setSubmitError('A network error occurred while confirming payment.');
      setIsProcessingPayment(false);
    }
  };

  // Launch Razorpay gateway modal
  const launchPaymentGateway = async (createdOrder: CheckoutOrderResult) => {
    if (serviceControl && !serviceControl.paymentsEnabled) {
      setSubmitError(
        serviceControl.maintenanceNotice ||
          'Payment processing is temporarily paused for system maintenance. Your order reservation is safe—please check back shortly.'
      );
      return;
    }

    setIsProcessingPayment(true);
    setSubmitError(null);

    try {
      const initRes = await fetch('/api/checkout/payment-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: createdOrder.orderId })
      });

      const initData = await initRes.json();
      if (!initRes.ok || !initData.success) {
        setSubmitError(initData.error || 'Failed to initialize payment gateway.');
        setIsProcessingPayment(false);
        return;
      }

      // Check if Razorpay Checkout SDK is available
      if (typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: initData.keyId,
          amount: initData.amountMinor,
          currency: initData.currency,
          name: 'H&H',
          description: `Order ${initData.orderNumber}`,
          order_id: initData.razorpayOrderId,
          prefill: {
            name: values.fullName,
            email: values.email,
            contact: values.phone
          },
          theme: {
            color: '#0A2E24'
          },
          handler: async function (response: RazorpayResponse) {
            await verifyPayment({
              orderId: createdOrder.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderNumber: createdOrder.orderNumber
            });
          },
          modal: {
            ondismiss: function () {
              setIsProcessingPayment(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback for offline/mock development mode
        await verifyPayment({
          orderId: createdOrder.orderId,
          razorpayOrderId: initData.razorpayOrderId,
          razorpayPaymentId: `mock_pay_${Date.now()}`,
          razorpaySignature: 'mock_payment_signature',
          orderNumber: createdOrder.orderNumber
        });
      }
    } catch (err) {
      console.error('Payment launch error:', err);
      setSubmitError('Unable to launch payment gateway. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  const handleSubmit = async (appliedCouponCode?: string) => {
    setSubmitError(null);

    if (isServicePaused) {
      setSubmitError(
        serviceControl?.maintenanceNotice ||
          'Checkout and payment processing is temporarily undergoing maintenance. Please keep items in your bag and check back shortly!'
      );
      return;
    }

    // 1. Validate Shipping Address
    const addressValidation = ShippingAddressSchema.safeParse({
      fullName: values.fullName,
      phone: values.phone,
      email: values.email,
      line1: values.line1,
      line2: values.line2 || undefined,
      city: values.city,
      state: values.state,
      postalCode: values.postalCode,
      country: 'IN'
    });

    if (!addressValidation.success) {
      const fieldErrors: Partial<Record<keyof AddressFormValues, string>> = {};
      for (const issue of addressValidation.error.issues) {
        const fieldName = issue.path[0] as keyof AddressFormValues;
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = issue.message;
        }
      }
      setErrors(fieldErrors);
      setSubmitError('Please complete all required shipping fields marked below.');
      return;
    }

    if (!cartSummary || cartSummary.items.length === 0) {
      setSubmitError('Your cart is empty. Please add items before checking out.');
      return;
    }

    if (!cartSummary.isValidForCheckout) {
      setSubmitError('Some items in your cart are no longer available in the requested quantity.');
      return;
    }

    // 2. Account Required to Place Order (User Platform Rule)
    if (!user) {
      openAuthModal({
        reason: 'An account is required to place and track your handcrafted order.',
        initialPhone: values.phone,
        onSuccess: () => {
          handleSubmit(appliedCouponCode);
        }
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        items: cartSummary.items.map((i) => ({
          variantId: i.variantId,
          quantity: i.effectiveQuantity
        })),
        shippingAddress: addressValidation.data,
        customerNotes: values.customerNotes ? values.customerNotes.trim() : undefined,
        couponCode: appliedCouponCode || undefined,
        idempotencyKey: idempotencyKey || generateUUID()
      };

      const res = await fetch('/api/checkout/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 401) {
          openAuthModal({
            reason: 'Please verify your mobile number to complete your order reservation.',
            initialPhone: values.phone,
            onSuccess: () => {
              handleSubmit(appliedCouponCode);
            }
          });
          setIsSubmitting(false);
          return;
        }

        if (res.status === 409) {
          setSubmitError(
            data.error || 'Inventory was reserved by another shopper. Refreshing cart...'
          );
          await refreshCart();
        } else {
          setSubmitError(
            data.error || 'An unexpected error occurred while placing your order. Please try again.'
          );
        }
        setIsSubmitting(false);
        return;
      }

      // Order created & stock locked!
      const createdOrder = data.order as CheckoutOrderResult;
      setOrderPlaced(createdOrder);
      clearCart();
      setIsSubmitting(false);

      // Immediately launch payment gateway
      await launchPaymentGateway(createdOrder);
    } catch (err) {
      console.error('Checkout submission network error:', err);
      setSubmitError('A network error occurred. Please verify your connection and try again.');
      setIsSubmitting(false);
    }
  };

  return {
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
    serviceControl,
    isServicePaused,
    handleSubmit,
    launchPaymentGateway
  };
}
