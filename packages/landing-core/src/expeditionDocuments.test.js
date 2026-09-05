import { describe, expect, it } from 'vitest';
import {
  buildExpeditionPath,
  buildExpeditionPublicUrl,
  createEmptyExpeditionDocument,
  findExpeditionDocument,
  formatExpeditionIssuedAt,
  getExpeditionDocumentLabel,
  getVisibleExpeditionDocuments,
  normalizeExpeditionDocuments,
  parseExpeditionPath,
  resolveExpeditionIssuer,
  slugifyExpeditionSegment,
} from './expeditionDocuments.js';

describe('slugifyExpeditionSegment', () => {
  it('strips accents and punctuation', () => {
    expect(slugifyExpeditionSegment('Cédula profesional')).toBe('cedula-profesional');
  });
});

describe('normalizeExpeditionDocuments', () => {
  it('assigns unique slugs from document type and keeps folio and date', () => {
    const docs = normalizeExpeditionDocuments([
      {
        documentType: 'Constancia',
        folio: 'A-100',
        issuedAt: '2026-09-04',
        imageUrl: 'https://cdn.example/a.jpg',
      },
      {
        title: 'Constancia',
        imageUrl: 'https://cdn.example/b.jpg',
      },
    ]);
    expect(docs[0].slug).toBe('constancia');
    expect(docs[0].documentType).toBe('Constancia');
    expect(docs[0].folio).toBe('A-100');
    expect(docs[0].issuedAt).toBe('2026-09-04');
    expect(docs[1].slug).toBe('constancia-2');
    expect(docs[1].documentType).toBe('Constancia');
    expect(docs[0].id).toMatch(/^expedition-/);
  });

  it('keeps an explicit slug when unique', () => {
    const docs = normalizeExpeditionDocuments([
      { id: 'exp-1', documentType: 'Uno', slug: 'constancia', imageUrl: 'https://cdn.example/a.jpg' },
    ]);
    expect(docs[0].slug).toBe('constancia');
  });

  it('rejects invalid issue dates', () => {
    const docs = normalizeExpeditionDocuments([
      { documentType: 'Informe', issuedAt: '2026-13-40', imageUrl: 'https://cdn.example/a.jpg' },
    ]);
    expect(docs[0].issuedAt).toBe('');
  });
});

describe('getVisibleExpeditionDocuments', () => {
  it('drops drafts without an image', () => {
    expect(getVisibleExpeditionDocuments({
      expeditionDocuments: [
        { documentType: 'Draft' },
        { documentType: 'Ready', imageUrl: 'https://cdn.example/a.jpg' },
      ],
    })).toHaveLength(1);
  });
});

describe('findExpeditionDocument', () => {
  it('matches slug or id', () => {
    const docs = normalizeExpeditionDocuments([
      { id: 'exp-1', documentType: 'Cédula', slug: 'cedula', imageUrl: 'https://cdn.example/a.jpg' },
    ]);
    expect(findExpeditionDocument(docs, 'cedula')?.id).toBe('exp-1');
    expect(findExpeditionDocument(docs, 'exp-1')?.slug).toBe('cedula');
    expect(findExpeditionDocument(docs, 'missing')).toBeNull();
  });
});

describe('resolveExpeditionIssuer', () => {
  it('uses the override when set, otherwise the landing name', () => {
    expect(resolveExpeditionIssuer({ name: 'Stephanie Leal', expeditionIssuerName: '' }))
      .toBe('Stephanie Leal');
    expect(resolveExpeditionIssuer({ name: 'Stephanie Leal', expeditionIssuerName: 'Dra. Leal' }))
      .toBe('Dra. Leal');
  });
});

describe('formatExpeditionIssuedAt', () => {
  it('formats ISO dates for es and en', () => {
    expect(formatExpeditionIssuedAt('2026-09-04', 'es')).toMatch(/septiembre/i);
    expect(formatExpeditionIssuedAt('2026-09-04', 'en')).toMatch(/September/i);
  });
});

describe('getExpeditionDocumentLabel', () => {
  it('prefers document type then folio', () => {
    expect(getExpeditionDocumentLabel({ documentType: 'Constancia', folio: '12' })).toBe('Constancia');
    expect(getExpeditionDocumentLabel({ folio: '12' })).toBe('12');
  });
});

describe('parseExpeditionPath', () => {
  it('detects the index and a single document', () => {
    expect(parseExpeditionPath('/expedicion')).toEqual({ list: true, slug: '' });
    expect(parseExpeditionPath('/expedicion/')).toEqual({ list: true, slug: '' });
    expect(parseExpeditionPath('/expedicion/cedula')).toEqual({ list: false, slug: 'cedula' });
    expect(parseExpeditionPath('/expedicion/a/b')).toBeNull();
    expect(parseExpeditionPath('/about')).toBeNull();
  });
});

describe('buildExpeditionPublicUrl', () => {
  it('keeps query params from the public site URL', () => {
    expect(buildExpeditionPublicUrl('https://stephanieleal.com.mx', 'cedula'))
      .toBe('https://stephanieleal.com.mx/expedicion/cedula');
    expect(buildExpeditionPublicUrl('http://localhost:5174/?pageId=steph', 'cedula'))
      .toBe('http://localhost:5174/expedicion/cedula?pageId=steph');
  });

  it('builds the index URL', () => {
    expect(buildExpeditionPath()).toBe('/expedicion');
    expect(createEmptyExpeditionDocument()).toMatchObject({
      imageUrl: '',
      folio: '',
      documentType: '',
      issuedAt: '',
    });
  });
});
