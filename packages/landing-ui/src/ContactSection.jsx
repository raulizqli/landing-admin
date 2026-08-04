import { useState } from 'react';
import {
  resolveMapsUrlsForLocation,
  shouldShowLocationMap,
  normalizeContactMapLayout,
} from '@raulizqli/landing-core/maps';
import {
  normalizeLocationsContactMode,
  normalizeLocationsDisplayMode,
  resolveLocationContact,
  resolveVisibleLocations,
} from '@raulizqli/landing-core/locations';
import { resolvePhoneContact } from '@raulizqli/landing-core/phone';
import { trackCtaClick, trackContactClick } from './trackInteraction.js';
import { buildSectionBackgroundStyle, getSectionTheme } from '@raulizqli/landing-core/sectionBackground';
import { SECTION_IDS } from '@raulizqli/landing-core/sectionAnchors';
import { getLabel, resolvePageLabels } from '@raulizqli/landing-core/labels';

function MapEmbed({ title, embedUrl, tall = false }) {
  return (
    <div className={`rounded-2xl overflow-hidden border border-[#2A342D]/10 shadow-sm bg-white ${tall ? 'h-full min-h-[280px]' : ''}`}>
      <iframe
        title={title}
        src={embedUrl}
        className={`w-full border-0 ${tall ? 'h-full min-h-[280px] sm:min-h-[320px]' : 'h-64 sm:h-80'}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}

function ContactEmailRow({ email, labels, interactive }) {
  if (!email) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="text-[#4A5D4E] mt-0.5" aria-hidden="true">✉️</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#4A5D4E]/80 mb-0.5">
          {getLabel(labels, 'contact.email')}
        </p>
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
  );
}

function ContactPhoneRow({ phoneContact, labels, interactive }) {
  if (!phoneContact) return null;
  return (
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
  );
}

function LocationAddressRow({
  location,
  index,
  total,
  locationLabel,
  interactive,
}) {
  const maps = resolveMapsUrlsForLocation(location);
  const title = String(location.label || '').trim()
    || (total > 1 ? `${locationLabel} ${index + 1}` : locationLabel);

  return (
    <div className="flex items-start gap-3">
      <span className="text-[#4A5D4E] mt-0.5" aria-hidden="true">📍</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#4A5D4E]/80 mb-0.5">
          {title}
        </p>
        {interactive && maps.linkUrl ? (
          <a
            href={maps.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#4A5D4E] hover:underline focus:outline-none focus:ring-2 focus:ring-[#4A5D4E] rounded"
          >
            {location.address || maps.linkUrl}
          </a>
        ) : (
          <p className="text-sm text-[#2A342D]/80">{location.address}</p>
        )}
      </div>
    </div>
  );
}

function SendMessageButton({ email, mailtoHref, labels, interactive }) {
  if (!email) return null;
  if (interactive) {
    return (
      <a
        href={mailtoHref}
        onClick={() => trackCtaClick('send_message')}
        className="block w-full text-center bg-[#4A5D4E] text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-[#3d4d40] transition-colors mt-2 focus:outline-none focus:ring-2 focus:ring-[#4A5D4E] focus:ring-offset-2"
      >
        {getLabel(labels, 'contact.sendMessage')}
      </a>
    );
  }
  return (
    <span className="block w-full text-center bg-[#4A5D4E] text-white text-sm font-medium px-6 py-3 rounded-full mt-2">
      {getLabel(labels, 'contact.sendMessage')}
    </span>
  );
}

function locationPhoneContact(data, contact) {
  return resolvePhoneContact({
    ...data,
    phone: contact.phone,
    phoneIsWhatsapp: contact.phoneIsWhatsapp,
    whatsapp: contact.whatsapp ?? data?.whatsapp,
  });
}

function LocationContactBlock({
  data,
  location,
  index,
  total,
  locationLabel,
  labels,
  interactive,
  includeContact,
  includeSendMessage,
}) {
  const contact = resolveLocationContact(data, location);
  const phoneContact = includeContact ? locationPhoneContact(data, contact) : null;
  const mailtoSubject = encodeURIComponent(getLabel(labels, 'booking.mailtoSubject'));
  const mailtoHref = contact.email
    ? `mailto:${contact.email}?subject=${mailtoSubject}`
    : `#${SECTION_IDS.contact}`;

  return (
    <div className="space-y-5">
      <LocationAddressRow
        location={location}
        index={index}
        total={total}
        locationLabel={locationLabel}
        interactive={interactive}
      />
      {includeContact && (
        <>
          <ContactEmailRow email={contact.email} labels={labels} interactive={interactive} />
          <ContactPhoneRow phoneContact={phoneContact} labels={labels} interactive={interactive} />
        </>
      )}
      {includeSendMessage && (
        <SendMessageButton
          email={contact.email}
          mailtoHref={mailtoHref}
          labels={labels}
          interactive={interactive}
        />
      )}
    </div>
  );
}

function LocationsCarousel({
  data,
  locations,
  locationLabel,
  labels,
  interactive,
  perLocationContact,
}) {
  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, Math.max(0, locations.length - 1));
  const location = locations[safeIndex];
  if (!location) return null;

  const showNav = locations.length > 1;
  const maps = shouldShowLocationMap(location) ? resolveMapsUrlsForLocation(location) : null;

  return (
    <div className="space-y-5">
      <LocationContactBlock
        data={data}
        location={location}
        index={safeIndex}
        total={locations.length}
        locationLabel={locationLabel}
        labels={labels}
        interactive={interactive}
        includeContact={perLocationContact}
        includeSendMessage={perLocationContact}
      />
      {maps?.embedUrl && (
        <MapEmbed
          title={`${getLabel(labels, 'contact.mapTitle')}${locations.length > 1 ? ` ${safeIndex + 1}` : ''}`}
          embedUrl={maps.embedUrl}
        />
      )}
      {showNav && (
        <div className="flex items-center justify-center gap-4 pt-1">
          <button
            type="button"
            disabled={!interactive || safeIndex <= 0}
            onClick={() => setIndex((current) => Math.max(0, current - 1))}
            className="text-sm font-medium px-4 py-2 rounded-full border border-[#2A342D]/20 text-[#2A342D] hover:bg-[#2A342D]/5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {getLabel(labels, 'services.carouselPrevious')}
          </button>
          <span className="text-xs text-[#2A342D]/55 tabular-nums">
            {safeIndex + 1} / {locations.length}
          </span>
          <button
            type="button"
            disabled={!interactive || safeIndex >= locations.length - 1}
            onClick={() => setIndex((current) => Math.min(locations.length - 1, current + 1))}
            className="text-sm font-medium px-4 py-2 rounded-full border border-[#2A342D]/20 text-[#2A342D] hover:bg-[#2A342D]/5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {getLabel(labels, 'services.carouselNext')}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ContactSection({ data, interactive = true }) {
  const labels = resolvePageLabels(data);
  const locations = resolveVisibleLocations(data);
  const contactMode = normalizeLocationsContactMode(data?.locationsContactMode);
  const displayMode = normalizeLocationsDisplayMode(data?.locationsDisplayMode);
  const perLocationContact = contactMode === 'per_location';
  const sharedContact = resolveLocationContact(data, {});
  const sharedPhoneContact = !perLocationContact
    ? locationPhoneContact(data, sharedContact)
    : null;
  const mapEntries = locations
    .filter((location) => shouldShowLocationMap(location))
    .map((location) => ({
      location,
      maps: resolveMapsUrlsForLocation(location),
    }));
  const primaryMap = mapEntries[0] || null;
  const extraMaps = mapEntries.slice(1);
  const mapBeside = displayMode === 'list'
    && Boolean(primaryMap)
    && normalizeContactMapLayout(data?.contactMapLayout) === 'beside';
  const mailtoSubject = encodeURIComponent(getLabel(labels, 'booking.mailtoSubject'));
  const sharedMailtoHref = sharedContact.email
    ? `mailto:${sharedContact.email}?subject=${mailtoSubject}`
    : `#${SECTION_IDS.contact}`;
  const sectionStyle = buildSectionBackgroundStyle(getSectionTheme(data, 'contact'), { sectionKey: 'contact' });
  const locationLabel = getLabel(labels, 'contact.location');

  const sharedContactRows = !perLocationContact ? (
    <>
      <ContactEmailRow email={sharedContact.email} labels={labels} interactive={interactive} />
      <ContactPhoneRow phoneContact={sharedPhoneContact} labels={labels} interactive={interactive} />
      <SendMessageButton
        email={sharedContact.email}
        mailtoHref={sharedMailtoHref}
        labels={labels}
        interactive={interactive}
      />
    </>
  ) : null;

  const contactCard = (
    <div className="bg-white rounded-2xl border border-[#2A342D]/10 shadow-sm p-6 sm:p-8 space-y-5 h-full">
      {displayMode === 'carousel' ? (
        <>
          <LocationsCarousel
            data={data}
            locations={locations}
            locationLabel={locationLabel}
            labels={labels}
            interactive={interactive}
            perLocationContact={perLocationContact}
          />
          {sharedContactRows}
        </>
      ) : (
        <>
          {locations.map((location, index) => (
            <div
              key={location.id || index}
              className={index > 0 ? 'pt-5 border-t border-[#2A342D]/10' : undefined}
            >
              <LocationContactBlock
                data={data}
                location={location}
                index={index}
                total={locations.length}
                locationLabel={locationLabel}
                labels={labels}
                interactive={interactive}
                includeContact={perLocationContact}
                includeSendMessage={perLocationContact}
              />
            </div>
          ))}
          {sharedContactRows}
        </>
      )}
    </div>
  );

  const mapTitle = getLabel(labels, 'contact.mapTitle');
  const primaryMapBlock = displayMode === 'list' && primaryMap
    ? <MapEmbed title={mapTitle} embedUrl={primaryMap.maps.embedUrl} tall={mapBeside} />
    : null;
  const extraMapBlocks = displayMode === 'list'
    ? extraMaps.map((entry, index) => (
      <MapEmbed
        key={entry.location.id || index}
        title={`${mapTitle} ${index + 2}`}
        embedUrl={entry.maps.embedUrl}
      />
    ))
    : [];

  return (
    <section id={SECTION_IDS.contact} className="border-y border-[#2A342D]/10" style={sectionStyle}>
      <div className="max-w-5xl mx-auto px-5 py-14 sm:py-20">
        <div className="text-center mb-10">
          {data.contactShowTitle !== false ? (
            <h2 className="font-serif text-2xl sm:text-3xl text-current mb-3">
              {getLabel(labels, 'contact.title')}
            </h2>
          ) : null}
          {data.contactShowSubtitle !== false ? (
            <p className="text-sm text-current/60 max-w-md mx-auto">
              {getLabel(labels, 'contact.subtitle')}
            </p>
          ) : null}
        </div>

        {mapBeside ? (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 md:gap-8 items-stretch">
              <div className="min-w-0">{contactCard}</div>
              <div className="min-w-0 min-h-[280px]">{primaryMapBlock}</div>
            </div>
            {extraMapBlocks.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2">
                {extraMapBlocks}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 max-w-lg mx-auto">
            {contactCard}
            {primaryMapBlock}
            {extraMapBlocks}
          </div>
        )}
      </div>
    </section>
  );
}
