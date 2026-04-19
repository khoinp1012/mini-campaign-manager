# Session Restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix session persistence bug - users getting logged out on page refresh despite valid httpOnly cookie.

**Architecture:** Add `GET /auth/me` endpoint to validate cookie and return user data. Frontend adds `useAuthSession` hook that calls this on app mount to restore auth state.

**Tech Stack:** Express.js backend, React/Zustand frontend

---

## Task 1: Add `GET /auth/me` endpoint

**Files:**
- Modify: `packages/backend/src/routes/authRoutes.ts`

- [ ] **Step 1: Add `/me` route to authRoutes.ts**

Read current file, then add:

```typescript
router.get('/me', authenticate, (req, res) => {
  const user = (req as any).user;
  res.json({ id: user.id, email: user.email, name: user.name });
});
```

The `authenticate` middleware is already exported from `middleware/auth.ts`.

- [ ] **Step 2: Verify the endpoint works**

Start backend and test:
```bash
curl -v http://localhost:3001/auth/me
# Should return 401 without cookie
# With cookie, should return user data
```

---

## Task 2: Create `useAuthSession` hook

**Files:**
- Create: `packages/frontend/src/hooks/useAuthSession.ts`

- [ ] **Step 1: Create the hooks directory and file**

```typescript
import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/client';

export function useAuthSession() {
  const { setAuth, clearAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) return;

    api.get('/auth/me')
      .then(res => setAuth(res.data))
      .catch(() => clearAuth());
  }, []);
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
cd packages/frontend && npx tsc --noEmit
```

---

## Task 3: Integrate session hook in App.tsx

**Files:**
- Modify: `packages/frontend/src/App.tsx`

- [ ] **Step 1: Add useAuthSession hook call**

Import the hook and call it in the `App` component:

```typescript
import { useAuthSession } from './hooks/useAuthSession';

function App() {
  useAuthSession(); // Restore session on mount

  return (
    <QueryClientProvider client={queryClient}>
      <ToastContainer />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

---

## Task 4: Verify with E2E tests

- [ ] **Step 1: Ensure servers are running**

```bash
docker compose up -d
cd packages/backend && yarn dev &
cd packages/frontend && yarn dev &
```

- [ ] **Step 2: Run E2E tests**

```bash
npm run e2e
```

Expected: E2E-Auth-01, E2E-Auth-02, E2E-Auth-04 should now pass.

---

## Task 5: Run existing tests to ensure no regression

- [ ] **Step 1: Run backend Vitest tests**

```bash
cd packages/backend && npm test
```

- [ ] **Step 2: Run frontend Vitest tests**

```bash
cd packages/frontend && npm test
```

---

## Self-Review

1. **Spec coverage:** All three files in spec (authRoutes.ts, useAuthSession.ts, App.tsx) are covered in Tasks 1-3.

2. **Placeholder scan:** No TBD/TODO patterns. All code is complete.

3. **Type consistency:** `useAuthSession` uses `setAuth` and `clearAuth` from Zustand store, matching existing API.

---

## Files Summary

| File | Action |
|------|--------|
| `packages/backend/src/routes/authRoutes.ts` | Modify - add GET /me |
| `packages/frontend/src/hooks/useAuthSession.ts` | Create - session restoration hook |
| `packages/frontend/src/App.tsx` | Modify - call useAuthSession |
