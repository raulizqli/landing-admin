import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSwitcher, useLocale } from '../i18n/LocaleContext';
import { getRootPublicUrl, isExternalPublicUrl } from '../utils/marketingUrl';
import { isValidEmail, isValidMxUsPhone } from '../utils/contactValidation';
import { requestCmsAccess } from '../utils/userFunctions';

export default function LoginScreen() {
  const { signIn, sendPasswordReset, authError, clearAuthError } = useAuth();
  const { t } = useLocale();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('mx');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [registerSent, setRegisterSent] = useState(false);
  const publicUrl = getRootPublicUrl();
  const showBackToSite = isExternalPublicUrl(publicUrl);
  const isReset = mode === 'reset';
  const isRegister = mode === 'register';

  const switchMode = (next) => {
    setMode(next);
    setLocalError('');
    setResetSent(false);
    setRegisterSent(false);
    clearAuthError?.();
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    setLocalError('');
    setResetSent(false);
    setRegisterSent(false);
    setSubmitting(true);

    try {
      await signIn(email, password);
    } catch {
      // authError is set in context
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();
    setLocalError('');
    setResetSent(false);
    setSubmitting(true);

    try {
      await sendPasswordReset(email);
      setResetSent(true);
    } catch {
      // authError is set in context
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setLocalError('');
    setRegisterSent(false);
    clearAuthError?.();

    if (!isValidEmail(email)) {
      setLocalError(t('login.registerErrorEmail'));
      return;
    }
    if (!isValidMxUsPhone(phone, phoneCountry)) {
      setLocalError(t('login.registerErrorPhone'));
      return;
    }
    if (String(password).length < 6) {
      setLocalError(t('login.registerErrorPassword'));
      return;
    }
    if (password !== passwordConfirm) {
      setLocalError(t('login.registerErrorPasswordMatch'));
      return;
    }

    setSubmitting(true);
    try {
      await requestCmsAccess({
        email,
        password,
        displayName,
        phone,
        phoneCountry,
      });
      setRegisterSent(true);
      setPassword('');
      setPasswordConfirm('');
    } catch (error) {
      setLocalError(error?.message || t('login.registerErrorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = (() => {
    if (localError) return localError;
    if (!authError) return '';
    if (authError === 'auth.offline') return t('common.offlineBody');
    if (authError === 'auth.profile') return t('login.errorProfile');
    if (authError.startsWith('login.')) return t(authError);
    return authError;
  })();

  const title = isRegister
    ? t('login.registerTitle')
    : isReset
      ? t('login.resetTitle')
      : t('login.title');
  const subtitle = isRegister
    ? t('login.registerSubtitle')
    : isReset
      ? t('login.resetSubtitle')
      : t('login.subtitle');

  const onSubmit = isRegister ? handleRegister : isReset ? handleReset : handleSignIn;

  return (
    <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden bg-[#081810] font-sans">
      <div className="flex min-h-full items-center justify-center p-6 py-10">
        <div className="w-full max-w-md bg-white border border-[#2A342D]/10 rounded-2xl shadow-xl p-8">
        <div className={`flex items-center mb-2 gap-2 ${showBackToSite ? 'justify-between' : 'justify-end'}`}>
          {showBackToSite ? (
            <a
              href={publicUrl}
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
          <h1 className="font-serif text-3xl text-[#101820]">{title}</h1>
          <p className="text-sm text-[#101820]/60 mt-2">{subtitle}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {isRegister ? (
            <div className="space-y-1.5">
              <label htmlFor="login-name" className="block text-[11px] font-bold text-[#101820]/50 uppercase">
                {t('login.displayName')}
              </label>
              <input
                id="login-name"
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full border border-[#101820]/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#40B850]/40"
                placeholder={t('login.displayNamePlaceholder')}
              />
            </div>
          ) : null}

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

          {isRegister ? (
            <div className="space-y-1.5">
              <label htmlFor="login-phone" className="block text-[11px] font-bold text-[#101820]/50 uppercase">
                {t('login.phone')}
              </label>
              <div className="flex gap-2">
                <select
                  value={phoneCountry}
                  onChange={(event) => setPhoneCountry(event.target.value)}
                  className="shrink-0 border border-[#101820]/15 rounded-lg px-2 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#40B850]/40 bg-white"
                  aria-label={t('login.phoneCountry')}
                >
                  <option value="mx">MX +52</option>
                  <option value="us">US +1</option>
                </select>
                <input
                  id="login-phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="flex-1 min-w-0 border border-[#101820]/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#40B850]/40"
                  placeholder={phoneCountry === 'us' ? '4155552671' : '5512345678'}
                />
              </div>
              <p className="text-[10px] text-[#101820]/45">{t('login.phoneHint')}</p>
            </div>
          ) : null}

          {!isReset ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="login-password" className="block text-[11px] font-bold text-[#101820]/50 uppercase">
                  {t('login.password')}
                </label>
                {!isRegister ? (
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="text-[11px] font-semibold text-[#40B850] hover:underline underline-offset-2"
                  >
                    {t('login.forgotPassword')}
                  </button>
                ) : null}
              </div>
              <input
                id="login-password"
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full border border-[#101820]/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#40B850]/40"
                placeholder="••••••••"
                minLength={isRegister ? 6 : undefined}
              />
            </div>
          ) : null}

          {isRegister ? (
            <div className="space-y-1.5">
              <label htmlFor="login-password-confirm" className="block text-[11px] font-bold text-[#101820]/50 uppercase">
                {t('login.passwordConfirm')}
              </label>
              <input
                id="login-password-confirm"
                type="password"
                autoComplete="new-password"
                required
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                className="w-full border border-[#101820]/15 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#40B850]/40"
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          ) : null}

          {registerSent ? (
            <p className="text-sm text-[#2A342D] bg-[#40B850]/10 border border-[#40B850]/25 rounded-lg px-3 py-2">
              {t('login.registerSent')}
            </p>
          ) : null}

          {resetSent ? (
            <p className="text-sm text-[#2A342D] bg-[#40B850]/10 border border-[#40B850]/25 rounded-lg px-3 py-2">
              {t('login.resetSent')}
            </p>
          ) : null}

          {displayError && !resetSent && !registerSent ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {displayError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || registerSent}
            className="w-full bg-[#40B850] text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-[#289848] transition disabled:opacity-60"
          >
            {submitting
              ? (isRegister ? t('login.registerSubmitting') : isReset ? t('login.resetSubmitting') : t('login.submitting'))
              : (isRegister ? t('login.registerSubmit') : isReset ? t('login.resetSubmit') : t('login.submit'))}
          </button>

          {isReset || isRegister ? (
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className="w-full text-sm font-semibold text-[#101820]/70 hover:text-[#101820] py-1"
            >
              {t('login.backToSignIn')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => switchMode('register')}
              className="w-full text-sm font-semibold text-[#40B850] hover:underline underline-offset-2 py-1"
            >
              {t('login.createAccount')}
            </button>
          )}
        </form>
        </div>
      </div>
    </div>
  );
}
