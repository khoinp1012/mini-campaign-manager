import { test, expect } from '@playwright/test';

test.describe('Recipients E2E', () => {
  test.beforeEach(async ({ page }) => {
    const uniqueId = `e2e-recipients-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const testUser = {
      name: 'E2E Recipients User',
      email: `${uniqueId}@test.com`,
      password: 'testpassword123',
    };

    // Ensure clean state
    await page.context().clearCookies();
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Cleanup/Signup
    await page.click('button:has-text("Sign up")');
    await page.fill('input[placeholder="John Doe"]', testUser.name);
    await page.fill('input[placeholder="name@company.com"]', testUser.email);
    await page.fill('input[placeholder="••••••••"]', testUser.password);
    await page.click('button:has-text("Create Account")');
    
    await expect(page).toHaveURL('http://127.0.0.1:5173/', { timeout: 15000 });
    await expect(page.locator('text=Campaign Performance')).toBeVisible({ timeout: 10000 });
  });

  test('E2E-Recip-01: Navigate to recipients → table renders', async ({ page }) => {
    await page.goto('/recipients');
    
    // Wait for the table to arrive (Positive State)
    await expect(page.getByTestId('recipients-table')).toBeVisible({ timeout: 15000 });

    // Assert the table is visible
    const table = page.getByTestId('recipients-table');
    await expect(table).toBeVisible({ timeout: 15000 });
    
    // Verify specific text
    await expect(page.locator('h1:has-text("Recipient Roster")')).toBeVisible({ timeout: 10000 });
  });
});