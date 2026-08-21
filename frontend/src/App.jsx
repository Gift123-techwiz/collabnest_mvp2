import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import { Spinner } from './components/ui/Feedback';

import SignInPage from './pages/auth/SignInPage';
import SignUpPage from './pages/auth/SignUpPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import DiscoverPage from './pages/discover/DiscoverPage';
import MyProjectsPage from './pages/projects/MyProjectsPage';
import CreateProjectPage from './pages/projects/CreateProjectPage';
import ProjectDetailPage from './pages/projects/ProjectDetailPage';
import ProjectManagePage from './pages/projects/ProjectManagePage';
import ApplicationsPage from './pages/applications/ApplicationsPage';
import ProfilePage from './pages/profile/ProfilePage';
import PublicProfilePage from './pages/profile/PublicProfilePage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import SettingsPage from './pages/settings/SettingsPage';
import BillingCallbackPage from './pages/billing/BillingCallbackPage';

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, initializing } = useAuth();
  if (initializing) return <Spinner page />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/signin" element={<PublicOnlyRoute><SignInPage /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><SignUpPage /></PublicOnlyRoute>} />
      <Route path="/billing/callback" element={<ProtectedRoute><BillingCallbackPage /></ProtectedRoute>} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/my-projects" element={<MyProjectsPage />} />
        <Route path="/my-projects/:projectId" element={<ProjectManagePage />} />
        <Route path="/projects/new" element={<CreateProjectPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:userId" element={<PublicProfilePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
