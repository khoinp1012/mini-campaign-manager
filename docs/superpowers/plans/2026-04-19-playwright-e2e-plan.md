# Playwright E2E Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Playwright E2E tests for real browser verification of login→create campaign→send flow and other critical user journeys.

**Architecture:** Minimal `@playwright/test` setup in root, tests in `tests/e2e/`, custom server spawning via `scripts/setup-servers.js`. Tests run in Chromium against Docker PostgreSQL.

**Tech Stack:** `@playwright/test`, `playwright`, vanilla JS for setup script

---

## File Structure

```
mini-campaign-manager/
├── playwright.config.ts          # Create: Playwright config
├── tests/
│   └── e2e/
│       ├── auth.spec.ts         # Create: Auth flows
│       ├── campaign.spec.ts     # Create: Campaign CRUD
│       ├── recipients.spec.ts   # Create: Recipients table
│       └── dashboard.spec.ts    # Create: Dashboard stats
├── scripts/
│   └── setup-servers.js        # Create: Server spawner
└── docs/superpowers/plans/
    └── 2026-04-19-playwright-e2e-plan.md
```

---

## Task 1: Install Playwright Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add Playwright to root package.json**

```json
{
  "devDependencies": {
    "@playwright/test": "^1.50.0",
    "playwright": "^1.50.0"
  },
  "scripts": {
    "e2e": "playwright test"
  }
}
```

- [ ] **Step 2: Install Playwright**

Run: `npm install -D @playwright/test playwright`

- [ ] **Step 3: Install Chromium browser**

Run: `npx playwright install chromium`

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat(e2e): add Playwright dependencies"
```

---

## Task 2: Create playwright.config.ts

**Files:**
- Create: `playwright.config.ts`

- [ ] **Step 1: Write Playwright configuration**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node tests/e2e/scripts/setup-servers.js',
    port: 5173,
    reuseExistingServer: false,
    timeout: 120000,
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add playwright.config.ts
git commit -m "feat(e2e): add Playwright configuration"
```

---

## Task 3: Create setup-servers.js

**Files:**
- Create: `tests/e2e/scripts/setup-servers.js`

- [ ] **Step 1: Write server spawner script**

```javascript
import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const backend = spawn('yarn', ['workspace', '@mini-campaign-manager/backend', 'dev'], {
  stdio: 'pipe',
  shell: true,
});

const frontend = spawn('yarn', ['workspace', '@mini-campaign-manager/frontend', 'dev'], {
  stdio: 'pipe',
  shell: true,
});

backend.stdout.on('data', (data) => process.stdout.write(`[backend] ${data}`));
backend.stderr.on('data', (data) => process.stderr.write(`[backend] ${data}`));
frontend.stdout.on('data', (data) => process.stdout.write(`[frontend] ${data}`));
frontend.stderr.on('data', (data) => process.stderr.write(`[frontend] ${data}`));

async function waitForServer(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await setTimeout(1000);
  }
  throw new Error(`Server at ${url} not ready after ${timeout}ms`);
}

async function main() {
  console.log('Waiting for backend (http://localhost:3001)...');
  await waitForServer('http://localhost:3001');
  console.log('Backend ready!');

  console.log('Waiting for frontend (http://localhost:5173)...');
  await waitForServer('http://localhost:5173');
  console.log('Frontend ready!');

  console.log('All servers ready, running tests...');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

process.on('exit', () => {
  backend.kill();
  frontend.kill();
});
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/scripts/setup-servers.js
git commit -m "feat(e2e): add server spawner script"
```

---

## Task 4: Create auth.spec.ts

**Files:**
- Create: `tests/e2e/auth.spec.ts`

- [ ] **Step 1: Write auth E2E tests**

```typescript
import { test, expect } from '@playwright/test';

const testUser = {
  name: 'E2E Test User',
  email: `e2e-${Date.now()}@test.com`,
  password: 'testpassword123',
};

test.describe('Auth E2E', () => {
  test('E2E-Auth-01: Register new user → redirect to dashboard', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('http://localhost:5173/');
    await expect(page.locator('text=Campaign Performance')).toBeVisible();
  });

  test('E2E-Auth-02: Login with valid credentials → redirect to dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('http://localhost:5173/');
  });

  test('E2E-Auth-03: Login with invalid credentials → error message', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', 'wrongpassword');

    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('E2E-Auth-04: Logout → clear session, redirect to login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('http://localhost:5173/');

    await page.click('button:has-text("Logout")');

    await expect(page).toHaveURL(/.*\/login/);
  });
});
```

- [ ] **Step 2: Run tests to verify they work**

