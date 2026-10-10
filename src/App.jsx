import { lazy, Suspense } from 'react';
import { BudgetProvider } from './context/BudgetContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContextValue';
import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import Layout from './components/Layout';
const BudgetDashboard = lazy(() => import('./pages/BudgetDashboard'));
const Budgets = lazy(() => import('./pages/Budgets'));
const Accounts = lazy(() => import('./pages/Accounts'));
const Alerts = lazy(() => import('./pages/Alerts'));
const AccountDetail = lazy(() => import('./pages/AccountDetail'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const Categories = lazy(() => import('./pages/Categories'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Login = lazy(() => import('./pages/Login'));

function PageFallback() {
  return (
    <Box sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}>
      <CircularProgress />
    </Box>
  );
}

function ProtectedApp() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#07111f', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <BudgetProvider>
      <Layout>
        <Suspense fallback={<PageFallback />}>
          <Routes>
          <Route path="/" element={<BudgetDashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/accounts/:accountId/detail" element={<AccountDetail />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/settings" element={<AccountSettings />} />
          </Routes>
        </Suspense>
      </Layout>
    </BudgetProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageFallback />}>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedApp />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
