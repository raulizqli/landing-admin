
import { buildSocialUrl } from './socialLinks';
import { getLabel, resolvePageLabels } from './labels';

export function resolvePhoneContact(data) {
  const labels = resolvePageLabels(data);
  const display = String(data?.phone ?? '').trim();
  const isWhatsapp = data?.phoneIsWhatsapp === true;

  if (isWhatsapp) {
    const whatsappUrl = buildSocialUrl(data?.whatsapp, 'whatsapp')
      || buildSocialUrl(display.replace(/\D/g, ''), 'whatsapp');

    const visible = display || data?.whatsapp;
    if (!visible) return null;

    if (!whatsappUrl) {
      return { display: visible, href: null, isWhatsapp: true, external: true };
    }

    return {
      display: visible,
      href: `${whatsappUrl}?text=${encodeURIComponent(getLabel(labels, 'phone.whatsappMessage'))}`,
      isWhatsapp: true,
      external: true,
    };
  }

  if (!display) return null;

  return {
    display,
    href: `tel:${display.replace(/\s/g, '')}`,
    isWhatsapp: false,
    external: false,
  };
}
