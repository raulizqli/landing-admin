import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSwitcher, useLocale } from '../i18n/LocaleContext';
import { getMarketingUrl, isExternalMarketingUrl } from '../utils/marketingUrl';

export default function LoginScreen() {
  const { signIn, authError } = useAuth();
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const marketingUrl = getMarketingUrl();
  const showBackToSite = isExternalMarketingUrl(marketingUrl);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');
    setSubmitting(true);

    try {
      await signIn(email, password);
      // AppRouter LoginRoute redirects to /app when hasAccess becomes true.
    } catch {
      // authError is set in context
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError
    || (authError?.startsWith('login.') || authError === 'auth.profile'
      ? t(authError === 'auth.profile' ? 'login.errorProfile' : authError)
      : authError);

  return (
    <div className="min-h-screen bg-[#081810] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-[#2A342D]/10 rounded-2xl shadow-xl p-8">
        <div className={`flex items-center mb-2 gap-2 ${showBackToSite ? 'justify-between' : 'justify-end'}`}>
          {showBackToSite ? (
            <a
              href={marketingUrl}
              className="text-[11px] font-semibold text-[#40B850] hover:underline underline-offset-2"
            >
              ← {t('login.backToSite')}
            </a>
          ) : null}
          <LanguageSwitcher className="text-[#2A342D]" />
        </div>
        <div className="mb-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#40B850] font-semibold mb-2">
            {t('login.eyebrow')}
          </p>
          <h1 className="font-serif text-3xl text-[#101820]">{t('login.title')}</h1>
          <p className="text-sm text-[#101820]/60 mt-2">
            {t('login.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-[11px] font-bold text-[#101820]/50 uppercase">
              {t('login.email')}
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border border-[#101820]/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#40B850]/40"
              placeholder="you@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-[11px] font-bold text-[#101820]/50 uppercase">
              {t('login.password')}
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-[#101820]/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#40B850]/40"
              placeholder="••••••••"
            />
          </div>

          {displayError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {displayError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#40B850] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#289848] transition disabled:opacity-60"
          >
            {submitting ? t('login.submitting') : t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
