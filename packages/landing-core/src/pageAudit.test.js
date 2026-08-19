import { describe, expect, it } from 'vitest';
import { buildPageAuditSnapshot, diffPageAuditSnapshots } from './pageAudit.js';

describe('pageAudit', () => {
  it('snapshots only known editorial keys', () => {
    const snap = buildPageAuditSnapshot({
      name: 'Ana',
      specialty: 'Psicología',
      hostingDeployHookUrl: 'secret',
      siteAccess: 'blocked',
    });
    expect(snap.name).toBe('Ana');
    expect(snap.specialty).toBe('Psicología');
    expect(snap.hostingDeployHookUrl).toBeUndefined();
    expect(snap.siteAccess).toBeUndefined();
  });

  it('includes video section carousel fields', () => {
    const snap = buildPageAuditSnapshot({
      videoSectionEnabled: true,
      videoSectionUrl: 'https://youtu.be/dQw4w9wgGcQ',
      videoSectionItems: [{ id: 'video-1', url: 'https://youtu.be/dQw4w9wgGcQ' }],
    });
    expect(snap.videoSectionEnabled).toBe(true);
    expect(snap.videoSectionUrl).toBe('https://youtu.be/dQw4w9wgGcQ');
    expect(snap.videoSectionItems).toHaveLength(1);
  });

  it('lists changed keys and trims unchanged fields from before/after', () => {
    const { before, after, changedKeys } = diffPageAuditSnapshots(
      { name: 'Ana', specialty: 'A', email: 'a@x.com' },
      { name: 'Ana', specialty: 'B', email: 'a@x.com' },
    );
    expect(changedKeys).toEqual(['specialty']);
    expect(before).toEqual({ specialty: 'A' });
    expect(after).toEqual({ specialty: 'B' });
  });
});
