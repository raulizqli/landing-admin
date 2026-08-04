import { describe, expect, it } from 'vitest';
import {
  allowsDemoUserLogin,
  getLoginBlockReason,
  normalizeAppEnv,
  resolveAppEnv,
} from './appEnv.js';

describe('appEnv', () => {
  it('normalizes aliases', () => {
    expect(normalizeAppEnv('production')).toBe('prod');
    expect(normalizeAppEnv('staging')).toBe('stage');
    expect(normalizeAppEnv('development')).toBe('dev');
  });

  it('prefers VITE_APP_ENV', () => {
    expect(resolveAppEnv({
      viteAppEnv: 'stage',
      viteMode: 'production',
      isDev: false,
      hostname: 'admin.example.com',
    })).toBe('stage');
  });

  it('uses DEV for local', () => {
    expect(resolveAppEnv({
      viteAppEnv: '',
      viteMode: 'development',
      isDev: true,
      hostname: 'localhost',
    })).toBe('dev');
  });

  it('defaults unknown production builds to prod', () => {
    expect(resolveAppEnv({
      viteAppEnv: '',
      viteMode: 'production',
      isDev: false,
      hostname: 'admin.tapsite.example',
    })).toBe('prod');
  });

  it('detects stage from hostname', () => {
    expect(resolveAppEnv({
      viteAppEnv: '',
      viteMode: '',
      isDev: false,
      hostname: 'admin.stage.leftsidedev.site',
    })).toBe('stage');
  });

  it('allows demo login only on dev/stage', () => {
    expect(allowsDemoUserLogin('dev')).toBe(true);
    expect(allowsDemoUserLogin('stage')).toBe(true);
    expect(allowsDemoUserLogin('prod')).toBe(false);
  });

  it('blocks disabled always and demo only in prod', () => {
    expect(getLoginBlockReason({ disabled: true, isDemo: false }, 'dev')).toBe('disabled');
    expect(getLoginBlockReason({ disabled: false, isDemo: true }, 'prod')).toBe('demo');
    expect(getLoginBlockReason({ disabled: false, isDemo: true }, 'stage')).toBe(null);
    expect(getLoginBlockReason({ disabled: false, isDemo: false }, 'prod')).toBe(null);
  });
});
