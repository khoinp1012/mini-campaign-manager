import { useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/client';

export function useAuthSession() {
  const { setAuth, clearAuth, setSessionLoaded, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      setSessionLoaded();
      return;
    }

    api.get('/auth/me')
      .then(res => setAuth(res.data))
      .catch(() => {
        clearAuth(); // Also calls setSessionLoaded via clearAuth
      });
  }, []);
}
