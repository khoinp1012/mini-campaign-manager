# Session Restoration Fix Design

**Date:** 2026-04-19
**Status:** Approved

## Overview

Fix the bug where users get logged out on page refresh despite having a valid httpOnly cookie. Add session restoration via a new `/auth/me` endpoint and frontend session hook.

## Problem

The frontend sets auth state in Zustand on login, but:
1. Zustand store is empty on every page load
2. No `/auth/me` endpoint to validate cookie and restore session
3. No session restoration on app initialization

Result: Users appear logged out after refresh even though their cookie is valid.

## Solution

### Backend: Add `GET /auth/me` endpoint

**File:** `packages/backend/src/routes/authRoutes.ts`

Add route:
```ts
router.get('/me', authenticate, (req, res) => {
  const user = (req as any).user;
  res.json({ id: user.id, email: user.email, name: user.name });
});
```

### Frontend: Add session restoration hook

**File:** `packages/frontend/src/hooks/useAuthSession.ts`

```ts
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

**File:** `packages/frontend/src/App.tsx`

Add to `App` component:
```tsx
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

## Files to Change

1. `packages/backend/src/routes/authRoutes.ts` — Add `GET /auth/me`
2. `packages/frontend/src/hooks/useAuthSession.ts` — Create new hook
3. `packages/frontend/src/App.tsx` — Call session restoration hook

## Test Updates

After fix, E2E tests should pass. Run:
```bash
npm run e2e
```

## Success Criteria

- User can login and stay authenticated across page refreshes
- E2E tests pass: E2E-Auth-01, E2E-Auth-02, E2E-Auth-04
- No regression: existing Vitest tests still pass
