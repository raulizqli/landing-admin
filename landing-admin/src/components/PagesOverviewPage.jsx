import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLocale, LanguageSwitcher } from '../i18n/LocaleContext';
import { useEntitlements } from '../hooks/useEntitlements';
import { db } from '../firebase';
import { listPageDocuments } from '../utils/firestoreAccess';
import { createCmsPageRemote } from '../utils/aiAssistFunctions';
import {
  canCreatePages,
  canManageUsers,
  canViewPagesOverview,
  filterAccessiblePages,
  getAccessiblePageIds,
  getRoleLabel,
} from '../utils/permissions';
import { isMarketingSite } from '@raulizqli/landing-core/marketingSite';
import { getVerticalMeta } from '@raulizqli/landing-core/verticals';
import CreatePageModal from './CreatePageModal';
import BillingPlansPanel from './BillingPlansPanel';
import SubscriptionHealthCard from './SubscriptionHealthCard';

export default function PagesOverviewPage() {
  const {
    user,
    profile,
    loading: authLoading,
    signOut,
    refreshProfile,
    refreshBillingAccount,
  } = useAuth();
  const { t, locale } = useLocale();
  const entitlements = useEntitlements();
  const navigate = useNavigate();

  const [landings, setLandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [creatingPage, setCreatingPage] = useState(false);

  const canCreateNewPages = canCreatePages(profile, { user, entitlements });
  const accessibleLandings = useMemo(
    () => (profile ? filterAccessiblePages(landings, profile) : []),
    [landings, profile],
  );

  const filteredLandings = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accessibleLandings;
    return accessibleLandings.filter((page) => {
      const verticalLabel = getVerticalMeta(page.vertical)?.label?.[locale]
        || getVerticalMeta(page.vertical)?.label?.es
        || page.vertical
        || '';
      const haystack = [
        page.id,
        page.name,
        page.specialty,
        verticalLabel,
        isMarketingSite(page) ? 'marketing' : '',
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [accessibleLandings, query, locale]);

  const loadPages = async () => {
    if (!profile) return;
    setLoading(true);
    setError('');
    try {
      const allowedIds = getAccessiblePageIds(profile);
      const list = allowedIds === null
        ? await listPageDocuments(db)
        : await listPageDocuments(db, { pageIds: allowedIds });
      setLandings(list);
    } catch (loadError) {
      console.error(loadError);
      setError(loadError.message || t('pagesOverview.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user || !profile) return;
    if (!canViewPagesOverview(profile)) return;
    loadPages();
  }, [user, profile, authLoading]);

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white font-sans text-sm tracking-widest uppercase animate-pulse">
        {t('common.verifyingAccess')}
      </div>
    );
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />;
  }

  if (!canViewPagesOverview(profile)) {
    return <Navigate to="/app" replace />;
  }

  const openEditor = (pageId) => {
    navigate(`/app?pageId=${encodeURIComponent(pageId)}`);
  };

  const handleCreatePage = async ({ pageId, name, specialty, vertical }) => {
    setCreatingPage(true);
    try {
      await createCmsPageRemote({ pageId, name, specialty, vertical });
      try {
        await refreshProfile?.();
      } catch {
        try {
          await refreshBillingAccount?.();
        } catch {
          // ignore
        }
      }
      setShowCreatePage(false);
      navigate(`/app?pageId=${encodeURIComponent(pageId)}`);
    } finally {
      setCreatingPage(false);
    }
  };

  const quotaLabel = entitlements.pageLimit == null
    ? t('billing.unlimited')
    : `${entitlements.pageCount} / ${entitlements.pageLimit}`;

  return (
    <div className="flex h-dvh w-full flex-col bg-[#F4F1EA] text-[#2A342D] overflow-hidden font-sans">
      <header className="shrink-0 border-b border-[#2A342D]/10 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#4A5D4E]/70">
              {t('shell.title')}
            </p>
            <h1 className="font-serif text-2xl text-[#2A342D]">{t('pagesOverview.title')}</h1>
            <p className="text-xs text-[#2A342D]/60 mt-0.5">{t('pagesOverview.subtitle')}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="truncate text-gray-500" title={user.email}>{user.email}</span>
              <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 font-semibold text-indigo-700 uppercase tracking-wide">
                {getRoleLabel(profile.role)}
              </span>
              <span className="rounded-full bg-white border border-gray-200 px-2 py-0.5 font-semibold text-gray-600">
                {t('billing.pages')}: {quotaLabel}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LanguageSwitcher className="text-[#2A342D]" />
            <Link
              to="/app/inbox"
              className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Inbox
            </Link>
            <Link
              to="/app/tickets"
              className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Tickets
            </Link>
            <button
              type="button"
              onClick={() => setShowBilling(true)}
              className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              {t('common.billing')}
            </button>
            {canCreateNewPages && (
              <button
                type="button"
                onClick={() => setShowCreatePage(true)}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                {t('common.createLanding')}
                {entitlements.pageLimit != null && (
                  <span className="ml-1 opacity-80">
                    ({entitlements.pageCount}/{entitlements.pageLimit})
                  </span>
                )}
              </button>
            )}
            {canManageUsers(profile) && (
              <Link
                to="/app/users"
                className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                {t('common.users')}
              </Link>
            )}
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              {t('common.exit')}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
          <SubscriptionHealthCard
            health={entitlements.health}
            planName={t(`billing.plans.${entitlements.planId}.name`)}
            onOpenBilling={() => setShowBilling(true)}
          />

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                {t('pagesOverview.search')}
              </label>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('pagesOverview.searchPlaceholder')}
                className="w-full rounded-lg border bg-white px-3 py-2 text-xs"
              />
            </div>
            <p className="text-[11px] text-gray-500 pb-2">
              {filteredLandings.length} / {accessibleLandings.length}
            </p>
          </div>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          ) : null}

          {loading ? (
            <p className="text-sm text-gray-500 animate-pulse">{t('common.loading')}</p>
          ) : accessibleLandings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#2A342D]/15 bg-white px-6 py-10 text-center">
              <p className="text-sm text-[#2A342D]/70 mb-4">{t('pagesOverview.empty')}</p>
              {canCreateNewPages ? (
                <button
                  type="button"
                  onClick={() => setShowCreatePage(true)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  {t('common.createLanding')}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredLandings.map((page) => {
                const verticalMeta = getVerticalMeta(page.vertical);
                const verticalLabel = verticalMeta?.label?.[locale]
                  || verticalMeta?.label?.es
                  || page.vertical
                  || '—';
                const marketing = isMarketingSite(page);
                return (
                  <article
                    key={page.id}
                    className="rounded-2xl border border-[#2A342D]/10 bg-white p-4 flex flex-col gap-3 shadow-sm"
                  >
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="font-serif text-lg text-[#2A342D] truncate">
                          {marketing ? '◈ ' : ''}
                          {page.name || page.id}
                        </h2>
                        {marketing ? (
                          <span className="shrink-0 rounded-full bg-violet-50 border border-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                            Marketing
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[10px] font-mono text-gray-400 mt-1 truncate">{page.id}</p>
                      {page.specialty ? (
                        <p className="text-xs text-[#2A342D]/70 mt-2 line-clamp-2">{page.specialty}</p>
                      ) : null}
                      <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-wide">
                        {verticalLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEditor(page.id)}
                      className="mt-auto w-full rounded-lg bg-[#4A5D4E] px-3 py-2 text-xs font-semibold text-white hover:bg-[#3d4d41]"
                    >
                      {t('pagesOverview.openEditor')}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <CreatePageModal
        open={showCreatePage}
        onClose={() => setShowCreatePage(false)}
        onCreate={handleCreatePage}
        creating={creatingPage}
        pageCount={entitlements.pageCount}
        pageLimit={entitlements.bypass ? null : entitlements.pageLimit}
      />
      <BillingPlansPanel open={showBilling} onClose={() => setShowBilling(false)} />
    </div>
  );
}
