import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSwitcher, useLocale } from '../i18n/LocaleContext';

export default function LoginScreen() {
  const { signIn, authError } = useAuth();
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError('');
    setSubmitting(true);

    try {
      await signIn(email, password);
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
    <div className="min-h-screen bg-[#F4F1EA] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-[#2A342D]/10 rounded-2xl shadow-xl p-8">
        <div className="flex justify-end mb-2">
          <LanguageSwitcher className="text-[#2A342D]" />
        </div>
        <div className="mb-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#4A5D4E] font-semibold mb-2">
            {t('login.eyebrow')}
          </p>
          <h1 className="font-serif text-3xl text-[#2A342D]">{t('login.title')}</h1>
          <p className="text-sm text-[#2A342D]/60 mt-2">
            {t('login.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-[11px] font-bold text-[#2A342D]/50 uppercase">
              {t('login.email')}
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border border-[#2A342D]/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4A5D4E]/30"
              placeholder="you@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-[11px] font-bold text-[#2A342D]/50 uppercase">
              {t('login.password')}
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full border border-[#2A342D]/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4A5D4E]/30"
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
            className="w-full bg-[#4A5D4E] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#3d4d41] transition disabled:opacity-60"
          >
            {submitting ? t('login.submitting') : t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
