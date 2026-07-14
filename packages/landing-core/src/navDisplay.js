
export const NAV_SPECIALTY_CASE_OPTIONS = [
  { value: 'uppercase', label: 'Todas mayúsculas' },
  { value: 'capitalize', label: 'Solo la primera letra en mayúscula' },
];

const NAV_SPECIALTY_CASE_SET = new Set(NAV_SPECIALTY_CASE_OPTIONS.map((item) => item.value));

export function normalizeNavSpecialtyCase(value) {
  return NAV_SPECIALTY_CASE_SET.has(value) ? value : 'uppercase';
}

/** Formats navbar specialty text. Does not invent fallbacks. */
export function formatNavSpecialty(text, casing = 'uppercase') {
  const value = String(text ?? '').trim();
  if (!value) return '';

  if (normalizeNavSpecialtyCase(casing) === 'capitalize') {
    return value.charAt(0).toLocaleUpperCase('es') + value.slice(1);
  }

  return value.toLocaleUpperCase('es');
}
