import { describe, expect, it } from 'vitest';
import {
  createEmptyLocation,
  normalizeLocations,
  normalizeLocationsContactMode,
  normalizeLocationsDisplayMode,
  resolveLocationContact,
  syncLegacyLocationFields,
} from './locations.js';

describe('locations', () => {
  it('hydrates from legacy singular fields', () => {
    const list = normalizeLocations([], {
      location: 'Roma Norte, CDMX',
      locationMapsUrl: 'https://maps.google.com/?q=roma',
      showLocationMap: true,
    });
    expect(list).toHaveLength(1);
    expect(list[0].address).toBe('Roma Norte, CDMX');
    expect(list[0].showMap).toBe(true);
  });

  it('prefers locations[] over legacy', () => {
    const list = normalizeLocations(
      [{ address: 'Sucursal A' }, { address: 'Sucursal B', showMap: true }],
      { location: 'legacy' },
    );
    expect(list.map((item) => item.address)).toEqual(['Sucursal A', 'Sucursal B']);
  });

  it('syncs primary legacy fields from first location', () => {
    const synced = syncLegacyLocationFields({
      locations: [
        createEmptyLocation({ address: 'A', mapsUrl: 'https://maps.google.com/a', showMap: false }),
        createEmptyLocation({ address: 'B', showMap: true }),
      ],
      locationsContactMode: 'per_location',
      locationsDisplayMode: 'carousel',
    });
    expect(synced.location).toBe('A');
    expect(synced.locationMapsUrl).toContain('maps.google.com');
    expect(synced.showLocationMap).toBe(true);
    expect(synced.locationsContactMode).toBe('per_location');
    expect(synced.locationsDisplayMode).toBe('carousel');
  });

  it('normalizes contact and display modes', () => {
    expect(normalizeLocationsContactMode('per_location')).toBe('per_location');
    expect(normalizeLocationsContactMode('shared')).toBe('shared');
    expect(normalizeLocationsDisplayMode('carousel')).toBe('carousel');
    expect(normalizeLocationsDisplayMode('list')).toBe('list');
  });

  it('resolves shared vs per-location contact', () => {
    const page = {
      email: 'shared@example.com',
      phone: '111',
      locationsContactMode: 'shared',
    };
    const location = createEmptyLocation({ email: 'local@example.com', phone: '222' });
    expect(resolveLocationContact(page, location).email).toBe('shared@example.com');
    expect(resolveLocationContact({ ...page, locationsContactMode: 'per_location' }, location).phone).toBe('222');
  });
});
