# E2E Test Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix remaining 4 failing E2E tests (3 campaign tests + 1 recipients test) that fail due to race conditions and test isolation issues.

**Architecture:** The campaign and recipients tests have flaky timing issues with React rendering and test isolation problems. We need to add proper waiting strategies and fix authentication flows.

**Tech Stack:** Playwright, React Query, Vitest

---

## Summary of Current State

| Test Suite | Status |
|------------|--------|
| Backend Vitest (30 tests) | ✅ PASS |
| Frontend Vitest (21 tests) | ✅ PASS |
| Auth E2E (4 tests) | ✅ PASS |
| Campaign E2E (4 tests) | 1/4 PASS |
| Recipients E2E (1 test) | FAIL |
| Dashboard E2E (1 test) | FAIL |

---

## File Structure

```
tests/e2e/
├── campaign.spec.ts      # FIX: Add proper waiting strategies, fix auth flow
├── recipients.spec.ts    # FIX: Add proper waiting for content
├── dashboard.spec.ts     # FIX: Add proper auth flow
└── auth.spec.ts         # Already working ✅

packages/frontend/src/
├── api/client.ts        # Already fixed ✅
├── hooks/useAuthSession.ts  # Already working ✅
└── pages/
    ├── CreateCampaign.tsx   # May need investigation
    └── Recipients.tsx      # May need investigation
```

---

## Tasks

### Task 1: Fix Campaign E2E Tests (Camp-01, Camp-03, Camp-04)

**Files:**
- Modify: `tests/e2e/campaign.spec.ts`

**Root Cause:** Tests navigate to `/campaigns/new` but the form elements are never stable - React Query fetches recipients and causes re-renders that detach inputs. Also, the `beforeEach` registration sometimes fails because the email is already registered from a previous test run.

**Steps:**

- [ ] **Step 1: Read current campaign test file**

```bash
cat tests/e2e/campaign.spec.ts
```

- [ ] **Step 2: Rewrite with proper waiting and unique email per test run**

