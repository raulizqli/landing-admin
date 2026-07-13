export function getPageLoadErrorMessage(error) {
  const code = String(error?.code ?? '').toLowerCase();
  const message = String(error?.message ?? '');

  if (
    message.includes('appCheck')
    || message.includes('AppCheck')
    || message.includes('App Check')
    || message.includes('recaptcha')
    || message.includes('ReCAPTCHA')
  ) {
    return 'App Check / reCAPTCHA rechazó la petición. Añade el dominio del template (ej. landing-template-9452e.web.app) en reCAPTCHA v3 y en App Check, o desactiva App Check en el template para la demo.';
  }

  if (
    code === 'permission-denied'
    || message.includes('Firestore API has not been used')
    || message.includes('PERMISSION_DENIED')
  ) {
    return 'Firestore denegó el acceso. Revisa reglas (pages debe permitir lectura pública), App Check en modo Enforce, y que el dominio esté autorizado en la API key.';
  }

  if (
    code === 'unavailable'
    || code === 'failed-precondition'
    || message.includes('client is offline')
    || message.includes('Could not reach Cloud Firestore backend')
  ) {
    return 'No se pudo conectar con Firestore. Suele ser App Check Enforce, dominio ausente en reCAPTCHA, o restricciones de la API key. Para la demo, deja App Check desactivado en el template.';
  }

  if (code === 'not-found') {
    return 'No se encontró el proyecto o la base de datos de Firestore configurada en VITE_FIREBASE_PROJECT_ID.';
  }

  return `No se pudo cargar la información (${code || 'sin código'}). Inténtalo de nuevo más tarde.`;
}
