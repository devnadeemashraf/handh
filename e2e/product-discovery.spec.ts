import { expect, test } from '@playwright/test';

import { SEEDED_PRODUCTS } from './test-helpers';

test.describe('Storefront Product Discovery & Legal Metrology Compliance', () => {
  test('renders homepage with statutory footer disclosures and legal links', async ({ page }) => {
    // 1. Visit Homepage
    await page.goto('/');

    // 2. Verify Statutory Footer Disclosures (E-COM-161, E-COM-162)
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Verify statutory corporate coordinates
    await expect(footer.getByText(/CIN:/i)).toBeVisible();
    await expect(footer.getByText(/GSTIN:/i)).toBeVisible();

    // Verify Grievance Officer Coordinates
    await expect(footer.getByText(/Grievance Officer/i)).toBeVisible();

    // Verify statutory legal policy links
    await expect(footer.getByRole('link', { name: 'Terms of Sale' })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Privacy Policy' })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Refund & Return Policy/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: 'Shipping Policy' })).toBeVisible();
  });

  test('verifies Legal Metrology specifications and adds item to cart drawer', async ({ page }) => {
    // 1. Navigate to Product Detail Page (PDP)
    await page.goto(`/products/${SEEDED_PRODUCTS.vintageFiligree.slug}`);

    // 2. Verify Legal Metrology Specifications (E-COM-163)
    await expect(page.getByText('Legal Metrology Declarations')).toBeVisible();
    await expect(page.getByText('Country of Origin')).toBeVisible();
    await expect(page.getByText('India', { exact: true })).toBeVisible();
    await expect(page.getByText('Net Quantity')).toBeVisible();
    await expect(page.getByText('Manufactured & Marketed By')).toBeVisible();
    await expect(page.getByText(/MRP \(Inclusive of all taxes\)/i)).toBeVisible();

    // 3. Add to Bag
    const addToBagBtn = page.getByRole('button', { name: /Add to (Shopping )?Bag/i });
    await expect(addToBagBtn).toBeVisible();
    await addToBagBtn.click();

    // 4. Verify Cart Drawer triggers or item is in bag
    await expect(page.getByText(/Added to Bag/i)).toBeVisible();
  });
});
