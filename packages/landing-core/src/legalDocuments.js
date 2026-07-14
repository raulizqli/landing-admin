import { normalizeLabelLanguage } from './labels.js';

/** Default Terms of Use / Privacy Policy copy by label language. */
export const DEFAULT_LEGAL_DOCUMENTS = {
  es: {
    termsOfUse: {
      title: 'Términos de uso',
      body: [
        'Este sitio web tiene fines informativos sobre servicios profesionales. Al navegarlo o usar los formularios de contacto, aceptas estos términos.',
        'La información publicada no sustituye una consulta personalizada ni constituye asesoramiento profesional vinculado hasta que exista una relación formal de servicio.',
        'Reservamos el derecho de actualizar contenidos, horarios y tarifas. El uso indebido del sitio (spam, scraping abusivo u otros usos ilícitos) está prohibido.',
        'Para dudas sobre estos términos, contacta a través de los canales publicados en esta página.',
      ].join('\n\n'),
    },
    privacyPolicy: {
      title: 'Política de privacidad',
      body: [
        'Respetamos tu privacidad. Los datos que nos envíes (nombre, correo, teléfono u otros datos que indiques en el contacto) se usan únicamente para responder a tu solicitud y gestionar la relación profesional, si la hubiera.',
        'No vendemos tus datos personales. Podemos compartir información solo cuando sea necesario para prestar el servicio (por ejemplo, herramientas de mensajería o correo) o cuando la ley lo exija.',
        'Este sitio puede usar analíticas agregadas (p. ej. Google Analytics) para entender el uso general de las páginas. Puedes limitar cookies desde la configuración de tu navegador.',
        'Para ejercer derechos de acceso, rectificación o eliminación de tus datos, escríbenos a los medios de contacto publicados en esta página.',
      ].join('\n\n'),
    },
  },
  en: {
    termsOfUse: {
      title: 'Terms of use',
      body: [
        'This website provides information about professional services. By browsing it or using the contact options, you accept these terms.',
        'Published information does not replace personalized advice and does not create a formal professional relationship by itself.',
        'We may update content, hours, and fees. Misuse of the site (spam, abusive scraping, or other unlawful use) is prohibited.',
        'For questions about these terms, contact us through the channels listed on this page.',
      ].join('\n\n'),
    },
    privacyPolicy: {
      title: 'Privacy policy',
      body: [
        'We respect your privacy. Data you send (name, email, phone, or other details shared via contact) is used only to respond to your request and manage any professional relationship that follows.',
        'We do not sell your personal data. We may share information only when needed to provide the service (for example messaging or email tools) or when required by law.',
        'This site may use aggregated analytics (e.g. Google Analytics) to understand general page usage. You can limit cookies in your browser settings.',
        'To request access, correction, or deletion of your data, write to us using the contact options on this page.',
      ].join('\n\n'),
    },
  },
};

export const LEGAL_DOCUMENT_KINDS = ['termsOfUse', 'privacyPolicy'];

function fieldPrefix(kind) {
  return kind === 'privacyPolicy' ? 'privacyPolicy' : 'termsOfUse';
}

export function getDefaultLegalDocument(kind, language = 'es') {
  const lang = normalizeLabelLanguage(language);
  const doc = DEFAULT_LEGAL_DOCUMENTS[lang]?.[kind] || DEFAULT_LEGAL_DOCUMENTS.es.termsOfUse;
  return {
    title: doc.title,
    body: doc.body,
  };
}

/** @returns {{ enabled: boolean, title: string, body: string }} */
export function resolveLegalDocument(data = {}, kind = 'termsOfUse') {
  const prefix = fieldPrefix(kind);
  const defaults = getDefaultLegalDocument(kind, data?.labelLanguage);
  const title = String(data?.[`${prefix}Title`] ?? '').trim();
  const body = String(data?.[`${prefix}Body`] ?? '').trim();

  return {
    enabled: data?.[`${prefix}Enabled`] !== false,
    title: title || defaults.title,
    body: body || defaults.body,
  };
}

export function getEnabledLegalDocuments(data = {}) {
  return LEGAL_DOCUMENT_KINDS
    .map((kind) => ({ kind, ...resolveLegalDocument(data, kind) }))
    .filter((doc) => doc.enabled);
}

export function normalizeLegalDocuments(data = {}) {
  const next = { ...data };
  next.termsOfUseEnabled = next.termsOfUseEnabled !== false;
  next.privacyPolicyEnabled = next.privacyPolicyEnabled !== false;
  next.termsOfUseTitle = String(next.termsOfUseTitle ?? '').trim();
  next.termsOfUseBody = String(next.termsOfUseBody ?? '');
  next.privacyPolicyTitle = String(next.privacyPolicyTitle ?? '').trim();
  next.privacyPolicyBody = String(next.privacyPolicyBody ?? '');
  return next;
}
