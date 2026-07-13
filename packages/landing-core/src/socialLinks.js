
export const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram', prefix: 'https://instagram.com/', placeholder: 'usuario' },
  { key: 'whatsapp', label: 'WhatsApp', prefix: 'https://wa.me/', placeholder: '525512345678' },
  { key: 'facebook', label: 'Facebook', prefix: 'https://facebook.com/', placeholder: 'page' },
  { key: 'linkedin', label: 'LinkedIn', prefix: 'https://linkedin.com/in/', placeholder: 'usuario' },
  { key: 'doctoralia', label: 'Doctoralia', prefix: 'https://www.doctoralia.com.mx/', placeholder: 'nombre-apellido/especialidad' },
  { key: 'tiktok', label: 'TikTok', prefix: 'https://tiktok.com/@', placeholder: 'usuario' },
  { key: 'youtube', label: 'YouTube', prefix: 'https://youtube.com/@', placeholder: 'canal' },
];

function stripAt(value) {
  return String(value).replace(/^@+/, '').trim();
}

export function parseSocialHandle(stored, network) {
  const raw = String(stored ?? '').trim();
  if (!raw) return '';

  if (network === 'whatsapp') {
    if (/wa\.me/i.test(raw)) {
      return raw.replace(/\D/g, '');
    }
    return raw.replace(/\D/g, '');
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const { hostname, pathname } = new URL(raw);
      const path = pathname.replace(/^\/+/, '').replace(/\/+$/, '');

      if (network === 'instagram' && /instagram\.com$/i.test(hostname)) {
        return stripAt(path.split('/')[0]);
      }
      if (network === 'facebook' && /facebook\.com$/i.test(hostname)) {
        return path.split('/')[0];
      }
      if (network === 'tiktok' && /tiktok\.com$/i.test(hostname)) {
        return stripAt(path.split('/')[0]);
      }
      if (network === 'youtube' && /youtube\.com$/i.test(hostname)) {
        return stripAt(path.split('/')[0]);
      }
      if (network === 'linkedin' && /linkedin\.com$/i.test(hostname)) {
        const segments = path.split('/').filter(Boolean);
        if (segments[0] === 'in' && segments[1]) {
          return stripAt(segments[1]);
        }
        return stripAt(segments[0]);
      }
      if (network === 'doctoralia' && /doctoralia\./i.test(hostname)) {
        return path;
      }
    } catch {
      return stripAt(raw);
    }
  }

  return stripAt(raw);
}

export function buildSocialUrl(handle, network) {
  const value = parseSocialHandle(handle, network);
  if (!value) return '';

  switch (network) {
    case 'instagram':
      return `https://instagram.com/${value}`;
    case 'whatsapp':
      return `https://wa.me/${value}`;
    case 'facebook':
      return `https://facebook.com/${value}`;
    case 'tiktok':
      return `https://tiktok.com/@${value}`;
    case 'youtube':
      return `https://youtube.com/@${value}`;
    case 'linkedin':
      return `https://linkedin.com/in/${value}`;
    case 'doctoralia':
      return `https://www.doctoralia.com.mx/${value.replace(/^\/+/, '')}`;
    default:
      return value;
  }
}

export function getSocialLinks(data) {
  return SOCIAL_FIELDS
    .map(({ key, label }) => {
      const href = buildSocialUrl(data?.[key], key);
      if (!href) return null;
      return { key, label, href };
    })
    .filter(Boolean);
}

export function hydrateFormSocial(formData) {
  const next = { ...formData };
  SOCIAL_FIELDS.forEach(({ key }) => {
    if (next[key]) {
      next[key] = parseSocialHandle(next[key], key);
    }
  });
  return next;
}
