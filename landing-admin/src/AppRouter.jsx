import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import { useLocale } from './i18n/LocaleContext.jsx';

function AuthLoadingScreen() {
  const { t } = useLocale();
  return (
    <div className="h-screen flex items-center justify-center bg-gray-900 text-white font-sans text-sm tracking-widest uppercase animate-pulse">
      {t('common.verifyingAccess')}
    </div>
  );
}

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (user) return <Navigate to="/app" replace />;
  // Never hard-redirect guests to VITE_MARKETING_URL: when the CMS is served on
  // that same host (e.g. leftsidedev.site), location.replace loops forever.
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
        <Route path="/app/*" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
