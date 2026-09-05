import { buildWhatsAppUrl, normalizePhoneCountry } from '@raulizqli/landing-core/phone';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';
import { trackContactClick } from './trackInteraction.js';

function resolveFloatingWhatsAppHref(data) {
  if (data?.floatingWhatsappEnabled === false) return null;
  const country = normalizePhoneCountry(data?.phoneCountry);
  const base = buildWhatsAppUrl(data?.whatsapp, country)
    || (data?.phoneIsWhatsapp ? buildWhatsAppUrl(data?.phone, country) : '')
    || buildWhatsAppUrl(data?.phone, country);
  if (!base) return null;
  const labels = resolvePageLabels(data);
  const text = getLabel(labels, 'booking.whatsappMessage');
  return `${base}?text=${encodeURIComponent(text)}`;
}

/**
 * Fixed WhatsApp CTA for public landings. Hidden when interactive is false (admin mirror).
 */
export default function FloatingWhatsAppButton({ data, interactive = true }) {
  if (!interactive) return null;
  const href = resolveFloatingWhatsAppHref(data);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackContactClick('whatsapp_floating')}
      aria-label={getLabel(resolvePageLabels(data), 'contact.whatsapp')}
      className="fixed bottom-5 right-4 z-40 sm:bottom-6 sm:right-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/25 hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    >
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.2A10 10 0 1 0 12 2zm0 2a8 8 0 0 1 6.8 12.1l.3.3-.2 2.1-2.1-.2-.3-.3A8 8 0 1 1 12 4zm-1.1 3.5c.2 0 .5 0 .7.2.3.3.8 1 .9 1.2 0 .2 0 .4-.1.6l-.4.5c-.1.2-.2.3-.1.5.2.5.9 1.7 2.2 2.2.2.1.4 0 .5-.1l.6-.5c.2-.1.4-.1.6 0 .3.2 1 .6 1.2.9.2.2.2.5.1.7-.2.4-1 1.2-1.7 1.2-.5 0-1.2-.3-2.6-1.4-1.8-1.5-3-3.3-3.1-4.3 0-.6.5-1.3 1.1-1.7z" />
      </svg>
    </a>
  );
}
