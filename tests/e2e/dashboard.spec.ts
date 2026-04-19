import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    const uniqueId = `e2e-dashboard-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const testUser = {
      name: 'E2E Dashboard User',
      email: `${uniqueId}@test.com`,
      password: 'testpassword123',
    };

    // Ensure clean state per test
    await page.context().clearCookies();
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Register clean user
    await page.click('button:has-text("Sign up")');
    await page.fill('input[placeholder="John Doe"]', testUser.name);
    await page.fill('input[placeholder="name@company.com"]', testUser.email);
    await page.fill('input[placeholder="••••••••"]', testUser.password);
    await page.click('button:has-text("Create Account")');
    
    await expect(page).toHaveURL('http://127.0.0.1:5173/', { timeout: 15000 });
    await expect(page.locator('text=Campaign Performance')).toBeVisible({ timeout: 10000 });
  });

  test('E2E-Dash-01: Dashboard loads → stats cards visible', async ({ page }) => {
    // Assert specific dashboard content
    await expect(page.locator('text=Campaign Performance')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Total Audience Reach')).toBeVisible({ timeout: 10000 });
  });
});