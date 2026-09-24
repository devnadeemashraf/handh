import { expect, test } from '@playwright/test';

import { SEEDED_PRODUCTS, setupRazorpayMock } from './test-helpers';

test.describe('Guest Checkout E2E Money Path', () => {
  test.beforeEach(async ({ page }) => {
    // Inject mock Razorpay gateway before page loads
    await setupRazorpayMock(page);
  });

  test('completes end-to-end guest purchase from PDP through Razorpay to order receipt', async ({
    page
  }) => {
    // 1. Visit Product Detail Page
    await page.goto(`/products/${SEEDED_PRODUCTS.vintageFiligree.slug}`);

    // Verify product information
    await expect(page.locator('h1')).toContainText(SEEDED_PRODUCTS.vintageFiligree.title);
    await expect(page.getByText('Legal Metrology Declarations')).toBeVisible();
    await expect(page.getByText('Country of Origin')).toBeVisible();

    // 2. Add product to bag
    const addToBagBtn = page.getByRole('button', { name: /Add to (Shopping )?Bag/i });
    await expect(addToBagBtn).toBeVisible();
    await addToBagBtn.click();

    // Verify "Added to Bag" confirmation state
    await expect(page.getByText(/Added to Bag/i)).toBeVisible();

    // 3. Navigate to Checkout
    await page.goto('/checkout');
    await expect(page).toHaveURL(/\/checkout/);

    // Verify Checkout Page Header & Summary
    await expect(page.getByText('Shipping Details')).toBeVisible();
    await expect(page.getByText('Order Summary')).toBeVisible();
    await expect(page.getByText(SEEDED_PRODUCTS.vintageFiligree.title)).toBeVisible();

    // Verify Statutory Affirmative Pre-Purchase Contract Formation Notice (E-COM-165)
    const contractNotice = page.getByTestId('contract-formation-notice');
    await expect(contractNotice).toBeVisible();
    await expect(contractNotice).toContainText('Terms of Sale');
    await expect(contractNotice).toContainText('Privacy Policy');
    await expect(contractNotice).toContainText('Refund Policy');

    // 4. Fill in Statutory Indian Shipping Address
    await page.fill('input#fullName', 'Maryam Siddiqui');
    await page.fill('input#phone', '9876543299');
    await page.fill('input#email', 'maryam@example.com');
    await page.fill('input#line1', 'House 42, Jubilee Hills Road No. 36');
    await page.fill('input#postalCode', '500034');
    await page.fill('input#city', 'Hyderabad');
    await page.selectOption('select#state', 'Telangana');

    // 5. Submit Order - Platform requires phone verification / account creation
    const submitBtn = page.getByRole('button', { name: /Place Order & Proceed to Pay/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // 6. Handle Account Creation Modal (Phone OTP)
    await expect(page.getByRole('heading', { name: 'Sign In or Create Account' })).toBeVisible();
    const sendOtpBtn = page.getByRole('button', { name: /Send Verification Code/i });
    await expect(sendOtpBtn).toBeVisible();
    await sendOtpBtn.click();

    // Verify OTP step appears and submit verification
    await expect(page.getByRole('heading', { name: 'Verify Mobile Number' })).toBeVisible();
    const verifyOtpBtn = page.getByRole('button', { name: /Verify & Continue/i });
    await expect(verifyOtpBtn).toBeVisible();
    await verifyOtpBtn.click();

    // 7. Verify Payment & Transition to Order Receipt Screen (E-COM-143)
    await page.waitForURL(/\/checkout\/success\?orderNumber=/, { timeout: 30000 });
    await expect(page).toHaveURL(/\/checkout\/success\?orderNumber=/);

    // Verify Success Screen Details
    await expect(page.getByText(/Payment Confirmed/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Thank You for Your Order/i })).toBeVisible();
    await expect(page.getByText(/Maryam Siddiqui/i)).toBeVisible();
    await expect(page.getByText(/500034/i)).toBeVisible();
  });
});
