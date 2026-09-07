import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { I18nProvider } from '@/lib/i18n';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Layout from '@/components/Layout';
import PortalLayout from '@/components/PortalLayout';
import RoleRouter from '@/pages/RoleRouter';
import PublicLanding from '@/pages/PublicLanding';
import Home from '@/pages/Home';
import Leads from '@/pages/Leads';
import Clients from '@/pages/Clients';
import ClientDetail from '@/pages/ClientDetail';
import Matters from '@/pages/Matters';
import MatterDetail from '@/pages/MatterDetail';
import Tasks from '@/pages/Tasks';
import Appointments from '@/pages/Appointments';
import DocumentsPage from '@/pages/Documents';
import Communications from '@/pages/Communications';
import Billing from '@/pages/Billing';
import PortalHome from '@/pages/portal/PortalHome';
import PortalDocuments from '@/pages/portal/PortalDocuments';
import PortalMessages from '@/pages/portal/PortalMessages';
import PortalProfile from '@/pages/portal/PortalProfile';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/enquiry" element={<PublicLanding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/" element={<RoleRouter />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Home />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/matters" element={<Matters />} />
          <Route path="/matters/:id" element={<MatterDetail />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/messages" element={<Communications />} />
          <Route path="/billing" element={<Billing />} />
        </Route>
        <Route element={<PortalLayout />}>
          <Route path="/portal" element={<PortalHome />} />
          <Route path="/portal/documents" element={<PortalDocuments />} />
          <Route path="/portal/messages" element={<PortalMessages />} />
          <Route path="/portal/profile" element={<PortalProfile />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <I18nProvider>
          <Router>
            <ScrollToTop />
            <AuthenticatedApp />
          </Router>
        </I18nProvider>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App