import { expect, test } from '@playwright/test';

import { SEEDED_PRODUCTS, setClientCart } from './test-helpers';

test.describe('Promo Code Application & Discount Deduction E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Set customer cart with seeded product
    await setClientCart(page, [
      {
        variantId: SEEDED_PRODUCTS.vintageFiligree.variantId,
        quantity: 1
      }
    ]);
  });

  test('validates promo code input, applies percentage discount, and supports removal', async ({
    page
  }) => {
    // 1. Visit checkout page
    await page.goto('/checkout');
    await expect(page).toHaveURL(/\/checkout/);

    // Verify initial subtotal
    await expect(page.getByText('Order Summary')).toBeVisible();
    await expect(page.getByText('Subtotal')).toBeVisible();

    // 2. Test Invalid Promo Code
    const couponInput = page.getByRole('textbox', { name: /Promotional Code/i });
    const applyBtn = page.getByRole('button', { name: /Apply/i });

    await couponInput.fill('INVALID99');
    await applyBtn.click();

    // Verify error notification
    await expect(
      page.getByText(/Invalid or (unrecognized|expired) promotional code/i)
    ).toBeVisible();

    // 3. Test Valid Promo Code (WELCOME10 - 10% off)
    await couponInput.fill('WELCOME10');
    await applyBtn.click();

    // Verify applied state
    await expect(page.getByText('WELCOME10 applied')).toBeVisible();
    await expect(page.getByText(/Coupon Discount \(WELCOME10\)/i)).toBeVisible();

    // 4. Test Coupon Removal
    const removeBtn = page.getByRole('button', { name: /Remove promo code/i });
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();

    // Verify coupon is removed and input is restored
    await expect(page.getByText('WELCOME10 applied')).not.toBeVisible();
    await expect(page.getByRole('textbox', { name: /Promotional Code/i })).toBeVisible();
  });
});
