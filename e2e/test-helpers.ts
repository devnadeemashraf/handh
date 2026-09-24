import type { Page } from '@playwright/test';

/**
 * Known seeded test variant IDs and product slugs from packages/db/src/seed.ts
 */
export const SEEDED_PRODUCTS = {
  vintageFiligree: {
    slug: 'vintage-filigree-nose-piece',
    title: 'Vintage Filigree Nose Piece',
    variantId: '6cb0d4bf-aa6b-43a1-a3df-f39942fc1cbb',
    priceMinor: 59900
  },
  ameeraPearl: {
    slug: 'ameera-freshwater-pearl-stud',
    title: 'Ameera Natural Pearl Nose Stud',
    variantId: '6af5c180-35b2-43d8-bf70-6ff5c88e78dc',
    priceMinor: 79900
  }
};

/**
 * Injects a mock Razorpay SDK into the browser window before any scripts run.
 * When useCheckoutFlow instantiates `new window.Razorpay(options)` and calls `open()`,
 * this mock simulates the customer completing the payment modal and triggers the
 * success handler callback with a mock payment ID and signature.
 */
export async function setupRazorpayMock(page: Page) {
  // 1. Intercept network requests to Razorpay checkout CDN to prevent real script execution
  await page.route('**/checkout.razorpay.com/**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        window.Razorpay = class MockRazorpay {
          constructor(options) {
            this.options = options || {};
          }
          open() {
            setTimeout(() => {
              if (typeof this.options?.handler === 'function') {
                this.options.handler({
                  razorpay_payment_id: 'pay_mock_' + Date.now(),
                  razorpay_order_id: this.options.order_id || 'order_mock_' + Date.now(),
                  razorpay_signature: 'mock_payment_signature'
                });
              }
            }, 100);
          }
          on() {}
        };
      `
    });
  });

  // 2. Also inject via initScript before page scripts load
  await page.addInitScript(() => {
    (window as unknown as { Razorpay: unknown }).Razorpay = class MockRazorpay {
      options: {
        key?: string;
        order_id?: string;
        amount?: number;
        currency?: string;
        handler?: (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => void;
        modal?: {
          ondismiss?: () => void;
        };
      };

      constructor(options: typeof MockRazorpay.prototype.options) {
        this.options = options || {};
      }

      open() {
        setTimeout(() => {
          if (typeof this.options?.handler === 'function') {
            this.options.handler({
              razorpay_payment_id: `pay_mock_${Date.now()}`,
              razorpay_order_id: this.options.order_id || `order_mock_${Date.now()}`,
              razorpay_signature: 'mock_payment_signature'
            });
          }
        }, 100);
      }

      on() {}
    };
  });
}

/**
 * Pre-populates the customer's localStorage cart ('hh_guest_cart').
 */
export async function setClientCart(
  page: Page,
  items: Array<{ variantId: string; quantity: number }>
) {
  await page.addInitScript((cartItems) => {
    try {
      window.localStorage.setItem('hh_guest_cart', JSON.stringify(cartItems));
    } catch {
      // ignore
    }
  }, items);
}

/**
 * Logs in a customer using the development OTP endpoint and sets the session cookie.
 */
export async function loginCustomerViaOtp(page: Page, phone = '+919876543210') {
  // 1. Request OTP
  const requestRes = await page.request.post('/api/auth/otp/request', {
    data: { phone, purpose: 'login' }
  });
  const requestData = await requestRes.json();
  const code = requestData.devCode || '123456';

  // 2. Verify OTP
  const verifyRes = await page.request.post('/api/auth/otp/verify', {
    data: { phone, code, purpose: 'login' }
  });
  const verifyData = await verifyRes.json();

  return verifyData;
}
