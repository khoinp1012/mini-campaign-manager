import { test, expect } from '@playwright/test';

test.describe('Auth E2E', () => {
  const getUniqueUser = () => ({
    name: 'E2E Test User',
    email: `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
    password: 'testpassword123',
  });

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/login');
    // Ensure page is settled
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('E2E-Auth-01: Register new user → redirect to dashboard', async ({ page }) => {
    const user = getUniqueUser();
    await page.click('button:has-text("Sign up")');

    await page.fill('input[placeholder="John Doe"]', user.name);
    await page.fill('input[placeholder="name@company.com"]', user.email);
    await page.fill('input[placeholder="••••••••"]', user.password);

    await page.click('button:has-text("Create Account")');

    await expect(page).toHaveURL('http://127.0.0.1:5173/', { timeout: 15000 });
    await expect(page.locator('text=Campaign Performance')).toBeVisible({ timeout: 10000 });
  });

  test('E2E-Auth-02: Login with valid credentials → redirect to dashboard', async ({ page }) => {
    // We must register first to login
    const user = getUniqueUser();
    await page.click('button:has-text("Sign up")');
    await page.fill('input[placeholder="John Doe"]', user.name);
    await page.fill('input[placeholder="name@company.com"]', user.email);
    await page.fill('input[placeholder="••••••••"]', user.password);
    await page.click('button:has-text("Create Account")');
    await expect(page).toHaveURL('http://127.0.0.1:5173/', { timeout: 15000 });

    // Now logout and login back
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });

    await page.fill('input[placeholder="name@company.com"]', user.email);
    await page.fill('input[placeholder="••••••••"]', user.password);
    await page.click('button:has-text("Sign In")');

    await expect(page).toHaveURL('http://127.0.0.1:5173/', { timeout: 15000 });
  });

  test('E2E-Auth-03: Login with invalid credentials → error message', async ({ page }) => {
    await page.fill('input[placeholder="name@company.com"]', 'nonexistent@test.com');
    await page.fill('input[placeholder="••••••••"]', 'wrongpassword');

    await page.click('button:has-text("Sign In")');

    await expect(page.getByTestId('auth-error')).toBeVisible({ timeout: 10000 });
  });

  test('E2E-Auth-04: Logout → clear session, redirect to login', async ({ page }) => {
    const user = getUniqueUser();
    await page.click('button:has-text("Sign up")');
    await page.fill('input[placeholder="John Doe"]', user.name);
    await page.fill('input[placeholder="name@company.com"]', user.email);
    await page.fill('input[placeholder="••••••••"]', user.password);
    await page.click('button:has-text("Create Account")');
    await expect(page).toHaveURL('http://127.0.0.1:5173/', { timeout: 15000 });

    await page.click('button:has-text("Logout")');

    await expect(page).toHaveURL(/.*\/login/, { timeout: 15000 });
  });
});
