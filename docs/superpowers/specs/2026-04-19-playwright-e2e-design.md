# Playwright E2E Testing Design

**Date:** 2026-04-19
**Status:** Draft

## Overview

Add Playwright E2E tests to the Mini Campaign Manager project for real browser verification of critical user flows.

## Context

The project currently has 42 unit/integration tests (Vitest + Supertest) covering backend business logic, API endpoints, security cookies, and frontend interactions. These run in JSDOM which doesn't execute real browser behavior. Playwright will verify the application works in an actual Chromium browser.

## Approach

**Minimal footprint:** `@playwright/test` installed in root `package.json`, tests in `tests/e2e/`, self-contained server spawning via `scripts/setup-servers.js`.

## File Structure

```
mini-campaign-manager/
├── playwright.config.ts          # Playwright configuration
├── tests/
│   └── e2e/
│       ├── auth.spec.ts         # Register, login, logout flows
│       ├── campaign.spec.ts     # Create, delete, send, schedule
│       ├── recipients.spec.ts   # Recipients table rendering
│       └── dashboard.spec.ts    # Stats display
├── scripts/
│   └── setup-servers.js         # Spawn backend + frontend
└── docs/superpowers/specs/
    └── 2026-04-19-playwright-e2e-design.md
```

## Configuration

**`playwright.config.ts`**:
- `baseURL`: `http://localhost:5173`
- `webServer`: custom spawn via `setup-servers.js`
- `browser`: `chromium` only (fast, no extra deps)
- `reporter`: `list` (CI-friendly)

**`scripts/setup-servers.js`**:
- Spawns `tsx watch src/index.ts` for backend (port 3001)
- Spawns `vite` for frontend (port 5173)
- Waits for both ports to be ready
- Exits after test run completes

## Test Flows

### auth.spec.ts
| Test | Flow |
|------|------|
| E2E-Auth-01 | Register new user → redirect to dashboard |
| E2E-Auth-02 | Login with valid credentials → redirect to dashboard |
| E2E-Auth-03 | Login with invalid credentials → error message |
| E2E-Auth-04 | Logout → clear session, redirect to login |

### campaign.spec.ts
| Test | Flow |
|------|------|
| E2E-Camp-01 | Create campaign → fill form → save as draft |
| E2E-Camp-02 | Delete draft campaign → removed from list |
| E2E-Camp-03 | Send campaign → dispatch simulation triggered |
| E2E-Camp-04 | Schedule campaign → future date → status = scheduled |
| E2E-Camp-05 | Non-draft campaign → delete button not shown |

### recipients.spec.ts
| Test | Flow |
|------|------|
| E2E-Recip-01 | Navigate to recipients → table renders with data |

### dashboard.spec.ts
| Test | Flow |
|------|------|
| E2E-Dash-01 | Dashboard loads → stats cards visible |

## Database

Tests use existing Docker PostgreSQL (`localhost:5432`). Each test file runs `beforeAll` with `sequelize.sync({ force: true })` to reset state.

## Dependencies

```json
{
  "@playwright/test": "^1.50.0",
  "playwright": "^1.50.0"
}
```

Install command: `npm install -D @playwright/test playwright && npx playwright install chromium`

## Commands

```bash
# Run E2E tests (requires Docker PostgreSQL running)
npm run e2e

# Or directly
npx playwright test
```

## Constraints

- Requires Docker PostgreSQL running (`docker-compose up -d`)
- Server spawning adds ~10s to test startup
- Tests run sequentially (no parallelism) to avoid DB conflicts

## Self-Review

- [x] All tests map to real user flows
- [x] No overlap with existing Vitest tests (JSDOM vs real browser)
- [x] Scope is focused (9 tests total)
- [x] Self-contained setup doesn't break existing tests
