import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initializeRecaptchaConfig } from 'firebase/auth'
import './index.css'
import AppRouter from './AppRouter.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { LocaleProvider } from './i18n/LocaleContext.jsx'
import { auth } from './firebase.js'

// App Check se inicia tras login (AuthContext / callables). En el /login no hace falta
// y un reCAPTCHA mal registrado para el dominio de prod rompe signInWithEmailAndPassword.

// Necesario si en Firebase Console activas "protección reCAPTCHA" para email/contraseña.
initializeRecaptchaConfig(auth).catch((error) => {
  if (import.meta.env.DEV) {
    console.info('[Auth] reCAPTCHA Enterprise no activo (normal si no lo configuraste):', error?.message);
  }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LocaleProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </LocaleProvider>
  </StrictMode>,
)
