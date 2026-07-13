
export const SECTION_THEME_KEYS = [
  'page',
  'nav',
  'preHero',
  'hero',
  'about',
  'services',
  'catalog',
  'video',
  'testimonials',
  'contact',
  'social',
  'footer',
];

export const GRADIENT_DIRECTIONS = [
  { value: 'to-bottom', label: 'Arriba → abajo' },
  { value: 'to-top', label: 'Abajo → arriba' },
  { value: 'to-right', label: 'Izquierda → derecha' },
  { value: 'to-left', label: 'Derecha → izquierda' },
  { value: 'to-bottom-right', label: 'Diagonal ↘' },
  { value: 'to-bottom-left', label: 'Diagonal ↙' },
  { value: 'to-top-right', label: 'Diagonal ↗' },
  { value: 'to-top-left', label: 'Diagonal ↖' },
];

export const BRAND_COLOR_PRESETS = [
  { value: '#F4F1EA', label: 'Crema' },
  { value: '#FFFFFF', label: 'Blanco' },
  { value: '#E8E4DB', label: 'Arena' },
  { value: '#4A5D4E', label: 'Sage' },
  { value: '#2A342D', label: 'Verde oscuro' },
];

const GRADIENT_CSS = {
  'to-top': 'to top',
  'to-bottom': 'to bottom',
  'to-left': 'to left',
  'to-right': 'to right',
  'to-top-right': 'to top right',
  'to-top-left': 'to top left',
  'to-bottom-right': 'to bottom right',
  'to-bottom-left': 'to bottom left',
};

const DEFAULT_SECTION_THEMES = {
  page: {
    backgroundColor: '#F4F1EA',
    useGradient: false,
    gradientColor: '#E8E4DB',
    gradientDirection: 'to-bottom',
  },
  nav: {
    backgroundColor: '#F4F1EA',
    useGradient: false,
    gradientColor: '#E8E4DB',
    gradientDirection: 'to-bottom',
    backgroundOpacity: 90,
  },
  preHero: {
    backgroundColor: '#F4F1EA',
    useGradient: false,
    gradientColor: '#E8E4DB',
    gradientDirection: 'to-bottom',
  },
  hero: {
    backgroundColor: '#E8E4DB',
    useGradient: false,
    gradientColor: '#F4F1EA',
    gradientDirection: 'to-bottom',
  },
  about: {
    backgroundColor: '#FFFFFF',
    useGradient: false,
    gradientColor: '#F4F1EA',
    gradientDirection: 'to-bottom',
  },
  services: {
    backgroundColor: '#F4F1EA',
    useGradient: false,
    gradientColor: '#E8E4DB',
    gradientDirection: 'to-bottom',
  },
  catalog: {
    backgroundColor: '#FFFFFF',
    useGradient: false,
    gradientColor: '#F4F1EA',
    gradientDirection: 'to-bottom',
  },
  video: {
    backgroundColor: '#F4F1EA',
    useGradient: false,
    gradientColor: '#E8E4DB',
    gradientDirection: 'to-bottom',
  },
  testimonials: {
    backgroundColor: '#FFFFFF',
    useGradient: false,
    gradientColor: '#F4F1EA',
    gradientDirection: 'to-bottom',
  },
  contact: {
    backgroundColor: '#F4F1EA',
    useGradient: false,
    gradientColor: '#E8E4DB',
    gradientDirection: 'to-bottom',
  },
  social: {
    backgroundColor: '#FFFFFF',
    useGradient: false,
    gradientColor: '#F4F1EA',
    gradientDirection: 'to-bottom',
  },
  footer: {
    backgroundColor: '#F4F1EA',
    useGradient: false,
    gradientColor: '#E8E4DB',
    gradientDirection: 'to-bottom',
  },
};

function normalizeHexColor(value, fallback) {
  const raw = String(value ?? '').trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) return raw.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(raw)) {
    const hex = raw.slice(1);
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase();
  }
  return fallback;
}

function normalizeGradientDirection(value, fallback) {
  return GRADIENT_CSS[value] ? value : fallback;
}

function normalizeOpacity(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(100, Math.max(0, Math.round(parsed)));
}

export function normalizeSectionTheme(theme = {}, sectionKey) {
  const defaults = DEFAULT_SECTION_THEMES[sectionKey] ?? DEFAULT_SECTION_THEMES.page;
  const next = { ...defaults, ...(theme && typeof theme === 'object' ? theme : {}) };

  return {
    backgroundColor: normalizeHexColor(next.backgroundColor, defaults.backgroundColor),
    useGradient: next.useGradient === true,
    gradientColor: normalizeHexColor(next.gradientColor, defaults.gradientColor),
    gradientDirection: normalizeGradientDirection(next.gradientDirection, defaults.gradientDirection),
    ...(sectionKey === 'nav'
      ? { backgroundOpacity: normalizeOpacity(next.backgroundOpacity, defaults.backgroundOpacity) }
      : {}),
  };
}

export function normalizeSectionThemes(themes = {}) {
  const source = themes && typeof themes === 'object' ? themes : {};
  return SECTION_THEME_KEYS.reduce((acc, key) => {
    acc[key] = normalizeSectionTheme(source[key], key);
    return acc;
  }, {});
}

export function getSectionTheme(data, sectionKey) {
  const themes = normalizeSectionThemes(data?.sectionThemes);
  return themes[sectionKey] ?? normalizeSectionTheme({}, sectionKey);
}

export function createDefaultSectionThemes() {
  return normalizeSectionThemes({});
}

export function hexToRgba(hex, alpha) {
  const normalized = normalizeHexColor(hex, '#F4F1EA').slice(1);
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildGradientBackground(theme) {
  const direction = GRADIENT_CSS[theme.gradientDirection] ?? GRADIENT_CSS['to-bottom'];
  return `linear-gradient(${direction}, ${theme.backgroundColor}, ${theme.gradientColor})`;
}

export function buildSectionBackgroundStyle(theme, { sectionKey = 'page' } = {}) {
  const normalized = normalizeSectionTheme(theme, sectionKey);
  const isNav = sectionKey === 'nav';

  if (isNav) {
    const opacity = normalized.backgroundOpacity / 100;
    const style = {
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    };

    if (normalized.useGradient) {
      const direction = GRADIENT_CSS[normalized.gradientDirection] ?? GRADIENT_CSS['to-bottom'];
      style.background = `linear-gradient(${direction}, ${hexToRgba(normalized.backgroundColor, opacity)}, ${hexToRgba(normalized.gradientColor, opacity)})`;
    } else {
      style.backgroundColor = hexToRgba(normalized.backgroundColor, opacity);
    }

    return style;
  }

  if (normalized.useGradient) {
    return { background: buildGradientBackground(normalized) };
  }

  return { backgroundColor: normalized.backgroundColor };
}

export function updateSectionThemeInForm(formData, sectionKey, partial) {
  const current = normalizeSectionThemes(formData?.sectionThemes);
  return {
    ...formData,
    sectionThemes: {
      ...current,
      [sectionKey]: {
        ...current[sectionKey],
        ...partial,
      },
    },
  };
}