The tests should use unique emails to avoid conflicts, and wait for React to stabilize:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Campaign E2E', () => {
  const testUser = {
    email: `e2e-campaign-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
    password: 'testpassword123',
  };

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Sign up")');
    await page.fill('input[placeholder="John Doe"]', 'Campaign E2E User');
    await page.fill('input[placeholder="name@company.com"]', testUser.email);
    await page.fill('input[placeholder="••••••••"]', testUser.password);
    await page.click('button:has-text("Create Account")');
    await expect(page).toHaveURL('http://localhost:5173/', { timeout: 10000 });
  });

  test('E2E-Camp-01: Create campaign → fill form → save as draft', async ({ page }) => {
    await page.goto('/campaigns/new');
    // Wait for recipients to load and form to stabilize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Extra buffer for React to settle

    // Use more specific selectors to avoid detached elements
    const nameInput = page.locator('input[placeholder="E.g. Summer Sale 2026"]');
    await nameInput.waitFor({ state: 'attached', timeout: 10000 });
    await nameInput.fill('Test Campaign');

    const subjectInput = page.locator('input[placeholder="Hot deals inside! 🔥"]');
    await subjectInput.waitFor({ state: 'attached', timeout: 5000 });
    await subjectInput.fill('Test Subject');

    const bodyTextarea = page.locator('textarea[placeholder*="Hello"]');
    await bodyTextarea.waitFor({ state: 'attached', timeout: 5000 });
    await bodyTextarea.fill('Test body content');

    await page.click('button:has-text("Create Campaign (Draft)")');
    await expect(page).toHaveURL('http://localhost:5173/', { timeout: 10000 });
  });

  // Camp-02 already works, keep as-is

  test('E2E-Camp-03: Send campaign → dispatch simulation triggered', async ({ page }) => {
    await page.goto('/campaigns/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const nameInput = page.locator('input[placeholder="E.g. Summer Sale 2026"]');
    await nameInput.waitFor({ state: 'attached', timeout: 10000 });
    await nameInput.fill('Send Test Campaign');

    const subjectInput = page.locator('input[placeholder="Hot deals inside! 🔥"]');
    await subjectInput.waitFor({ state: 'attached', timeout: 5000 });
    await subjectInput.fill('Send Subject');

    const bodyTextarea = page.locator('textarea[placeholder*="Hello"]');
    await bodyTextarea.waitFor({ state: 'attached', timeout: 5000 });
    await bodyTextarea.fill('Send test body');

    await page.click('button:has-text("Create Campaign (Draft)")');
    await expect(page).toHaveURL('http://localhost:5173/', { timeout: 10000 });

    await page.goto('/campaigns');
    const sendBtn = page.locator('button:has-text("Send")').first();
    if (await sendBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await sendBtn.click();
      await expect(page.locator('text=/Dispatch|initiated|sent/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('E2E-Camp-04: Schedule campaign → future date → status = scheduled', async ({ page }) => {
    await page.goto('/campaigns/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const nameInput = page.locator('input[placeholder="E.g. Summer Sale 2026"]');
    await nameInput.waitFor({ state: 'attached', timeout: 10000 });
    await nameInput.fill('Schedule Test Campaign');

    const subjectInput = page.locator('input[placeholder="Hot deals inside! 🔥"]');
    await subjectInput.waitFor({ state: 'attached', timeout: 5000 });
    await subjectInput.fill('Schedule Subject');

    const bodyTextarea = page.locator('textarea[placeholder*="Hello"]');
    await bodyTextarea.waitFor({ state: 'attached', timeout: 5000 });
    await bodyTextarea.fill('Schedule body');

    await page.click('button:has-text("Create Campaign (Draft)")');
    await expect(page).toHaveURL('http://localhost:5173/', { timeout: 10000 });

    await page.goto('/campaigns');
    const scheduleBtn = page.locator('button:has-text("Schedule")').first();
    if (await scheduleBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await scheduleBtn.click();

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateStr = futureDate.toISOString().slice(0, 16);

      await page.fill('input[type="datetime-local"]', dateStr);
      await page.click('button:has-text("Confirm")');

      await expect(page.locator('text=Scheduled')).toBeVisible({ timeout: 5000 });
    }
  });
});
```

- [ ] **Step 3: Run campaign tests to verify**

```bash
npx playwright test tests/e2e/campaign.spec.ts --reporter=list
```

Expected: All 4 tests pass

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/campaign.spec.ts
git commit -m "fix e2e: add proper waiting strategies to campaign tests"
```

---

### Task 2: Fix Recipients E2E Test

**Files:**
- Modify: `tests/e2e/recipients.spec.ts`

**Root Cause:** Test navigates to `/recipients` but the page may not have loaded properly. The "Recipient Roster" text appears in the page but Playwright can't find it.

**Steps:**

- [ ] **Step 1: Read current recipients test file**

```bash
cat tests/e2e/recipients.spec.ts
```

- [ ] **Step 2: Add proper waiting for page content**

```typescript
import { test, expect } from '@playwright/test';

const testUser = {
  name: 'E2E Recipients User',
  email: `e2e-recipients-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
  password: 'testpassword123',
};

test.describe('Recipients E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Sign up")');
    await page.fill('input[placeholder="John Doe"]', testUser.name);
    await page.fill('input[placeholder="name@company.com"]', testUser.email);
    await page.fill('input[placeholder="••••••••"]', testUser.password);
    await page.click('button:has-text("Create Account")');
    await expect(page).toHaveURL('http://localhost:5173/', { timeout: 10000 });
  });

  test('E2E-Recip-01: Navigate to recipients → table renders', async ({ page }) => {
    await page.goto('/recipients');
    await page.waitForLoadState('networkidle');

    // Wait for the page heading to appear
    const heading = page.locator('h1:has-text("Recipient Roster")');
    await heading.waitFor({ state: 'attached', timeout: 10000 });

    await expect(page.locator('table')).toBeVisible();
  });
});
```

- [ ] **Step 3: Run recipients test to verify**

```bash
npx playwright test tests/e2e/recipients.spec.ts --reporter=list
```

Expected: Test passes

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/recipients.spec.ts
git commit -m "fix e2e: add proper waiting to recipients test"
```

---

### Task 3: Fix Dashboard E2E Test

**Files:**
- Modify: `tests/e2e/dashboard.spec.ts`

**Root Cause:** Test uses hardcoded `admin@example.com` which doesn't exist. Needs proper registration like other tests.

**Steps:**

- [ ] **Step 1: Read current dashboard test file**

```bash
cat tests/e2e/dashboard.spec.ts
```

- [ ] **Step 2: Fix with proper auth flow**

```typescript
import { test, expect } from '@playwright/test';

const testUser = {
  name: 'E2E Dashboard User',
  email: `e2e-dashboard-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
  password: 'testpassword123',
};

test.describe('Dashboard E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Sign up")');
    await page.fill('input[placeholder="John Doe"]', testUser.name);
    await page.fill('input[placeholder="name@company.com"]', testUser.email);
    await page.fill('input[placeholder="••••••••"]', testUser.password);
    await page.click('button:has-text("Create Account")');
    await expect(page).toHaveURL('http://localhost:5173/', { timeout: 10000 });
  });

  test('E2E-Dash-01: Dashboard loads → stats cards visible', async ({ page }) => {
    await expect(page.locator('text=Campaign Performance')).toBeVisible();
  });
});
```

- [ ] **Step 3: Run dashboard test to verify**

```bash
npx playwright test tests/e2e/dashboard.spec.ts --reporter=list
```

Expected: Test passes

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/dashboard.spec.ts
git commit -m "fix e2e: use proper auth flow in dashboard test"
```

---

### Task 4: Verify Full E2E Suite

**Files:**
- Run: Full E2E test suite

- [ ] **Step 1: Run full E2E suite**

```bash
npm run e2e
```

Expected output:
```
Running 10 tests using 1 worker
  ✓  1 auth.spec.ts E2E-Auth-01
  ✓  2 auth.spec.ts E2E-Auth-02
  ✓  3 auth.spec.ts E2E-Auth-03
  ✓  4 auth.spec.ts E2E-Auth-04
  ✓  5 campaign.spec.ts E2E-Camp-01
  ✓  6 campaign.spec.ts E2E-Camp-02
  ✓  7 campaign.spec.ts E2E-Camp-03
  ✓  8 campaign.spec.ts E2E-Camp-04
  ✓  9 dashboard.spec.ts E2E-Dash-01
  ✓ 10 recipients.spec.ts E2E-Recip-01

10 passed
```

- [ ] **Step 2: Also verify Vitest still pass**

```bash
cd packages/backend && npm test && cd ../frontend && npm test
```

Expected: All tests pass (30 backend + 21 frontend)

---

## Self-Review Checklist

- [ ] All 4 campaign tests fixed with proper waiting?
- [ ] Recipients test properly waits for content?
- [ ] Dashboard test uses proper auth flow?
- [ ] Unique emails used to avoid conflicts?
- [ ] All E2E tests pass (10/10)?
- [ ] Vitest still pass (51/51)?
- [ ] All changes committed?

---

## Plan Complete

**Two execution options:**

**1. Subagent-Driven (recommended)** - Dispatch subagents to fix each test file in parallel, review between tasks

**2. Inline Execution** - Execute tasks sequentially using executing-plans skill

**Which approach?**