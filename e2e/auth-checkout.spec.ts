import { expect, test } from '@playwright/test';

import {
  loginCustomerViaOtp,
  SEEDED_PRODUCTS,
  setClientCart,
  setupRazorpayMock
} from './test-helpers';

test.describe('Authenticated Checkout E2E Money Path', () => {
  test.beforeEach(async ({ page }) => {
    await setupRazorpayMock(page);
  });

  test('completes authenticated purchase using customer saved shipping address', async ({
    page
  }) => {
    // 1. Authenticate seeded customer (+919876543210 / Fatima Al-Zahra)
    const authResult = await loginCustomerViaOtp(page, '+919876543210');
    expect(authResult.success).toBe(true);

    // 2. Pre-populate cart with valid seeded variant
    await setClientCart(page, [
      {
        variantId: SEEDED_PRODUCTS.vintageFiligree.variantId,
        quantity: 1
      }
    ]);

    // 3. Navigate to Checkout Page
    await page.goto('/checkout');
    await expect(page).toHaveURL(/\/checkout/);

    // 4. Verify Authenticated Customer Recognized & Saved Address Displayed
    // The guest sign-in banner should NOT appear
    await expect(page.getByText('Have an account or need to create one?')).not.toBeVisible();

    // Verify Saved Address Card is selected
    await expect(page.getByRole('heading', { name: 'Delivering To Saved Address' })).toBeVisible();
    await expect(page.getByText('Royal Palms Apartments')).toBeVisible();

    // 5. Submit Order & Trigger Payment
    const submitBtn = page.getByRole('button', { name: /Place Order & Proceed to Pay/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 6. Verify Payment & Transition to Order Receipt Screen
    await page.waitForURL(/\/checkout\/success\?orderNumber=/, { timeout: 30000 });
    await expect(page).toHaveURL(/\/checkout\/success\?orderNumber=/);

    // Verify Success Screen Details
    await expect(page.getByText(/Payment Confirmed/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Thank You for Your Order/i })).toBeVisible();
    await expect(page.getByText(/Fatima Al-Zahra/i)).toBeVisible();
  });
});
