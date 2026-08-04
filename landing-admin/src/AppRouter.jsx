import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import MirrorPreviewFrame from './components/MirrorPreviewFrame.jsx';
import UsersAdminPage from './components/UsersAdminPage.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import { useLocale } from './i18n/LocaleContext.jsx';
import { getRootPublicUrl, isExternalPublicUrl } from './utils/marketingUrl.js';
import { canManageUsers } from './utils/permissions.js';

function AuthLoadingScreen() {
  const { t } = useLocale();
  return (
    <div className="h-screen flex items-center justify-center bg-gray-900 text-white font-sans text-sm tracking-widest uppercase animate-pulse">
      {t('common.verifyingAccess')}
    </div>
  );
}

function GuestPublicRedirect() {
  const { t } = useLocale();
  const publicUrl = getRootPublicUrl();

  useEffect(() => {
    if (!isExternalPublicUrl(publicUrl)) return;
    window.location.replace(publicUrl);
  }, [publicUrl]);

  if (!isExternalPublicUrl(publicUrl)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-3 bg-[#081810] text-white font-sans p-6 text-center">
      <p className="text-sm tracking-wide uppercase opacity-80 animate-pulse">
        {t('shell.redirectingMarketing')}
      </p>
      <a href={publicUrl} className="text-[#40B850] text-sm underline underline-offset-2">
        {publicUrl}
      </a>
    </div>
  );
}

function RootRoute() {
  const { loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  // `/` → corporate site when configured, else template/marketing. CMS at `/app`.
  // Same-origin guard avoids loops if the public URL points at this host.
  if (!isExternalPublicUrl()) {
    return <Navigate to="/login" replace />;
  }
  return <GuestPublicRedirect />;
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
        <Route
          path="/app/preview-frame"
          element={(
            <RequireAuth>
              <MirrorPreviewFrame />
            </RequireAuth>
          )}
        />
        <Route path="/app/*" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
