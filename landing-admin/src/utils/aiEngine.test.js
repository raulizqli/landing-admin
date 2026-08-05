import { describe, expect, it } from 'vitest';
import { getDefaultAiEngine, getLocalOllamaConfig } from './aiEngine.js';

describe('getDefaultAiEngine', () => {
  it('defaults to local Ollama on localhost / DEV', () => {
    expect(getDefaultAiEngine({ isDev: true, hostname: 'example.com' })).toBe('local');
    expect(getDefaultAiEngine({ isDev: false, hostname: 'localhost' })).toBe('local');
    expect(getDefaultAiEngine({ isDev: false, hostname: '127.0.0.1' })).toBe('local');
  });

  it('defaults to platform outside local', () => {
    expect(getDefaultAiEngine({ isDev: false, hostname: 'landing-admin-9452e.web.app' })).toBe('platform');
  });
});

describe('getLocalOllamaConfig', () => {
  it('exposes Ollama defaults', () => {
    const conf = getLocalOllamaConfig();
    expect(conf.baseUrl).toContain('11434');
    expect(conf.model).toBeTruthy();
  });
});
