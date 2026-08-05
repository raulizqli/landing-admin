import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import MirrorPreviewFrame from './components/MirrorPreviewFrame.jsx';
import UsersAdminPage from './components/UsersAdminPage.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import { useLocale } from './i18n/LocaleContext.jsx';
import { canManageUsers } from './utils/permissions.js';

function AuthLoadingScreen() {
  const { t } = useLocale();
  return (
    <div className="h-screen flex items-center justify-center bg-gray-900 text-white font-sans text-sm tracking-widest uppercase animate-pulse">
      {t('common.verifyingAccess')}
    </div>
  );
}

/** Admin host `/` (e.g. admin.leftsidedev.site): session → CMS, else login. */
function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (user) return <Navigate to="/app" replace />;
  return <Navigate to="/login" replace />;
}

function LoginRoute() {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (user) return <Navigate to="/app" replace />;
  return <LoginScreen />;
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireRoot({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!canManageUsers(profile)) return <Navigate to="/app" replace />;
  return children;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route
          path="/app"
          element={(
            <RequireAuth>
              <App />
            </RequireAuth>
          )}
        />
        <Route
          path="/app/users"
          element={(
            <RequireRoot>
              <UsersAdminPage />
            </RequireRoot>
          )}
        />
        {/* No auth: iframe must not redirect to /login or / (breaks framing / CSP cache). */}
        <Route path="/app/preview-frame" element={<MirrorPreviewFrame />} />
        <Route path="/app/*" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
