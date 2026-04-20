import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppRoutes } from './App';
import ToastContainer from './components/Toast';
import './index.css'; 
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/useAuthStore';
import api from './api/client';
import userEvent from '@testing-library/user-event';

// FE-13: Silent Console Enforcement
// Fails any test that triggers a console error or warning
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    originalError(...args);
    throw new Error(`Console Error detected: ${args[0]}`);
  };
  console.warn = (...args) => {
    originalWarn(...args);
    throw new Error(`Console Warning detected: ${args[0]}`);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Mock API client
vi.mock('./api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  },
}));

function TestWrapper({ children, initialEntries = ['/'] }: any) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { 
        retry: false,
        gcTime: 0,
        staleTime: 0
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ToastContainer />
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Engineering Verification: Gold Standard Matrix', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('P1: Login Page (Interactions & Boundaries)', () => {
    it('Boundary: Handles Invalid Credentials (401) with error feedback', async () => {
      const user = userEvent.setup();
      (api.post as any).mockRejectedValueOnce({
        response: { status: 401, data: { error: 'Unauthorized', message: 'Invalid credentials' } }
      });

      render(<TestWrapper initialEntries={['/login']}><AppRoutes /></TestWrapper>);
      
      const emailInput = screen.getByPlaceholderText(/name@company.com/i);
      const passwordInput = screen.getByPlaceholderText(/••••••••/i);
      const submitBtn = screen.getByRole('button', { name: /Sign In/i });

      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpass');
      await user.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('P4: Create Campaign Flow (Full Interaction)', () => {
    it('Flow: User can fill out form and receive success feedback', async () => {
      const user = userEvent.setup();
      useAuthStore.getState().setAuth({ id: 1, name: 'Admin', email: 'admin@example.com' });

      (api.get as any).mockImplementation((url: string) => {
        if (url === '/recipients') return Promise.resolve({ data: [{ id: 1, name: 'Alice', email: 'alice@example.com' }] });
        return Promise.resolve({ data: {} });
      });
      (api.post as any).mockResolvedValueOnce({ data: { id: 99, name: 'New Year Campaign' } });

      render(<TestWrapper initialEntries={['/campaigns/new']}><AppRoutes /></TestWrapper>);

      await waitFor(() => expect(screen.getByText('Alice')).toBeInTheDocument());
      await user.click(screen.getByText('Alice'));

      const nameInput = screen.getByPlaceholderText(/Summer Sale 2026/i);
      const subjectInput = screen.getByPlaceholderText(/Hot deals inside/i);
      const bodyInput = screen.getByPlaceholderText(/we have a special offer/i);
      const createBtn = screen.getByRole('button', { name: /Create Campaign/i });

      await user.type(nameInput, 'New Year Campaign');
      await user.type(subjectInput, 'Happy New Year!');
      await user.type(bodyInput, 'Hello world');
      await user.click(createBtn);

      await waitFor(() => {
        expect(screen.getByText(/initialized successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('P5: Campaign Detail (Advanced Interactions)', () => {
    it('Interaction: User can purge a draft campaign and is redirected', async () => {
      const user = userEvent.setup();
      useAuthStore.getState().setAuth({ id: 1, name: 'Admin', email: 'admin@example.com' });

      // Mock Detail & Deletion
      const mockCampaign = { id: 1, name: 'Draft 1', status: 'draft', subject: 'S1', body: 'B1', createdAt: new Date() };
      (api.get as any).mockResolvedValue({ data: mockCampaign });
      (api.delete as any).mockResolvedValue({ data: { success: true } });

      render(<TestWrapper initialEntries={['/campaigns/1']}><AppRoutes /></TestWrapper>);

      await waitFor(() => expect(screen.getByText(/Draft 1/i)).toBeInTheDocument());
      
      const deleteBtn = screen.getByRole('button', { name: /Delete/i });
      await user.click(deleteBtn);

      await waitFor(() => {
        expect(screen.getByText(/Campaign record purged/i)).toBeInTheDocument();
      });
    });

    it('Interaction: User can trigger Dispatch Sequence', async () => {
      const user = userEvent.setup();
      useAuthStore.getState().setAuth({ id: 1, name: 'Admin', email: 'admin@example.com' });

      const mockCampaign = { id: 1, name: 'Draft 1', status: 'draft', subject: 'S1', body: 'B1', createdAt: new Date() };
      (api.get as any).mockResolvedValue({ data: mockCampaign });
      (api.post as any).mockResolvedValue({ data: { success: true } });

      render(<TestWrapper initialEntries={['/campaigns/1']}><AppRoutes /></TestWrapper>);

      await waitFor(() => expect(screen.getByRole('button', { name: /Send/i })).toBeInTheDocument());
      
      const sendBtn = screen.getByRole('button', { name: /Send/i });
      await user.click(sendBtn);

      await waitFor(() => {
        expect(screen.getByText(/Dispatch sequence initiated/i)).toBeInTheDocument();
      });
    });
  });

  describe('FE-07: Campaign List Boundary Cases', () => {
    it('Boundary: Shows empty state when no campaigns are available', async () => {
      useAuthStore.getState().setAuth({ id: 1, name: 'Admin', email: 'admin@example.com' });
      
      (api.get as any).mockResolvedValueOnce({
        data: { campaigns: [], totalPages: 0, total: 0 }
      });

      render(<TestWrapper initialEntries={['/campaigns']}><AppRoutes /></TestWrapper>);

      await waitFor(() => {
        expect(screen.getByText(/No campaigns found/i)).toBeInTheDocument();
      });
    });
  });

  describe('FE-09: Dashboard Analytics Verification', () => {
    it('Unit: Stats display with correct formatting and content', async () => {
      useAuthStore.getState().setAuth({ id: 1, name: 'Admin', email: 'admin@example.com' });
      
      const mockStats = {
        total: 1250,
        sent: 1000,
        failed: 250,
        opened: 500,
        open_rate: 50.0,
        send_rate: 80.0
      };

      (api.get as any).mockImplementation((url: string) => {
          if (url.includes('/stats')) return Promise.resolve({ data: mockStats });
          if (url.includes('/campaigns')) return Promise.resolve({ data: { campaigns: [] } });
          return Promise.resolve({ data: {} });
      });

      render(<TestWrapper initialEntries={['/']}><AppRoutes /></TestWrapper>);

      await waitFor(() => {
        expect(screen.getByText(/Campaign Performance/i)).toBeInTheDocument();
      });

      // Check for stats presence (using more flexible matching)
      expect(screen.getByText(/1,250|1250/)).toBeInTheDocument();
      expect(screen.getByText(/50(\.0)?%/)).toBeInTheDocument();
    });
  });

  describe('FE-10: Guarded Routes Boundary', () => {
    it('Boundary: Unauthenticated access redirects to /login', async () => {
      // Clear auth
      useAuthStore.getState().logout();

      render(<TestWrapper initialEntries={['/campaigns']}><AppRoutes /></TestWrapper>);

      await waitFor(() => {
        // We expect to see the login screen
        expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
      });
    });
  });

  describe('FE-11: Recipients Page Smoke Test', () => {
    it('Smoke: Verify table headers + data rows presence', async () => {
      useAuthStore.getState().setAuth({ id: 1, name: 'Admin', email: 'admin@example.com' });
      
      const mockRecipients = [
        { id: 1, name: 'Alice Smoke', email: 'alice@smoke.com', createdAt: new Date().toISOString() },
        { id: 2, name: 'Bob Smoke', email: 'bob@smoke.com', createdAt: new Date().toISOString() },
      ];

      (api.get as any).mockImplementation((url: string) => {
          if (url.includes('/recipients')) return Promise.resolve({ data: mockRecipients });
          return Promise.resolve({ data: {} });
      });

      render(<TestWrapper initialEntries={['/recipients']}><AppRoutes /></TestWrapper>);

      await waitFor(() => {
        expect(screen.getByText(/Recipient Roster/i)).toBeInTheDocument();
        // Verify data rows
        expect(screen.getByText(/Alice Smoke/i)).toBeInTheDocument();
        expect(screen.getByText(/Bob Smoke/i)).toBeInTheDocument();
      });

      // Verify table headers
      expect(screen.getByText(/Identity/i)).toBeInTheDocument();
      expect(screen.getByText(/Email Vector/i)).toBeInTheDocument();
    });
  });

  describe('FE-12: Route Integrity (All-Page Trace)', () => {
    beforeEach(() => {
      useAuthStore.getState().setAuth({ id: 1, name: 'Admin', email: 'admin@example.com' });
      // Default success mocks to prevent rendering crashes
      (api.get as any).mockResolvedValue({ data: { campaigns: [], totalPages: 0, total: 0 } });
    });

    const routes = [
      { path: '/', label: 'Campaign Performance' },
      { path: '/campaigns', label: 'Campaign Console' },
      { path: '/campaigns/new', label: 'New Campaign' },
      { path: '/recipients', label: 'Recipient Roster' },
    ];

    routes.forEach(route => {
      it(`Smoke: ${route.path} renders silently without crashing`, async () => {
        render(<TestWrapper initialEntries={[route.path]}><AppRoutes /></TestWrapper>);
        await waitFor(() => {
          expect(screen.getByText(new RegExp(route.label, 'i'))).toBeInTheDocument();
        });
      });
    });

    it('Smoke: /campaigns/:id renders silently', async () => {
        (api.get as any).mockResolvedValue({ data: { id: 1, name: 'Trace Campaign' } });
        render(<TestWrapper initialEntries={['/campaigns/1']}><AppRoutes /></TestWrapper>);
        await waitFor(() => {
          expect(screen.getByText(/Trace Campaign/i)).toBeInTheDocument();
        });
    });
  });
});
