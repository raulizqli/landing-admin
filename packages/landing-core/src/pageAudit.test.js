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
