
export const SECTION_THEME_KEYS = [
  'page',
  'nav',
  'preHero',
  'hero',
  'about',
  'services',
  'catalog',
  'gallery',
  'video',
  'testimonials',
  'blog',
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

/** Pastel primaries (and a few neutrals) for section backgrounds / text accents. */
export const BRAND_COLOR_PRESETS = [
  { value: '#F4F1EA', label: 'Crema' },
  { value: '#FFFFFF', label: 'Blanco' },
  { value: '#F7E9E3', label: 'Melocotón pastel' },
  { value: '#F3E8F0', label: 'Lila pastel' },
  { value: '#E8EEF6', label: 'Azul pastel' },
  { value: '#E7F2EC', label: 'Menta pastel' },
  { value: '#F4F0D9', label: 'Limón pastel' },
  { value: '#F6E6E8', label: 'Rosa pastel' },
  { value: '#E8E4DB', label: 'Arena' },
  { value: '#DFE8E2', label: 'Sage claro' },
  { value: '#EDE4D7', label: 'Arena cálida' },
  { value: '#DCE8F0', label: 'Cielo pastel' },
  { value: '#4A5D4E', label: 'Sage' },
  { value: '#2A342D', label: 'Verde oscuro' },
];

export const TEXT_COLOR_PRESETS = [
  { value: '#2A342D', label: 'Verde oscuro' },
  { value: '#4A5D4E', label: 'Sage' },
  { value: '#3D4A5C', label: 'Azul grisáceo' },
  { value: '#5C4A4A', label: 'Marsala suave' },
  { value: '#4A4558', label: 'Lavanda oscuro' },
  { value: '#3F5148', label: 'Bosque' },
  { value: '#5A5040', label: 'Café suave' },
  { value: '#374151', label: 'Gris pizarra' },
  { value: '#1F2937', label: 'Carbón' },
  { value: '#FFFFFF', label: 'Blanco' },
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
    textColor: '#2A342D',
    useGradient: false,
    gradientColor: '#E8E4DB',
    gradientDirection: 'to-bottom',
  },
  nav: {
    backgroundColor: '#F4F1EA',
    textColor: '#2A342D',
    useGradient: false,
    gradientColor: '#E8E4DB',
    gradientDirection: 'to-bottom',
    backgroundOpacity: 90,
  },
  preHero: {
    backgroundColor: '#F4F1EA',
    textColor: '#2A342D',
    useGradient: false,
    gradientColor: '#E8E4DB',
    gradientDirection: 'to-bottom',
  },
  hero: {
    backgroundColor: '#E8E4DB',
    textColor: '#FFFFFF',
    useGradient: false,
    gradientColor: '#F4F1EA',
    gradientDirection: 'to-bottom',
  },
  about: {
    backgroundColor: '#FFFFFF',
    textColor: '#2A342D',
    useGradient: false,
    gradientColor: '#F4F1EA',
    gradientDirection: 'to-bottom',
  },
  services: {
    backgroundColor: '#F4F1EA',
    textColor: '#2A342D',
    useGradient: false,
    gradientColor: '#E8E4DB',
    gradientDirection: 'to-bottom',
  },
  catalog: {
    backgroundColor: '#FFFFFF',
    textColor: '#2A342D',
    useGradient: false,
    gradientColor: '#F4F1EA',
    gradientDirection: 'to-bottom',
  },
  gallery: {
    backgroundColor: '#F4F1EA',
    textColor: '#2A342D',
    useGradient: false,
    gradientColor: '#E8E4DB',
    gradientDirection: 'to-bottom',
  },
  video: {
    backgroundColor: '#F4F1EA',
    textColor: '#2A342D',
    useGradient: false,
    gradientColor: '#E8E4DB',
    gradientDirection: 'to-bottom',
  },
  testimonials: {
    backgroundColor: '#FFFFFF',
    textColor: '#2A342D',
    useGradient: false,
    gradientColor: '#F4F1EA',
    gradientDirection: 'to-bottom',
  },
  blog: {
    backgroundColor: '#F4F1EA',
    textColor: '#2A342D',
    useGradient: false,
    gradientColor: '#E8E4DB',
    gradientDirection: 'to-bottom',
  },
  contact: {
    backgroundColor: '#F4F1EA',
    textColor: '#2A342D',
    useGradient: false,
    gradientColor: '#E8E4DB',
    gradientDirection: 'to-bottom',
  },
  social: {
    backgroundColor: '#FFFFFF',
    textColor: '#2A342D',
    useGradient: false,
    gradientColor: '#F4F1EA',
    gradientDirection: 'to-bottom',
  },
  footer: {
    backgroundColor: '#F4F1EA',
    textColor: '#2A342D',
    useGradient: false,
    gradientColor: '#E8E4DB',
    gradientDirection: 'to-bottom',
  },
};

function componentToHex(value) {
  const hex = Math.max(0, Math.min(255, Math.round(Number(value)))).toString(16).padStart(2, '0');
  return hex.toUpperCase();
}

/** Accepts #RGB, #RRGGBB, rgb(), rgba(). Returns #RRGGBB or fallback. */
export function parseColorToHex(value, fallback = '#F4F1EA') {
  const raw = String(value ?? '').trim();
  if (!raw) return fallback;

  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) return raw.toUpperCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(raw)) {
    const hex = raw.slice(1);
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase();
  }

  const rgbMatch = raw.match(/^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*[0-9.]+\s*)?\)$/i);
  if (rgbMatch) {
    return `#${componentToHex(rgbMatch[1])}${componentToHex(rgbMatch[2])}${componentToHex(rgbMatch[3])}`;
  }

  return fallback;
}

function normalizeHexColor(value, fallback) {
  return parseColorToHex(value, fallback);
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
    textColor: normalizeHexColor(next.textColor ?? next.color, defaults.textColor),
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
  const foreground = { color: normalized.textColor };

  if (isNav) {
    const opacity = normalized.backgroundOpacity / 100;
    const style = {
      ...foreground,
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
    return { ...foreground, background: buildGradientBackground(normalized) };
  }

  return { ...foreground, backgroundColor: normalized.backgroundColor };
}

export function updateSectionThemeInForm(formData, sectionKey, partial) {
  const current = normalizeSectionThemes(formData?.sectionThemes);
  const mergedPartial = { ...partial };
  if (mergedPartial.backgroundColor) {
    mergedPartial.backgroundColor = parseColorToHex(mergedPartial.backgroundColor, current[sectionKey].backgroundColor);
  }
  if (mergedPartial.gradientColor) {
    mergedPartial.gradientColor = parseColorToHex(mergedPartial.gradientColor, current[sectionKey].gradientColor);
  }
  if (mergedPartial.textColor) {
    mergedPartial.textColor = parseColorToHex(mergedPartial.textColor, current[sectionKey].textColor);
  }

  return {
    ...formData,
    sectionThemes: {
      ...current,
      [sectionKey]: {
        ...current[sectionKey],
        ...mergedPartial,
      },
    },
  };
}
