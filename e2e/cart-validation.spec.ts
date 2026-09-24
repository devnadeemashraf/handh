import { expect, test } from '@playwright/test';

import { SEEDED_PRODUCTS, setClientCart } from './test-helpers';

test.describe('Cart Validation & Recovery E2E', () => {
  test('displays empty bag state when customer visits checkout with empty cart', async ({
    page
  }) => {
    // 1. Visit checkout directly with no cart items in storage
    await page.goto('/checkout');

    // 2. Verify Empty Bag screen
    await expect(page.getByRole('heading', { name: 'Your Bag is Empty' })).toBeVisible();
    await expect(
      page.getByText('Add an artisanal piece from our collection to begin checkout.')
    ).toBeVisible();

    // 3. Verify link to catalog exists and works
    const exploreBtn = page.getByRole('link', { name: 'Explore Collection' });
    await expect(exploreBtn).toBeVisible();
    await exploreBtn.click();
    await expect(page).toHaveURL('/');
  });

  test('blocks checkout submission when cart contains unavailable or out-of-stock item', async ({
    page
  }) => {
    // 1. Pre-populate cart with an invalid/non-existent variant ID
    const nonExistentVariantId = '00000000-0000-0000-0000-000000000000';
    await setClientCart(page, [
      {
        variantId: nonExistentVariantId,
        quantity: 1
      }
    ]);

    // 2. Visit checkout
    await page.goto('/checkout');

    // 3. Either the cart items fail reconciliation resulting in empty bag or disabled submit
    const emptyBagHeading = page.getByRole('heading', { name: 'Your Bag is Empty' });
    const submitBtn = page.getByRole('button', { name: /Place Order & Proceed to Pay/i });

    // One of these safeguards must be active
    const isEmpty = await emptyBagHeading.isVisible().catch(() => false);
    if (!isEmpty) {
      // If order review is rendered, submit button must be disabled due to !cartSummary.isValidForCheckout
      await expect(submitBtn).toBeDisabled();
    }
  });

  test('allows recovery by navigating to product and adding a valid item', async ({ page }) => {
    // 1. Visit PDP of a valid seeded product
    await page.goto(`/products/${SEEDED_PRODUCTS.vintageFiligree.slug}`);

    // 2. Add item to bag
    const addToBagBtn = page.getByRole('button', { name: /Add to (Shopping )?Bag/i });
    await addToBagBtn.click();
    await expect(page.getByText(/Added to Bag/i)).toBeVisible();

    // 3. Navigate to checkout
    await page.goto('/checkout');

    // 4. Verify checkout summary now shows item and enables checkout
    await expect(page.getByText(SEEDED_PRODUCTS.vintageFiligree.title)).toBeVisible();
    const submitBtn = page.getByRole('button', { name: /Place Order & Proceed to Pay/i });
    await expect(submitBtn).toBeEnabled();
  });
});
