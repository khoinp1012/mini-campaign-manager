import { test, expect } from '@playwright/test';

test.describe('Health Check Smoke Test', () => {
  test('SMOKE-01: Server is reachable', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
  });

  test('SMOKE-02: API is reachable', async ({ page, request }) => {
    const response = await request.get('http://127.0.0.1:3001/api/health').catch(() => null);
    if (response && response.status() === 200) {
      expect(response.status()).toBe(200);
    } else {
      // No health endpoint — verify server is up via the auth route
      const authResponse = await request.get('http://127.0.0.1:3001/auth/me');
      expect(authResponse.status()).toBe(401); // Should be 401 if unauthenticated but reachable
    }
  });

  test('SMOKE-03: Basic Auth flow (Signup/Dashboard)', async ({ page }) => {
    const uniqueId = `smoke-${Date.now()}`;
    await page.goto('/login');
    await page.click('button:has-text("Sign up")');
    await page.fill('input[placeholder="John Doe"]', 'Smoke User');
    await page.fill('input[placeholder="name@company.com"]', `${uniqueId}@test.com`);
    await page.fill('input[placeholder="••••••••"]', 'password123');
    await page.click('button:has-text("Create Account")');
    
    await expect(page).toHaveURL('http://127.0.0.1:5173/', { timeout: 10000 });
    await expect(page.locator('text=Campaign Performance')).toBeVisible();
  });

  test('SMOKE-04: Navigate to Create Campaign → form is stable', async ({ page }) => {
    const uniqueId = `smoke-camp-${Date.now()}`;
    await page.goto('/login');
    await page.click('button:has-text("Sign up")');
    await page.fill('input[placeholder="John Doe"]', 'Smoke User');
    await page.fill('input[placeholder="name@company.com"]', `${uniqueId}@test.com`);
    await page.fill('input[placeholder="••••••••"]', 'password123');
    await page.click('button:has-text("Create Account")');
    await expect(page).toHaveURL('http://127.0.0.1:5173/');

    await page.goto('/campaigns/new');
    await expect(page.getByTestId('campaign-name-input')).toBeVisible({ timeout: 10000 });
  });
});
