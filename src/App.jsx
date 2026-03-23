import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './i18n';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Residents from './pages/Residents';
import ResidentDetail from './pages/ResidentDetail';
import Medications from './pages/Medications';
import Deliveries from './pages/Deliveries';
import DeliveryDetail from './pages/DeliveryDetail';
import NewDelivery from './pages/NewDelivery';
import EditDelivery from './pages/EditDelivery';
import StockManagement from './pages/StockManagement';
import Reports from './pages/Reports';
import Billing from './pages/Billing';
import BillingDetail from './pages/BillingDetail';
import Settings from './pages/Settings';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/residents" element={
        <ProtectedRoute>
          <Layout>
            <Residents />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/residents/:id" element={
        <ProtectedRoute>
          <Layout>
            <ResidentDetail />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/medications" element={
        <ProtectedRoute>
          <Layout>
            <Medications />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/deliveries" element={
        <ProtectedRoute>
          <Layout>
            <Deliveries />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/deliveries/new" element={
        <ProtectedRoute>
          <Layout>
            <NewDelivery />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/deliveries/:id" element={
        <ProtectedRoute>
          <Layout>
            <DeliveryDetail />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/deliveries/:id/edit" element={
        <ProtectedRoute>
          <Layout>
            <EditDelivery />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/stock" element={
        <ProtectedRoute>
          <Layout>
            <StockManagement />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/reports" element={
        <ProtectedRoute>
          <Layout>
            <Reports />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/billing" element={
        <ProtectedRoute>
          <Layout>
            <Billing />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/billing/:residentId" element={
        <ProtectedRoute>
          <Layout>
            <BillingDetail />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
          <ToastContainer position="top-right" autoClose={3000} />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
