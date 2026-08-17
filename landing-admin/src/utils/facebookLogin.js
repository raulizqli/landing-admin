const FACEBOOK_APP_ID = String(import.meta.env.VITE_FACEBOOK_APP_ID ?? '').trim();
const GRAPH_VERSION = 'v21.0';

const LOGIN_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_read_user_content',
  'instagram_basic',
].join(',');

export function isFacebookLoginConfigured() {
  return Boolean(FACEBOOK_APP_ID);
}

export function getFacebookAppId() {
  return FACEBOOK_APP_ID;
}

function loadFacebookSdk() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Facebook Login solo funciona en el navegador.'));
  }
  if (!FACEBOOK_APP_ID) {
    return Promise.reject(new Error('Falta VITE_FACEBOOK_APP_ID en el admin.'));
  }
  if (window.FB) return Promise.resolve(window.FB);

  return new Promise((resolve, reject) => {
    window.fbAsyncInit = function fbAsyncInit() {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: false,
        version: GRAPH_VERSION,
      });
      resolve(window.FB);
    };

    const existing = document.getElementById('facebook-jssdk');
    if (existing) return;

    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.async = true;
    script.src = 'https://connect.facebook.net/es_LA/sdk.js';
    script.onerror = () => reject(new Error('No se pudo cargar el SDK de Facebook.'));
    document.body.appendChild(script);
  });
}

export async function loginWithFacebookPages() {
  const FB = await loadFacebookSdk();
  return new Promise((resolve, reject) => {
    FB.login((response) => {
      const token = String(response?.authResponse?.accessToken ?? '').trim();
      if (token) {
        resolve(token);
        return;
      }
      if (response?.status === 'unknown' || response?.status === 'not_authorized') {
        reject(new Error('Inicio de sesión de Facebook cancelado.'));
        return;
      }
      reject(new Error('No se obtuvo acceso a Facebook. Revisa permisos de Páginas.'));
    }, {
      scope: LOGIN_SCOPES,
      return_scopes: true,
      auth_type: 'rerequest',
    });
  });
}
