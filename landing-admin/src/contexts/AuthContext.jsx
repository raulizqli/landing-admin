import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { ensureBootstrapRootProfile } from '../utils/userAccess';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setLoading(true);
      setAuthError('');

      try {
        if (!nextUser) {
          setUser(null);
          setProfile(null);
          return;
        }

        setUser(nextUser);

        const nextProfile = await ensureBootstrapRootProfile(db, nextUser);
        setProfile(nextProfile);
      } catch (error) {
        console.error('Error al cargar el perfil de usuario:', error);
        setAuthError('No se pudo cargar tu perfil de acceso.');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, password) => {
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      const code = error?.code ?? '';
      const message = code === 'auth/invalid-credential'
        ? 'Email o contraseña incorrectos.'
        : code === 'auth/recaptcha-not-enabled' || code === 'auth/missing-recaptcha-token'
          ? 'Firebase pide reCAPTCHA Enterprise para email/contraseña. Actívalo en la consola o desactiva la protección anti-bots del proveedor Email.'
        : code === 'auth/captcha-check-failed'
          ? 'Verificación anti-bots fallida. Prueba otro navegador o desactiva reCAPTCHA en Authentication → Email/Password.'
        : 'No se pudo iniciar sesión. Revisa tus credenciales.';
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
    return nextProfile;
  };

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    authError,
    signIn,
    signOut,
    refreshProfile,
    isAuthenticated: Boolean(user),
    hasAccess: Boolean(user && profile?.role),
  }), [user, profile, loading, authError]);

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
