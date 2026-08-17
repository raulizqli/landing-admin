import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import App from './App.jsx';
import InboxPage from './components/InboxPage.jsx';
import LegalPublicPage from './components/LegalPublicPage.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import MirrorPreviewFrame from './components/MirrorPreviewFrame.jsx';
import PagesOverviewPage from './components/PagesOverviewPage.jsx';
import TicketsPage from './components/TicketsPage.jsx';
import UsersAdminPage from './components/UsersAdminPage.jsx';
import { useAuth } from './contexts/AuthContext.jsx';
import { useLocale } from './i18n/LocaleContext.jsx';
import {
  canManageCmsTickets,
  canManageUsers,
  canUseCmsInbox,
  canViewPagesOverview,
} from './utils/permissions.js';

function AuthLoadingScreen() {
  const { t } = useLocale();
  return (
    <div className="h-screen flex items-center justify-center bg-gray-900 text-white font-sans text-sm tracking-widest uppercase animate-pulse">
      {t('common.verifyingAccess')}
    </div>
  );
}

function homePathForProfile(profile) {
  return canViewPagesOverview(profile) ? '/app/pages' : '/app';
}

/** Admin host `/` (e.g. admin.leftsidedev.site): session → CMS, else login. */
function RootRoute() {
  const { user, profile, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (user) return <Navigate to={homePathForProfile(profile)} replace />;
  return <Navigate to="/login" replace />;
}

function LoginRoute() {
  const { user, profile, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (user) return <Navigate to={homePathForProfile(profile)} replace />;
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
  if (!canManageUsers(profile)) return <Navigate to={homePathForProfile(profile)} replace />;
  return children;
}

function RequirePagesOverview({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!canViewPagesOverview(profile)) return <Navigate to="/app" replace />;
  return children;
}

function RequireInbox({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!canUseCmsInbox(profile, user.uid)) return <Navigate to={homePathForProfile(profile)} replace />;
  return children;
}

function RequireTickets({ children }) {
  const { user, profile, loading } = useAuth();
  if (loading) return <AuthLoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!canManageCmsTickets(profile)) return <Navigate to={homePathForProfile(profile)} replace />;
  return children;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/login" element={<LoginRoute />} />
        {/* Public legal docs: never wrap with RequireAuth. Direct visits also skip Auth in main.jsx. */}
        <Route path="/privacy" element={<LegalPublicPage kind="privacy" />} />
        <Route path="/terms" element={<LegalPublicPage kind="terms" />} />
        <Route path="/data-deletion" element={<LegalPublicPage kind="dataDeletion" />} />
        <Route
          path="/app"
          element={(
            <RequireAuth>
              <App />
            </RequireAuth>
          )}
        />
        <Route
          path="/app/pages"
          element={(
            <RequirePagesOverview>
              <PagesOverviewPage />
            </RequirePagesOverview>
          )}
        />
        <Route
          path="/app/inbox"
          element={(
            <RequireInbox>
              <InboxPage />
            </RequireInbox>
          )}
        />
        <Route
          path="/app/tickets"
          element={(
            <RequireTickets>
              <TicketsPage />
            </RequireTickets>
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
