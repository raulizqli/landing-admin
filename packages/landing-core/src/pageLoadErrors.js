
export function getPageLoadErrorMessage(error) {
  const code = String(error?.code ?? '').toLowerCase();
  const message = String(error?.message ?? '');

  if (
    code === 'permission-denied'
    || message.includes('Firestore API has not been used')
    || message.includes('PERMISSION_DENIED')
  ) {
    return 'Firestore no está habilitado en este proyecto Firebase. Ve a Firebase Console → Build → Firestore Database → Crear base de datos, y vuelve a intentarlo.';
  }

  if (
    code === 'unavailable'
    || code === 'failed-precondition'
    || message.includes('client is offline')
    || message.includes('Could not reach Cloud Firestore backend')
  ) {
    return 'No se pudo conectar con Firestore. Comprueba que la base de datos esté creada, que las reglas permitan lectura y que tengas conexión a internet.';
  }

  if (code === 'not-found') {
    return 'No se encontró el proyecto o la base de datos de Firestore configurada en VITE_FIREBASE_PROJECT_ID.';
  }

  return 'No se pudo cargar la información. Inténtalo de nuevo más tarde.';
}
