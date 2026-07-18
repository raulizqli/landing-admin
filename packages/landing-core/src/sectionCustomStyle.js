import { parseColorToHex } from './sectionBackground.js';

export const SECTION_CUSTOM_SHADOW_OPTIONS = [
  { value: 'none', label: 'Sin sombra' },
  { value: 'soft', label: 'Suave' },
  { value: 'medium', label: 'Media' },
];

export const SECTION_CUSTOM_HOVER_OPTIONS = [
  { value: 'none', label: 'Ninguno' },
  { value: 'lift', label: 'Elevar' },
  { value: 'opacity', label: 'Opacidad' },
];

export const SECTION_CUSTOM_ENTRANCE_OPTIONS = [
  { value: 'none', label: 'Ninguna' },
  { value: 'fade', label: 'Fundido' },
  { value: 'slideUp', label: 'Subir' },
];

export const SECTION_CUSTOM_GAP_OPTIONS = [
  { value: 'tight', label: 'Compacto' },
  { value: 'normal', label: 'Normal' },
  { value: 'relaxed', label: 'Amplio' },
];

const SHADOW_VALUES = new Set(SECTION_CUSTOM_SHADOW_OPTIONS.map((item) => item.value));
const HOVER_VALUES = new Set(SECTION_CUSTOM_HOVER_OPTIONS.map((item) => item.value));
const ENTRANCE_VALUES = new Set(SECTION_CUSTOM_ENTRANCE_OPTIONS.map((item) => item.value));
const GAP_VALUES = new Set(SECTION_CUSTOM_GAP_OPTIONS.map((item) => item.value));

export function createEmptySectionCustomStyle(overrides = {}) {
  return normalizeSectionCustomStyle({
    backgroundColor: '#FFFFFF',
    borderColor: '#2A342D',
    borderOpacity: 0.1,
    borderWidth: 1,
    borderRadius: 16,
    shadow: 'soft',
    hover: 'lift',
    entrance: 'fade',
    gap: 'normal',
    ...overrides,
  });
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function clampOpacity(value, fallback = 0.1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(1, Math.max(0, Math.round(n * 100) / 100));
}

export function normalizeSectionCustomStyle(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    backgroundColor: parseColorToHex(source.backgroundColor, '#FFFFFF'),
    borderColor: parseColorToHex(source.borderColor, '#2A342D'),
    borderOpacity: clampOpacity(source.borderOpacity, 0.1),
    borderWidth: clampNumber(source.borderWidth, 0, 4, 1),
    borderRadius: clampNumber(source.borderRadius, 0, 40, 16),
    shadow: SHADOW_VALUES.has(source.shadow) ? source.shadow : 'soft',
    hover: HOVER_VALUES.has(source.hover) ? source.hover : 'lift',
    entrance: ENTRANCE_VALUES.has(source.entrance) ? source.entrance : 'fade',
    gap: GAP_VALUES.has(source.gap) ? source.gap : 'normal',
  };
}

/** Hex + opacity → rgba() for borders. */
export function customStyleBorderRgba(style) {
  const normalized = normalizeSectionCustomStyle(style);
  const hex = normalized.borderColor.replace('#', '');
  const full = hex.length === 3
    ? hex.split('').map((c) => `${c}${c}`).join('')
    : hex.slice(0, 6);
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${normalized.borderOpacity})`;
}
