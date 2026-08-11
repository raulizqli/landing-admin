import { createContentId, normalizeContentId } from './contentIds.js';
import { extractMapsInput } from './maps.js';

export const LOCATIONS_CONTACT_MODES = [
  { value: 'shared', label: 'Teléfono y email compartidos' },
  { value: 'per_location', label: 'Teléfono y email por ubicación' },
];

export const LOCATIONS_DISPLAY_MODES = [
  { value: 'list', label: 'Lista' },
  { value: 'carousel', label: 'Carrusel' },
];

export function normalizeLocationsContactMode(value) {
  return value === 'per_location' ? 'per_location' : 'shared';
}

export function normalizeLocationsDisplayMode(value) {
  return value === 'carousel' ? 'carousel' : 'list';
}

export function createEmptyLocation(overrides = {}) {
  return {
    id: normalizeContentId(overrides.id, createContentId('location')),
    label: String(overrides.label ?? '').trim(),
    address: String(overrides.address ?? '').trim(),
    mapsUrl: extractMapsInput(overrides.mapsUrl ?? overrides.locationMapsUrl ?? ''),
    showMap: overrides.showMap === true,
    email: String(overrides.email ?? '').trim(),
    phone: String(overrides.phone ?? '').trim(),
    phoneIsWhatsapp: overrides.phoneIsWhatsapp === true,
  };
}

export function normalizeLocation(value = {}, index = 0) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    id: normalizeContentId(source.id, `location-${index + 1}`),
    label: String(source.label ?? source.name ?? '').trim(),
    address: String(source.address ?? source.location ?? '').trim(),
    mapsUrl: extractMapsInput(source.mapsUrl ?? source.locationMapsUrl ?? ''),
    showMap: source.showMap === true || source.showLocationMap === true,
    email: String(source.email ?? '').trim(),
    phone: String(source.phone ?? '').trim(),
    phoneIsWhatsapp: source.phoneIsWhatsapp === true,
  };
}

function locationHasContent(location) {
  return Boolean(
    String(location?.label ?? '').trim()
    || String(location?.address ?? '').trim()
    || String(location?.mapsUrl ?? '').trim()
    || String(location?.email ?? '').trim()
    || String(location?.phone ?? '').trim(),
  );
}

/**
 * Prefer `locations[]`. If empty, hydrate one entry from legacy
 * `location` / `locationMapsUrl` / `showLocationMap`.
 */
export function normalizeLocations(list, legacyPage = {}, { keepEmpty = false } = {}) {
  const fromList = Array.isArray(list)
    ? list.map((item, index) => normalizeLocation(item, index))
    : [];
  const prepared = keepEmpty ? fromList : fromList.filter(locationHasContent);

  if (prepared.length) return prepared;

  const legacy = normalizeLocation({
    address: legacyPage.location,
    mapsUrl: legacyPage.locationMapsUrl,
    showMap: legacyPage.showLocationMap === true,
    email: legacyPage.email,
    phone: legacyPage.phone,
    phoneIsWhatsapp: legacyPage.phoneIsWhatsapp,
  });

  if (locationHasContent(legacy)) {
    // Keep shared contact on page root; don't duplicate into location by default.
    return [createEmptyLocation({
      address: legacy.address,
      mapsUrl: legacy.mapsUrl,
      showMap: legacy.showMap,
    })];
  }
  return keepEmpty ? [createEmptyLocation()] : [];
}

/** Keep singular legacy fields in sync with the first location (compat). */
export function syncLegacyLocationFields(page = {}, { keepEmpty = false } = {}) {
  const locations = normalizeLocations(page.locations, page, { keepEmpty });
  const primary = locations[0] || createEmptyLocation();
  return {
    ...page,
    locations: keepEmpty ? locations : locations.filter(locationHasContent),
    locationsContactMode: normalizeLocationsContactMode(page.locationsContactMode),
    locationsDisplayMode: normalizeLocationsDisplayMode(page.locationsDisplayMode),
    location: primary.address,
    locationMapsUrl: primary.mapsUrl,
    showLocationMap: locations.some((item) => item.showMap === true),
  };
}

export function resolveVisibleLocations(page = {}) {
  return normalizeLocations(page.locations, page);
}

export function resolveLocationContact(page = {}, location = {}) {
  const mode = normalizeLocationsContactMode(page.locationsContactMode);
  if (mode === 'per_location') {
    return {
      email: String(location.email ?? '').trim(),
      phone: String(location.phone ?? '').trim(),
      phoneIsWhatsapp: location.phoneIsWhatsapp === true,
      whatsapp: page.whatsapp,
    };
  }
  return {
    email: String(page.email ?? '').trim(),
    phone: String(page.phone ?? '').trim(),
    phoneIsWhatsapp: page.phoneIsWhatsapp === true,
    whatsapp: page.whatsapp,
  };
}
