import { describe, expect, it } from 'vitest';
import {
  getHostingDeployRoutingFields,
  getPrivateHostingFields,
  mergePrivateHostingIntoPage,
} from './hostingDeploy.js';
import {
  DOMAIN_INDEX_COLLECTION,
  buildDomainIndexPayload,
  domainIndexDocId,
} from './domainIndex.js';

describe('hostingDeploy private vs public (F03)', () => {
  it('keeps GitHub targets and hook only in private hosting fields', () => {
    const form = {
      hostingProvider: 'github',
      hostingDeployHookUrl: 'https://api.vercel.com/v1/integrations/deploy/hook',
      hostingGithubOwner: 'acme',
      hostingGithubRepo: 'site',
      hostingGithubWorkflow: 'deploy.yml',
      hostingGithubRef: 'main',
      hostingPublicUrl: 'https://acme.example',
    };

    expect(getPrivateHostingFields(form)).toMatchObject({
      hostingDeployHookUrl: form.hostingDeployHookUrl,
      hostingGithubOwner: 'acme',
      hostingGithubRepo: 'site',
      hostingGithubWorkflow: 'deploy.yml',
      hostingGithubRef: 'main',
    });

    expect(getHostingDeployRoutingFields(form)).toEqual({
      hostingProvider: 'github',
      hostingPublicUrl: 'https://acme.example',
      hostingGithubOwner: '',
      hostingGithubRepo: '',
      hostingGithubWorkflow: '',
      hostingGithubRef: '',
    });
  });

  it('merges private hosting over cleared public fields for the editor', () => {
    const merged = mergePrivateHostingIntoPage(
      {
        hostingDeployHookUrl: '',
        hostingGithubOwner: '',
        hostingGithubRepo: '',
        name: 'Ana',
      },
      {
        hostingDeployHookUrl: 'https://api.netlify.com/hooks/x',
        hostingGithubOwner: 'org',
        hostingGithubRepo: 'repo',
        hostingGithubWorkflow: 'ship.yml',
        hostingGithubRef: 'master',
      },
    );

    expect(merged.hostingDeployHookUrl).toContain('netlify');
    expect(merged.hostingGithubOwner).toBe('org');
    expect(merged.hostingGithubRepo).toBe('repo');
    expect(merged.name).toBe('Ana');
  });
});

describe('domainIndex helpers', () => {
  it('normalizes hostname keys and builds payload', () => {
    expect(DOMAIN_INDEX_COLLECTION).toBe('domainIndex');
    expect(domainIndexDocId('WWW.Example.COM')).toBe('example.com');
    expect(buildDomainIndexPayload('dra-ana', 'paginas')).toEqual({
      pageId: 'dra-ana',
      collectionName: 'paginas',
      updatedAt: expect.any(String),
    });
  });
});
