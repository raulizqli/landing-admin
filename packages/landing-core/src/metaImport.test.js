import { describe, expect, it } from 'vitest';
import {
  formatSingleLineAddress,
  inferVerticalFromCategory,
  mapMetaGraphToDraft,
  summarizeMetaPages,
} from './metaImport.js';

describe('metaImport', () => {
  it('infers beauty vertical from salon categories', () => {
    expect(inferVerticalFromCategory('Nail Salon')).toBe('beauty');
    expect(inferVerticalFromCategory('Estética')).toBe('beauty');
    expect(inferVerticalFromCategory('Dentist')).toBe('dental');
    expect(inferVerticalFromCategory('Unknown LLC')).toBe('generic');
  });

  it('maps Graph page + Instagram into English draft fields', () => {
    const draft = mapMetaGraphToDraft({
      page: {
        name: 'Stilette',
        about: 'Nuestra misión es resaltar lo mejor de ti. Visítanos.',
        category: 'Nail Salon',
        phone: '+52 81 3075 0554',
        whatsapp_number: '528130750554',
        emails: ['hola@stilette.example'],
        username: 'stilette.beauty',
        link: 'https://www.facebook.com/stilette.beauty/',
        single_line_address: 'Tampico 160',
        cover: { source: '', url: 'https://cdn.example/cover.jpg' },
        picture: { data: { url: 'https://cdn.example/pic.jpg' } },
      },
      instagram: {
        username: 'stilette.beauty',
        biography: 'Nails, spa & more',
        media: {
          data: [
            { media_type: 'IMAGE', media_url: 'https://cdn.example/1.jpg', caption: 'Mani' },
            { media_type: 'VIDEO', media_url: 'https://cdn.example/v.mp4' },
          ],
        },
      },
    });

    expect(draft.name).toBe('Stilette');
    expect(draft.vertical).toBe('beauty');
    expect(draft.phone).toBe('528130750554');
    expect(draft.phoneIsWhatsapp).toBe(true);
    expect(draft.whatsapp).toBe('528130750554');
    expect(draft.instagram).toBe('stilette.beauty');
    expect(draft.facebook).toBe('stilette.beauty');
    expect(draft.location).toBe('Tampico 160');
    expect(draft.locationMapsUrl).toContain('Tampico');
    expect(draft.navCtaTarget).toBe('whatsapp');
    expect(draft.galleryItems).toHaveLength(1);
    expect(draft.gallerySectionEnabled).toBe(true);
    expect(draft.heroSlides[0].imageUrl).toBe('https://cdn.example/cover.jpg');
    expect(JSON.stringify(draft)).not.toMatch(/access_token/i);
  });

  it('summarizes pages without tokens', () => {
    const pages = summarizeMetaPages([
      {
        id: '1',
        name: 'Stilette',
        access_token: 'secret',
        instagram_business_account: { id: 'ig1' },
      },
    ]);
    expect(pages).toEqual([
      {
        id: '1',
        name: 'Stilette',
        category: '',
        pictureUrl: '',
        hasInstagram: true,
      },
    ]);
  });

  it('formats structured addresses', () => {
    expect(formatSingleLineAddress({
      street: 'Tampico 160',
      city: 'Monterrey',
      country: 'Mexico',
    })).toBe('Tampico 160, Monterrey, Mexico');
  });
});
