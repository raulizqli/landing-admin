import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import LegalPublicPage from './components/LegalPublicPage.jsx'
import MirrorPreviewFrame from './components/MirrorPreviewFrame.jsx'
import { LocaleProvider } from './i18n/LocaleContext.jsx'
import { isPublicLegalPath } from './utils/platformLegal.js'

const pathname = window.location.pathname
const isPreviewFrame = pathname.startsWith('/app/preview-frame')
const isLegalPublic = isPublicLegalPath(pathname)

function renderLegalPublicApp() {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <LocaleProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/privacy" element={<LegalPublicPage kind="privacy" />} />
            <Route path="/terms" element={<LegalPublicPage kind="terms" />} />
            <Route path="/data-deletion" element={<LegalPublicPage kind="dataDeletion" />} />
          </Routes>
        </BrowserRouter>
      </LocaleProvider>
    </StrictMode>,
  )
}

async function bootAuthenticatedAdmin() {
  // Side-effect: FIREBASE_APPCHECK_DEBUG_TOKEN before initializeAppCheck().
  await import('./utils/appCheck.js')
  const [{ initializeRecaptchaConfig }, { auth }, { AuthProvider }, { default: AppRouter }] = await Promise.all([
    import('firebase/auth'),
    import('./firebase.js'),
    import('./contexts/AuthContext.jsx'),
    import('./AppRouter.jsx'),
  ])

  // App Check starts after login (AuthContext / callables). On /login it is not needed
  // and a misregistered reCAPTCHA for the prod domain breaks signInWithEmailAndPassword.
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

if (isPreviewFrame) {
  // Preview iframe: no Auth, App Check, or reCAPTCHA — parent already owns the session.
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/app/preview-frame" element={<MirrorPreviewFrame />} />
        </Routes>
      </BrowserRouter>
    </StrictMode>,
  )
} else if (isLegalPublic) {
  // Meta / future providers crawl these URLs without a session.
  // Do not mount AuthProvider, App Check, or reCAPTCHA here.
  renderLegalPublicApp()
} else {
  bootAuthenticatedAdmin()
}