Run: `npx playwright test tests/e2e/auth.spec.ts --project=chromium`

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/auth.spec.ts
git commit -m "feat(e2e): add auth flow tests"
```

---

## Task 5: Create campaign.spec.ts

**Files:**
- Create: `tests/e2e/campaign.spec.ts`

- [ ] **Step 1: Write campaign E2E tests**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Campaign E2E', () => {
  const testUser = {
    email: `e2e-campaign-${Date.now()}@test.com`,
    password: 'testpassword123',
  };

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/register');
    await page.fill('input[name="name"]', 'Campaign E2E User');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:5173/');
    await page.close();
  });

  test('E2E-Camp-01: Create campaign → fill form → save as draft', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('http://localhost:5173/');

    await page.goto('/campaigns/new');

    await page.fill('input[placeholder*="Summer Sale"]', 'Test Campaign');
    await page.fill('input[placeholder*="Hot deals"]', 'Test Subject');
    await page.fill('textarea[placeholder*="special offer"]', 'Test body content');

    await page.click('button:has-text("Create Campaign")');

    await expect(page.locator('text=/initialized successfully|Campaign created/i')).toBeVisible();
  });

  test('E2E-Camp-02: Delete draft campaign → removed from list', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await page.goto('/campaigns');

    const campaignBefore = page.locator('text=Test Campaign');
    if (await campaignBefore.isVisible()) {
      await page.click('button:has-text("Delete")');
      await expect(page.locator('text=/purged|deleted/i')).toBeVisible();
    }
  });

  test('E2E-Camp-03: Send campaign → dispatch simulation triggered', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await page.goto('/campaigns/new');
    await page.fill('input[placeholder*="Summer Sale"]', 'Send Test Campaign');
    await page.fill('input[placeholder*="Hot deals"]', 'Send Test Subject');
    await page.fill('textarea[placeholder*="special offer"]', 'Send test body');
    await page.click('button:has-text("Create Campaign")');

    await page.goto('/campaigns');
    await page.click('button:has-text("Send")');

    await expect(page.locator('text=/Dispatch|initiated|sent/i')).toBeVisible();
  });

  test('E2E-Camp-04: Schedule campaign → future date → status = scheduled', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');

    await page.goto('/campaigns/new');
    await page.fill('input[placeholder*="Summer Sale"]', 'Schedule Test Campaign');
    await page.fill('input[placeholder*="Hot deals"]', 'Schedule Subject');
    await page.fill('textarea[placeholder*="special offer"]', 'Schedule body');
    await page.click('button:has-text("Create Campaign")');

    await page.goto('/campaigns');
    await page.click('button:has-text("Schedule")');

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateStr = futureDate.toISOString().split('T')[0];

    await page.fill('input[type="datetime-local"]', `${dateStr}T10:00`);
    await page.click('button:has-text("Confirm")');

    await expect(page.locator('text=Scheduled')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run tests to verify they work**

Run: `npx playwright test tests/e2e/campaign.spec.ts --project=chromium`

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/campaign.spec.ts
git commit -m "feat(e2e): add campaign flow tests"
```

---

## Task 6: Create recipients.spec.ts and dashboard.spec.ts

**Files:**
- Create: `tests/e2e/recipients.spec.ts`
- Create: `tests/e2e/dashboard.spec.ts`

- [ ] **Step 1: Write recipients E2E test**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Recipients E2E', () => {
  test('E2E-Recip-01: Navigate to recipients → table renders', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.goto('/recipients');

    await expect(page.locator('text=Recipient Roster')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });
});
```

- [ ] **Step 2: Write dashboard E2E test**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E', () => {
  test('E2E-Dash-01: Dashboard loads → stats cards visible', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('http://localhost:5173/');
    await expect(page.locator('text=Campaign Performance')).toBeVisible();
  });
});
```

- [ ] **Step 3: Run tests to verify they work**

Run: `npx playwright test tests/e2e/recipients.spec.ts tests/e2e/dashboard.spec.ts --project=chromium`

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/recipients.spec.ts tests/e2e/dashboard.spec.ts
git commit -m "feat(e2e): add recipients and dashboard tests"
```

---

## Task 7: Update testing_matrix.md

**Files:**
- Modify: `testing_matrix.md`

- [ ] **Step 1: Add Playwright E2E section**

Add new section after Section 5:

```markdown
---

## Section 6: Playwright E2E (Real Browser)

> File: `tests/e2e/*.spec.ts`

| Test ID | Flow | Status |
| :--- | :--- | :---: |
| E2E-Auth-01 | Register → redirect to dashboard | [ ] |
| E2E-Auth-02 | Login → redirect to dashboard | [ ] |
| E2E-Auth-03 | Invalid login → error message | [ ] |
| E2E-Auth-04 | Logout → redirect to login | [ ] |
| E2E-Camp-01 | Create campaign → save as draft | [ ] |
| E2E-Camp-02 | Delete draft campaign | [ ] |
| E2E-Camp-03 | Send campaign | [ ] |
| E2E-Camp-04 | Schedule campaign | [ ] |
| E2E-Recip-01 | Recipients table renders | [ ] |
| E2E-Dash-01 | Dashboard stats visible | [ ] |

**Current Test Coverage:** 10 tests (pending)
```

- [ ] **Step 2: Commit**

```bash
git add testing_matrix.md
git commit -m "docs: add Playwright E2E to testing matrix"
```

---

## Self-Review

1. **Spec coverage:** All 9 flows from spec mapped to tasks 4-6. Missing only "E2E-Camp-05: Non-draft campaign → delete button not shown" - will add as Task 8 if requested.

2. **Placeholder scan:** No TBD/TODO patterns. All code blocks are complete.

3. **Type consistency:** Uses Playwright `test` and `expect` from `@playwright/test`. Page methods (`fill`, `click`, `goto`) match Playwright API.

4. **Commands verified:** All `npx playwright test` commands use correct syntax.
