import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import {
  ensureBootstrapRootProfile,
  getUserProfile,
} from '../utils/userAccess';
import { getBillingAccount } from '../utils/billingAccount';
import { ensureBillingAccountRemote } from '../utils/billingFunctions';
import { normalizeBillingAccount } from '../utils/billingPlans';
import { isBillingBypass } from '../utils/permissions';
import { getLoginBlockReason } from '../utils/appEnv';
import { initHubAppCheck } from '../utils/appCheck';
import { requestPasswordResetEmailRemote } from '../utils/userFunctions';

const AuthContext = createContext(null);

function loginBlockErrorKey(reason) {
  if (reason === 'disabled') return 'login.errorDisabled';
  if (reason === 'demo') return 'login.errorDemo';
  if (reason === 'pending') return 'login.errorPending';
  if (reason === 'rejected') return 'login.errorRejected';
  return 'login.errorGeneric';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [billingAccount, setBillingAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const loadBillingForProfile = useCallback(async (nextProfile) => {
    if (!nextProfile?.uid) {
      setBillingAccount(null);
      return null;
    }
    if (isBillingBypass(nextProfile)) {
      setBillingAccount(null);
      return null;
    }

    const accountId = String(nextProfile.accountId ?? nextProfile.uid).trim();
    let account = await getBillingAccount(db, accountId);
    // Always refresh via CF so billingAccounts.pageIds stays synced with assigned pages.
    try {
      const remote = await ensureBillingAccountRemote();
      if (remote) {
        account = normalizeBillingAccount(remote.id || accountId, remote);
      }
    } catch {
      // Keep Firestore read if callable is unavailable.
    }
    setBillingAccount(account);
    return account;
  }, []);

  const rejectUnauthorizedSession = useCallback(async (reason) => {
    setAuthError(loginBlockErrorKey(reason));
    setUser(null);
    setProfile(null);
    setBillingAccount(null);
    try {
      await firebaseSignOut(auth);
    } catch (signOutError) {
      console.error('Error al cerrar sesión no autorizada:', signOutError);
    }
    // Full reload clears in-memory App Check so the next sign-in is not blocked
    // (prod-only symptom: first login OK, logout → login fails).
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true);

      try {
        if (!nextUser) {
          setUser(null);
          setProfile(null);
          setBillingAccount(null);
          return;
        }

        const nextProfile = await ensureBootstrapRootProfile(db, nextUser);
        const blockReason = getLoginBlockReason(nextProfile);
        if (blockReason) {
          await rejectUnauthorizedSession(blockReason);
          return;
        }

        setAuthError('');
        setUser(nextUser);
        setProfile(nextProfile);
        initHubAppCheck();
        await loadBillingForProfile(nextProfile);
      } catch (error) {
        console.error('Error al cargar el perfil de usuario:', error);
        const code = String(error?.code ?? '');
        const offline = code.includes('unavailable')
          || code.includes('offline')
          || /offline|unavailable|Failed to get document because the client is offline/i.test(String(error?.message ?? ''));
        setAuthError(offline ? 'auth.offline' : 'auth.profile');
        setUser(null);
        setProfile(null);
        setBillingAccount(null);
        try {
          await firebaseSignOut(auth);
        } catch {
          // ignore
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [loadBillingForProfile, rejectUnauthorizedSession]);

  const signIn = async (email, password) => {
    setAuthError('');
    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      let nextProfile = null;
      try {
        nextProfile = await ensureBootstrapRootProfile(db, credential.user);
      } catch (profileError) {
        await firebaseSignOut(auth);
        throw profileError;
      }
      const blockReason = getLoginBlockReason(nextProfile);
      if (blockReason) {
        await firebaseSignOut(auth);
        const message = loginBlockErrorKey(blockReason);
        setAuthError(message);
        const err = new Error(message);
        if (blockReason === 'disabled') err.code = 'auth/user-disabled';
        else if (blockReason === 'demo') err.code = 'auth/demo-forbidden';
        else if (blockReason === 'pending') err.code = 'auth/approval-pending';
        else if (blockReason === 'rejected') err.code = 'auth/approval-rejected';
        else err.code = 'auth/access-denied';
        throw err;
      }
    } catch (error) {
      if (
        error?.code === 'auth/demo-forbidden'
        || error?.code === 'auth/user-disabled'
        || error?.code === 'auth/approval-pending'
        || error?.code === 'auth/approval-rejected'
        || error?.code === 'auth/access-denied'
      ) {
        throw error;
      }
      const code = String(error?.code ?? '');
      const raw = String(error?.message ?? '');
      let message = 'login.errorGeneric';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        message = 'login.errorInvalid';
      } else if (code === 'auth/user-disabled') {
        message = 'login.errorDisabled';
      } else if (
        code.includes('network-request-failed')
        || /network-request-failed|Failed to fetch|NetworkError/i.test(raw)
      ) {
        message = 'login.errorNetwork';
      } else if (code === 'auth/too-many-requests') {
        message = 'login.errorTooMany';
      } else if (
        code.includes('unavailable')
        || code.includes('offline')
        || /offline|unavailable|Failed to get document because the client is offline/i.test(raw)
      ) {
        message = 'auth.offline';
      } else if (/app.?check|recaptcha/i.test(`${code} ${raw}`)) {
        message = 'login.errorAppCheck';
      } else if (code === 'auth/recaptcha-not-enabled' || code === 'auth/missing-recaptcha-token' || code === 'auth/captcha-check-failed') {
        message = 'login.errorAppCheck';
      } else if (/profile|permission-denied/i.test(`${code} ${raw}`)) {
        message = 'login.errorProfile';
      }
      setAuthError(message);
      throw error;
    }
  };

  const clearAuthError = useCallback(() => {
    setAuthError('');
  }, []);

  const sendPasswordReset = async (email) => {
    setAuthError('');
    const trimmed = String(email ?? '').trim();
    if (!trimmed) {
      const message = 'login.resetErrorEmail';
      setAuthError(message);
      const err = new Error(message);
      err.code = 'auth/invalid-email';
      throw err;
    }

    try {
      await requestPasswordResetEmailRemote(trimmed);
    } catch (error) {
      const code = String(error?.code ?? '');
      const raw = String(error?.message ?? '');
      // Do not reveal whether the email exists (enumeration protection).
      if (code === 'auth/user-not-found') {
        return;
      }
      let message = 'login.resetErrorGeneric';
      if (code === 'auth/invalid-email') {
        message = 'login.resetErrorEmail';
      } else if (code === 'auth/too-many-requests') {
        message = 'login.errorTooMany';
      } else if (
        code.includes('network-request-failed')
        || /network-request-failed|Failed to fetch|NetworkError/i.test(raw)
      ) {
        message = 'login.errorNetwork';
      } else if (/app.?check|recaptcha/i.test(`${code} ${raw}`)) {
        message = 'login.errorAppCheck';
      }
      setAuthError(message);
      throw error;
    }
  };

  const signOut = async () => {
    setAuthError('');
    setUser(null);
    setProfile(null);
    setBillingAccount(null);
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
    // App Check cannot be torn down after init; Auth would attach a stale/broken
    // App Check token on the next signInWithEmailAndPassword in production.
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }
  };

  const refreshProfile = async () => {
    if (!user?.uid) return null;
    const nextProfile = await getUserProfile(db, user.uid);
    const blockReason = getLoginBlockReason(nextProfile);
    if (blockReason) {
      await rejectUnauthorizedSession(blockReason);
      return null;
    }
    setProfile(nextProfile);
    await loadBillingForProfile(nextProfile);
    return nextProfile;
  };

  const refreshBillingAccount = async () => {
    if (!profile) return null;
    return loadBillingForProfile(profile);
  };

  const value = useMemo(() => ({
    user,
    profile,
    billingAccount,
    loading,
    authError,
    clearAuthError,
    signIn,
    sendPasswordReset,
    signOut,
    refreshProfile,
    refreshBillingAccount,
    isAuthenticated: Boolean(user),
    hasAccess: Boolean(user && profile?.role && !getLoginBlockReason(profile)),
  }), [user, profile, billingAccount, loading, authError, clearAuthError, loadBillingForProfile, rejectUnauthorizedSession]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
