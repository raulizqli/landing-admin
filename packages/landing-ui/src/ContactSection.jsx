import { resolveMapsUrls, shouldShowMapsEmbed, normalizeContactMapLayout } from '@raulizqli/landing-core/maps';
import { resolvePhoneContact } from '@raulizqli/landing-core/phone';
import { trackCtaClick, trackContactClick } from './trackInteraction.js';
import { buildSectionBackgroundStyle, getSectionTheme } from '@raulizqli/landing-core/sectionBackground';
import { SECTION_IDS } from '@raulizqli/landing-core/sectionAnchors';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';

export default function ContactSection({ data, interactive = true }) {
  const labels = resolvePageLabels(data);
  const location = data?.location;
  const email = data?.email;
  const phoneContact = resolvePhoneContact(data);
  const maps = resolveMapsUrls(data);
  const showMap = shouldShowMapsEmbed(data, maps);
  const mapBeside = showMap && normalizeContactMapLayout(data?.contactMapLayout) === 'beside';
  const mailtoSubject = encodeURIComponent(getLabel(labels, 'booking.mailtoSubject'));
  const mailtoHref = email ? `mailto:${email}?subject=${mailtoSubject}` : `#${SECTION_IDS.contact}`;
  const sectionStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'contact'), { sectionKey: 'contact' });

  const contactCard = (
    <div className="bg-white rounded-2xl border border-[#2A342D]/10 shadow-sm p-6 sm:p-8 space-y-5 h-full">
      {location && (
        <div className="flex items-start gap-3">
          <span className="text-[#4A5D4E] mt-0.5" aria-hidden="true">📍</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4A5D4E]/80 mb-0.5">{getLabel(labels, 'contact.location')}</p>
            {interactive && maps.linkUrl ? (
              <a
                href={maps.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#4A5D4E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#4A5D4E] rounded"
              >
                {location}
              </a>
            ) : (
              <p className="text-sm text-[#2A342D]/80">{location}</p>
            )}
          </div>
        </div>
      )}
      {email && (
        <div className="flex items-start gap-3">
          <span className="text-[#4A5D4E] mt-0.5" aria-hidden="true">✉️</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4A5D4E]/80 mb-0.5">{getLabel(labels, 'contact.email')}</p>
            {interactive ? (
              <a
                href={`mailto:${email}`}
                onClick={() => trackContactClick('email')}
                className="text-sm text-[#4A5D4E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#4A5D4E] rounded"
              >
                {email}
              </a>
            ) : (
              <p className="text-sm text-[#4A5D4E]">{email}</p>
            )}
          </div>
        </div>
      )}
      {phoneContact && (
        <div className="flex items-start gap-3">
          <span className="text-[#4A5D4E] mt-0.5" aria-hidden="true">{phoneContact.isWhatsapp ? '💬' : '📞'}</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4A5D4E]/80 mb-0.5">
              {phoneContact.isWhatsapp ? getLabel(labels, 'contact.whatsapp') : getLabel(labels, 'contact.phone')}
            </p>
            {interactive && phoneContact.href ? (
              <a
                href={phoneContact.href}
                target={phoneContact.external ? '_blank' : undefined}
                rel={phoneContact.external ? 'noopener noreferrer' : undefined}
                onClick={() => trackContactClick(phoneContact.isWhatsapp ? 'whatsapp' : 'phone')}
                className="text-sm text-[#4A5D4E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#4A5D4E] rounded"
              >
                {phoneContact.display}
              </a>
            ) : (
              <p className="text-sm text-[#4A5D4E]">{phoneContact.display}</p>
            )}
          </div>
        </div>
      )}

      {email && (
        interactive ? (
          <a
            href={mailtoHref}
            onClick={() => trackCtaClick('send_message')}
            className="block w-full text-center bg-[#4A5D4E] text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-[#3d4d40] transition-colors mt-2 focus:outline-none focus:ring-2 focus:ring-[#4A5D4E] focus:ring-offset-2"
          >
            {getLabel(labels, 'contact.sendMessage')}
          </a>
        ) : (
          <span className="block w-full text-center bg-[#4A5D4E] text-white text-sm font-medium px-6 py-3 rounded-full mt-2">
            {getLabel(labels, 'contact.sendMessage')}
          </span>
        )
      )}
    </div>
  );

  const mapBlock = showMap ? (
    <div className={`rounded-2xl overflow-hidden border border-[#2A342D]/10 shadow-sm bg-white ${mapBeside ? 'h-full min-h-[280px]' : ''}`}>
      <iframe
        title={getLabel(labels, 'contact.mapTitle')}
        src={maps.embedUrl}
        className={`w-full border-0 ${mapBeside ? 'h-full min-h-[280px] sm:min-h-[320px]' : 'h-64 sm:h-80'}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  ) : null;

  return (
    <section id={SECTION_IDS.contact} className="border-y border-[#2A342D]/10" style={sectionStyle}>
      <div className="max-w-5xl mx-auto px-5 py-14 sm:py-20">
        <div className="text-center mb-10">
          <h2 className="font-serif text-2xl sm:text-3xl text-current mb-3">
            {getLabel(labels, 'contact.title')}
          </h2>
          <p className="text-sm text-current/60 max-w-md mx-auto">
            {getLabel(labels, 'contact.subtitle')}
          </p>
        </div>

        {mapBeside ? (
          <div className="grid gap-6 md:grid-cols-2 md:gap-8 items-stretch">
            <div className="min-w-0">{contactCard}</div>
            <div className="min-w-0 min-h-[280px]">{mapBlock}</div>
          </div>
        ) : (
          <div className="space-y-6 max-w-lg mx-auto">
            {contactCard}
            {mapBlock}
          </div>
        )}
      </div>
    </section>
  );
}
