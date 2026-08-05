import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { initializeRecaptchaConfig } from 'firebase/auth'
import './index.css'
import AppRouter from './AppRouter.jsx'
import MirrorPreviewFrame from './components/MirrorPreviewFrame.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { LocaleProvider } from './i18n/LocaleContext.jsx'
import { auth } from './firebase.js'
// Side-effect: set FIREBASE_APPCHECK_DEBUG_TOKEN before any initializeAppCheck().
import './utils/appCheck.js'

const isPreviewFrame = window.location.pathname.startsWith('/app/preview-frame')

// Preview iframe: no Auth, App Check, or reCAPTCHA — parent already owns the session.
// Full CMS bootstrap here caused redirects to / /login and "refused to connect".
if (isPreviewFrame) {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/app/preview-frame" element={<MirrorPreviewFrame />} />
        </Routes>
      </BrowserRouter>
    </StrictMode>,
  )
} else {
  // App Check starts after login (AuthContext / callables). On /login it is not needed
  // and a misregistered reCAPTCHA for the prod domain breaks signInWithEmailAndPassword.

  // Required if Firebase Console has reCAPTCHA protection for email/password.
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
}
