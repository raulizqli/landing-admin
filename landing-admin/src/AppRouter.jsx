import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import MirrorPreviewFrame from './components/MirrorPreviewFrame.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import { useLocale } from './i18n/LocaleContext.jsx';
import { getMarketingUrl, isExternalMarketingUrl } from './utils/marketingUrl.js';

function AuthLoadingScreen() {
  const { t } = useLocale();
  return (
    <div className="h-screen flex items-center justify-center bg-gray-900 text-white font-sans text-sm tracking-widest uppercase animate-pulse">
      {t('common.verifyingAccess')}
    </div>
  );
}

function GuestMarketingRedirect() {
  const { t } = useLocale();
  const marketingUrl = getMarketingUrl();

  useEffect(() => {
    if (!isExternalMarketingUrl(marketingUrl)) return;
    window.location.replace(marketingUrl);
  }, [marketingUrl]);

  if (!isExternalMarketingUrl(marketingUrl)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center gap-3 bg-[#081810] text-white font-sans p-6 text-center">
      <p className="text-sm tracking-wide uppercase opacity-80 animate-pulse">
        {t('shell.redirectingMarketing')}
      </p>
      <a href={marketingUrl} className="text-[#40B850] text-sm underline underline-offset-2">
        {marketingUrl}
      </a>
    </div>
  );
}

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (user) return <Navigate to="/app" replace />;
  // Guests → public sales landing (template). Same-origin guard avoids loops
  // if VITE_MARKETING_URL is misconfigured to this host.
  if (!isExternalMarketingUrl()) {
    return <Navigate to="/login" replace />;
  }
  return <GuestMarketingRedirect />;
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
