import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import SessionGuard from './components/SessionGuard';
import { getSessionId } from './utils/session';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './i18n';
import Layout from './components/layout/Layout';
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import Login from './pages/Login';
import Blocked from './pages/Blocked';
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
import AdminDashboard from './pages/admin/AdminDashboard';
import Institutions from './pages/admin/Institutions';
import AddInstitution from './pages/admin/AddInstitution';
import InstitutionDetail from './pages/admin/InstitutionDetail';
import SuperAdminSettings from './pages/admin/SuperAdminSettings';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const SuperAdminRoute = ({ children }) => {
  const { isAuthenticated, isSuperAdmin, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isSuperAdmin) return <Navigate to="/" />;
  return children;
};

const AuthRedirect = () => {
  const { isSuperAdmin } = useAuth();
  const sid = getSessionId();
  const target = isSuperAdmin ? '/admin' : '/';
  return <Navigate to={sid ? `${target}?sid=${sid}` : target} />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated
          ? <AuthRedirect />
          : <Login />
      } />
      <Route path="/blocked" element={<Blocked />} />

      {/* Super Admin Routes */}
      <Route path="/admin" element={<SuperAdminRoute><SuperAdminLayout><AdminDashboard /></SuperAdminLayout></SuperAdminRoute>} />
      <Route path="/admin/institutions" element={<SuperAdminRoute><SuperAdminLayout><Institutions /></SuperAdminLayout></SuperAdminRoute>} />
      <Route path="/admin/institutions/new" element={<SuperAdminRoute><SuperAdminLayout><AddInstitution /></SuperAdminLayout></SuperAdminRoute>} />
      <Route path="/admin/institutions/:id" element={<SuperAdminRoute><SuperAdminLayout><InstitutionDetail /></SuperAdminLayout></SuperAdminRoute>} />
      <Route path="/admin/settings" element={<SuperAdminRoute><SuperAdminLayout><SuperAdminSettings /></SuperAdminLayout></SuperAdminRoute>} />

      {/* Institution Routes */}
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
          <SessionGuard>
            <AppRoutes />
          </SessionGuard>
          <ToastContainer position="top-right" autoClose={3000} />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
