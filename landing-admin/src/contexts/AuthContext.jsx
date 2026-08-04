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

const AuthContext = createContext(null);

function loginBlockErrorKey(reason) {
  if (reason === 'disabled') return 'login.errorDisabled';
  if (reason === 'demo') return 'login.errorDemo';
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
        err.code = blockReason === 'disabled' ? 'auth/user-disabled' : 'auth/demo-forbidden';
        throw err;
      }
    } catch (error) {
      if (error?.code === 'auth/demo-forbidden' || error?.code === 'auth/user-disabled') {
        throw error;
      }
      const code = error?.code ?? '';
      const message = code === 'auth/invalid-credential'
        ? 'login.errorInvalid'
        : code === 'auth/user-disabled'
          ? 'login.errorDisabled'
          : code === 'auth/recaptcha-not-enabled' || code === 'auth/missing-recaptcha-token'
            ? 'login.errorGeneric'
            : code === 'auth/captcha-check-failed'
              ? 'login.errorGeneric'
              : 'login.errorGeneric';
      setAuthError(message);
      throw error;
    }
  };

  const signOut = async () => {
    setAuthError('');
    await firebaseSignOut(auth);
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
    signIn,
    signOut,
    refreshProfile,
    refreshBillingAccount,
    isAuthenticated: Boolean(user),
    hasAccess: Boolean(user && profile?.role && !getLoginBlockReason(profile)),
  }), [user, profile, billingAccount, loading, authError, loadBillingForProfile, rejectUnauthorizedSession]);

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
