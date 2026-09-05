import { useMemo, useState } from 'react';
import {
  buildInquiryWhatsAppMessage,
  isContactFormEnabled,
  resolveContactFormProjectTypes,
  validateInquiryPayload,
} from '@raulizqli/landing-core/contactInquiry';
import { buildWhatsAppUrl, normalizePhoneCountry } from '@raulizqli/landing-core/phone';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';
import {
  DEFAULT_NAV_CTA_BG_COLOR,
  DEFAULT_NAV_CTA_TEXT_COLOR,
} from '@raulizqli/landing-core/pageModel';
import { parseColorToHex } from '@raulizqli/landing-core/sectionBackground';
import { trackCtaClick } from './trackInteraction.js';

const inputClass =
  'w-full rounded-xl border border-current/20 bg-current/5 px-3 py-2.5 text-sm text-current placeholder:text-current/40 focus:outline-none focus:ring-2 focus:ring-current';

/**
 * @param {{ data: object, interactive?: boolean, pageId?: string, onSubmitInquiry?: (payload: object) => Promise<unknown> }} props
 */
export default function ContactInquiryForm({
  data,
  interactive = true,
  pageId = '',
  onSubmitInquiry,
}) {
  const labels = resolvePageLabels(data);
  const language = data?.labelLanguage === 'en' ? 'en' : 'es';
  const enabled = isContactFormEnabled(data);
  const projectTypes = useMemo(
    () => (enabled ? resolveContactFormProjectTypes(data, language) : []),
    [data, language, enabled],
  );
  const buttonStyle = {
    backgroundColor: parseColorToHex(data?.navCtaBgColor, DEFAULT_NAV_CTA_BG_COLOR),
    color: parseColorToHex(data?.navCtaTextColor, DEFAULT_NAV_CTA_TEXT_COLOR),
  };

  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  if (!enabled) return null;

  const openWhatsApp = (payload) => {
    const country = normalizePhoneCountry(data?.phoneCountry);
    const whatsappUrl = buildWhatsAppUrl(data?.whatsapp, country)
      || buildWhatsAppUrl(data?.phone, country);
    if (!whatsappUrl) return;

    const selected = projectTypes.find((item) => item.value === payload.projectType);
    const text = buildInquiryWhatsAppMessage({
      name: payload.name,
      projectTypeLabel: selected?.label || payload.projectType,
      contact: payload.contact,
      message: payload.message,
      baseMessage: getLabel(labels, 'booking.whatsappMessage'),
    });
    const href = `${whatsappUrl}?text=${encodeURIComponent(text)}`;
    if (typeof window !== 'undefined') {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!interactive) return;

    const validated = validateInquiryPayload({
      name,
      projectType,
      contact,
      message,
      website: honeypot,
    });

    if (!validated.ok) {
      if (validated.errors.includes('spam')) {
        setStatus('success');
        return;
      }
      setError(getLabel(labels, 'contact.formError'));
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setError('');
    trackCtaClick('contact_inquiry_submit');

    try {
      if (typeof onSubmitInquiry === 'function' && pageId) {
        await onSubmitInquiry({
          pageId,
          ...validated.data,
          website: honeypot,
        });
      }
      openWhatsApp(validated.data);
      setStatus('success');
      setName('');
      setProjectType('');
      setContact('');
      setMessage('');
      setHoneypot('');
    } catch {
      // Still open WhatsApp for conversion even if persist fails
      openWhatsApp(validated.data);
      setError(getLabel(labels, 'contact.formError'));
      setStatus('error');
    }
  };

  return (
    <form
      className="relative bg-current/5 rounded-2xl border border-current/10 shadow-sm p-6 sm:p-8 space-y-4"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-current/70">
          {getLabel(labels, 'contact.formName')}
        </label>
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={!interactive || status === 'submitting'}
          className={inputClass}
          autoComplete="name"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-current/70">
          {getLabel(labels, 'contact.formProjectType')}
        </label>
        <select
          name="projectType"
          value={projectType}
          onChange={(e) => setProjectType(e.target.value)}
          required
          disabled={!interactive || status === 'submitting'}
          className={inputClass}
        >
          <option value="">{getLabel(labels, 'contact.formProjectTypePlaceholder')}</option>
          {projectTypes.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-current/70">
          {getLabel(labels, 'contact.formContact')}
        </label>
        <input
          name="contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          required
          disabled={!interactive || status === 'submitting'}
          className={inputClass}
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-current/70">
          {getLabel(labels, 'contact.formMessage')}
        </label>
        <textarea
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={4}
          disabled={!interactive || status === 'submitting'}
          className={inputClass}
        />
      </div>

      {/* Honeypot */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={!interactive || status === 'submitting'}
        className="block w-full text-center text-sm font-medium px-6 py-3 rounded-full transition-opacity hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-current"
        style={buttonStyle}
      >
        {getLabel(labels, 'contact.formSubmit')}
      </button>

      {status === 'success' && (
        <p className="text-sm text-current/70" role="status">
          {getLabel(labels, 'contact.formSuccess')}
        </p>
      )}
      {status === 'error' && error && (
        <p className="text-sm text-current/80" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
