import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthSession } from './hooks/useAuthSession';
import { useAuthStore } from './store/useAuthStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CampaignList from './pages/CampaignList';
import CreateCampaign from './pages/CreateCampaign';
import CampaignDetail from './pages/CampaignDetail';
import Recipients from './pages/Recipients';
import ToastContainer from './components/Toast';
import Layout from './components/Layout';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSessionLoading } = useAuthStore();
  if (isSessionLoading) return null; // Wait for /auth/me to resolve
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="campaigns" element={<CampaignList />} />
        <Route path="campaigns/new" element={<CreateCampaign />} />
        <Route path="campaigns/:id" element={<CampaignDetail />} />
        <Route path="recipients" element={<Recipients />} />
      </Route>
    </Routes>
  );
}

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

export default App;
