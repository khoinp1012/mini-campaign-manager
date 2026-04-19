import { test, expect } from '@playwright/test';

test.describe('Campaign E2E', () => {
  const getUniqueId = () => `camp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  test.beforeEach(async ({ page }) => {
    const uniqueId = getUniqueId();
    const user = {
      name: 'E2E Test User',
      email: `user-${uniqueId}@test.com`,
      password: 'testpassword123',
    };

    await page.context().clearCookies();
    await page.goto('/login');
    await page.click('button:has-text("Sign up")');
    await page.fill('input[placeholder="John Doe"]', user.name);
    await page.fill('input[placeholder="name@company.com"]', user.email);
    await page.fill('input[placeholder="••••••••"]', user.password);
    await page.click('button:has-text("Create Account")');

    await expect(page).toHaveURL('http://127.0.0.1:5173/', { timeout: 15000 });
    await expect(page.locator('text=Campaign Performance')).toBeVisible({ timeout: 15000 });
  });

  /** Helper: open form, create+select a recipient inline, fill campaign fields */
  async function openFormWithRecipient(page: any, campaignId: string) {
    await page.goto('/campaigns/new');
    await page.waitForURL('**/campaigns/new', { timeout: 15000 });
    await expect(page.getByTestId('campaign-name-input')).toBeVisible({ timeout: 15000 });

    // Fill campaign fields
    await page.getByTestId('campaign-name-input').fill(`Campaign ${campaignId}`);
    await page.getByTestId('campaign-subject-input').fill(`Subject ${campaignId}`);
    await page.getByTestId('campaign-body-textarea').fill(`Body ${campaignId}`);

    // Add a recipient inline (fresh user has none)
    await page.getByTestId('add-recipient-toggle').click();
    await page.getByTestId('new-recipient-name').fill('E2E Recipient');
    await page.getByTestId('new-recipient-email').fill(`recip-${campaignId}@test.com`);
    await page.getByTestId('add-recipient-submit').click();

    // Wait for the inline form to close (recipient was added + auto-selected)
    await expect(page.getByTestId('new-recipient-name')).not.toBeVisible({ timeout: 10000 });
  }

  test('E2E-Camp-01: Create campaign → fill form → save as draft', async ({ page }) => {
    const campaignId = getUniqueId();
    await openFormWithRecipient(page, campaignId);

    await page.getByTestId('create-campaign-button').click();

    await expect(page).toHaveURL('http://127.0.0.1:5173/', { timeout: 15000 });
    const campaignRow = page.locator('tr').filter({ hasText: campaignId });
    await expect(campaignRow).toBeVisible({ timeout: 10000 });
  });

  test('E2E-Camp-02: Delete draft campaign → removed from list', async ({ page }) => {
    const campaignId = getUniqueId();
    await openFormWithRecipient(page, campaignId);

    await page.getByTestId('create-campaign-button').click();
    await expect(page).toHaveURL('http://127.0.0.1:5173/', { timeout: 15000 });

    const row = page.locator('tr').filter({ hasText: campaignId });
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.locator('button').filter({ hasText: 'delete' }).click();

    await expect(page.locator(`text=Campaign ${campaignId}`)).not.toBeVisible({ timeout: 15000 });
  });

  test('E2E-Camp-03: Schedule campaign → update state', async ({ page }) => {
    const campaignId = getUniqueId();
    await openFormWithRecipient(page, campaignId);

    await page.getByTestId('create-campaign-button').click();
    await expect(page).toHaveURL('http://127.0.0.1:5173/', { timeout: 15000 });

    const row = page.locator('tr').filter({ hasText: campaignId });
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.locator('button').filter({ hasText: 'calendar_month' }).click();

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().slice(0, 16);

    const dateInput = page.locator('input[type="datetime-local"]');
    await dateInput.fill(dateStr);
    await page.getByTestId('schedule-submit-btn').click();

    // Wait for modal to close (mutation resolved + re-fetch done)
    await expect(page.getByTestId('schedule-submit-btn')).not.toBeVisible({ timeout: 10000 });

    // Re-locate the row after refetch
    const updatedRow = page.locator('tr').filter({ hasText: campaignId });
    await expect(updatedRow.locator('text=scheduled')).toBeVisible({ timeout: 15000 });
  });
});