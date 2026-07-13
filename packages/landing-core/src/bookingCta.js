
import { buildSocialUrl } from './socialLinks';
import { SECTION_IDS } from './sectionAnchors';
import { getLabel, resolvePageLabels } from './labels';

export function resolveBookingCta(data) {
  const labels = resolvePageLabels(data);
  const target = data?.navCtaTarget || 'email';
  const email = String(data?.email ?? '').trim();

  if (target === 'whatsapp') {
    const whatsappUrl = buildSocialUrl(data?.whatsapp, 'whatsapp');
    if (whatsappUrl) {
      return {
        href: `${whatsappUrl}?text=${encodeURIComponent(getLabel(labels, 'booking.whatsappMessage'))}`,
        external: true,
      };
    }
  }

  if (target === 'link') {
    const rawLink = String(data?.navCtaLink ?? '').trim();
    if (rawLink) {
      const href = /^https?:\/\//i.test(rawLink) ? rawLink : `https://${rawLink}`;
      return {
        href,
        external: /^https?:\/\//i.test(href) && !href.startsWith('mailto:'),
      };
    }
  }

  if (email) {
    return {
      href: `mailto:${email}?subject=${encodeURIComponent(getLabel(labels, 'booking.mailtoSubject'))}`,
      external: false,
    };
  }

  return { href: `#${SECTION_IDS.contact}`, external: false };
}
