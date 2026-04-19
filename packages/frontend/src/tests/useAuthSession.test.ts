import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthSession } from '../hooks/useAuthSession';
import { useAuthStore } from '../store/useAuthStore';
import api from '../api/client';

vi.mock('../api/client');

const mockedApi = api as jest.Mocked<typeof api>;

describe('useAuthSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('calls /auth/me on mount when not authenticated', async () => {
    const mockUser = { id: 1, email: 'test@test.com', name: 'Test User' };
    mockedApi.get.mockResolvedValueOnce({ data: mockUser } as any);

    renderHook(() => useAuthSession());

    await waitFor(() => {
      expect(mockedApi.get).toHaveBeenCalledWith('/auth/me');
    });
  });

  it('restores auth state when /auth/me returns valid user', async () => {
    const mockUser = { id: 1, email: 'test@test.com', name: 'Test User' };
    mockedApi.get.mockResolvedValueOnce({ data: mockUser } as any);

    renderHook(() => useAuthSession());

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
    });
  });

  it('does NOT call /auth/me when already authenticated', async () => {
    useAuthStore.setState({
      user: { id: 1, email: 'existing@test.com', name: 'Existing' },
      isAuthenticated: true,
    });

    renderHook(() => useAuthSession());

    await new Promise(resolve => setTimeout(resolve, 100));
    expect(mockedApi.get).not.toHaveBeenCalled();
  });

  it('clears auth state when /auth/me returns 401', async () => {
    mockedApi.get.mockRejectedValueOnce({ response: { status: 401 } });

    renderHook(() => useAuthSession());

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
    });
  });
});