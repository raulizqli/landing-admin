/**
 * Contact inquiry form model for public landings.
 * Keep field names English (page model).
 */

export const DEFAULT_CONTACT_FORM_PROJECT_TYPES = [
  { value: 'recording', labelEs: 'Grabación', labelEn: 'Recording' },
  { value: 'mixing_mastering', labelEs: 'Mezcla y mastering', labelEn: 'Mixing & mastering' },
  { value: 'production', labelEs: 'Producción y arreglos', labelEn: 'Production & arrangement' },
  { value: 'rehearsal', labelEs: 'Ensayo', labelEn: 'Rehearsal' },
  { value: 'podcast_content', labelEs: 'Podcast / contenido', labelEn: 'Podcast / content' },
  { value: 'other', labelEs: 'Otro', labelEn: 'Other' },
];

export function createEmptyProjectType(overrides = {}) {
  return {
    value: '',
    labelEs: '',
    labelEn: '',
    ...overrides,
  };
}

export function normalizeContactFormProjectType(item = {}, index = 0) {
  const value = String(item.value ?? item.id ?? '').trim() || `project_type_${index + 1}`;
  return {
    value,
    labelEs: String(item.labelEs ?? item.label ?? item.label_es ?? '').trim(),
    labelEn: String(item.labelEn ?? item.label_en ?? '').trim(),
  };
}

export function normalizeContactFormProjectTypes(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return DEFAULT_CONTACT_FORM_PROJECT_TYPES.map((item) => ({ ...item }));
  }
  return items
    .map((item, index) => normalizeContactFormProjectType(item, index))
    .filter((item) => item.labelEs || item.labelEn);
}

export function resolveContactFormProjectTypes(data, language = 'es') {
  const types = normalizeContactFormProjectTypes(data?.contactFormProjectTypes);
  const lang = language === 'en' ? 'en' : 'es';
  return types.map((item) => ({
    value: item.value,
    label: lang === 'en'
      ? (item.labelEn || item.labelEs || item.value)
      : (item.labelEs || item.labelEn || item.value),
  }));
}

export function isContactFormEnabled(data) {
  return data?.contactFormEnabled === true;
}

const MAX_NAME = 120;
const MAX_MESSAGE = 2000;
const MAX_CONTACT = 120;
const MAX_PROJECT_TYPE = 80;

export function sanitizeInquiryField(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

/**
 * Build WhatsApp prefill text from inquiry fields.
 */
export function buildInquiryWhatsAppMessage({
  name,
  projectTypeLabel,
  contact,
  message,
  baseMessage = '',
} = {}) {
  const lines = [
    String(baseMessage ?? '').trim(),
    '',
    name ? `Nombre: ${name}` : '',
    projectTypeLabel ? `Tipo de proyecto: ${projectTypeLabel}` : '',
    contact ? `Contacto: ${contact}` : '',
    message ? `Mensaje: ${message}` : '',
  ].filter((line, index, arr) => {
    if (line !== '') return true;
    // keep a single blank after base message
    return index === 1 && Boolean(arr[0]);
  });
  return lines.join('\n').trim();
}

export function validateInquiryPayload(raw = {}) {
  const name = sanitizeInquiryField(raw.name, MAX_NAME);
  const projectType = sanitizeInquiryField(raw.projectType, MAX_PROJECT_TYPE);
  const contact = sanitizeInquiryField(raw.contact, MAX_CONTACT);
  const message = sanitizeInquiryField(raw.message, MAX_MESSAGE);
  const honeypot = String(raw.website ?? raw.honeypot ?? '').trim();

  const errors = [];
  if (honeypot) errors.push('spam');
  if (!name) errors.push('name');
  if (!projectType) errors.push('projectType');
  if (!contact) errors.push('contact');
  if (!message) errors.push('message');

  return {
    ok: errors.length === 0,
    errors,
    data: { name, projectType, contact, message },
  };
}
