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

const AuthContext = createContext(null);

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
    if (!account) {
      try {
        const remote = await ensureBillingAccountRemote();
        account = remote ? normalizeBillingAccount(remote.id || accountId, remote) : null;
      } catch {
        account = null;
      }
    }
    setBillingAccount(account);
    return account;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true);
      setAuthError('');

      try {
        if (!nextUser) {
          setUser(null);
          setProfile(null);
          setBillingAccount(null);
          return;
        }

        setUser(nextUser);

        const nextProfile = await ensureBootstrapRootProfile(db, nextUser);
        setProfile(nextProfile);
        await loadBillingForProfile(nextProfile);
      } catch (error) {
        console.error('Error al cargar el perfil de usuario:', error);
        const code = String(error?.code ?? '');
        const offline = code.includes('unavailable')
          || code.includes('offline')
          || /offline|unavailable|Failed to get document because the client is offline/i.test(String(error?.message ?? ''));
        setAuthError(offline ? 'auth.offline' : 'auth.profile');
        setProfile(null);
        setBillingAccount(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [loadBillingForProfile]);

  const signIn = async (email, password) => {
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      const code = error?.code ?? '';
      const message = code === 'auth/invalid-credential'
        ? 'login.errorInvalid'
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
    hasAccess: Boolean(user && profile?.role),
  }), [user, profile, billingAccount, loading, authError, loadBillingForProfile]);

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
