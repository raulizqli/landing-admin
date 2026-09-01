import { describe, it, expect } from 'vitest';
import {
  generateReferralCode,
  isValidReferralCode,
  normalizeReferralCode,
  normalizeReferralStats,
  normalizeReferralConfig,
  normalizeReferralConversion,
  generateReferralLink,
  parseReferralCodeFromUrl,
  calculateConversionRate,
  formatReferralRevenue,
  getReferralTier,
  getNextReferralTier,
} from './referralTracking';

describe('referralTracking', () => {
  describe('generateReferralCode', () => {
    it('generates a 6-character code', () => {
      const code = generateReferralCode();
      expect(code).toHaveLength(6);
      expect(isValidReferralCode(code)).toBe(true);
    });

    it('generates unique codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateReferralCode());
      }
      expect(codes.size).toBeGreaterThan(90); // Should be mostly unique
    });
  });

  describe('isValidReferralCode', () => {
    it('validates correct codes', () => {
      expect(isValidReferralCode('ABC234')).toBe(true);
      expect(isValidReferralCode('XYZ789')).toBe(true);
    });

    it('rejects invalid codes', () => {
      expect(isValidReferralCode('abc')).toBe(false); // Too short
      expect(isValidReferralCode('ABCDEFG')).toBe(false); // Too long
      expect(isValidReferralCode('ABC-12')).toBe(false); // Invalid chars
      expect(isValidReferralCode('')).toBe(false);
      expect(isValidReferralCode(null)).toBe(false);
    });
  });

  describe('normalizeReferralCode', () => {
    it('normalizes to uppercase', () => {
      expect(normalizeReferralCode('abc234')).toBe('ABC234');
      expect(normalizeReferralCode('  xyz789  ')).toBe('XYZ789');
    });
  });

  describe('normalizeReferralStats', () => {
    it('creates empty stats with defaults', () => {
      const stats = normalizeReferralStats();
      expect(stats.totalClicks).toBe(0);
      expect(stats.totalSignups).toBe(0);
      expect(stats.totalPaidConversions).toBe(0);
      expect(stats.totalRevenue).toBe(0);
    });

    it('normalizes existing stats', () => {
      const stats = normalizeReferralStats({
        totalClicks: 100,
        totalSignups: 50,
        totalPaidConversions: 10,
        totalRevenue: 250,
      });
      expect(stats.totalClicks).toBe(100);
      expect(stats.totalSignups).toBe(50);
      expect(stats.totalPaidConversions).toBe(10);
      expect(stats.totalRevenue).toBe(250);
    });
  });

  describe('normalizeReferralConfig', () => {
    it('creates empty config with defaults', () => {
      const config = normalizeReferralConfig();
      expect(config.enabled).toBe(false);
      expect(config.code).toBe('');
      expect(config.customSlug).toBe('');
    });

    it('normalizes existing config', () => {
      const config = normalizeReferralConfig({
        enabled: true,
        code: 'abc234',
        customSlug: 'MySlug',
      });
      expect(config.enabled).toBe(true);
      expect(config.code).toBe('ABC234');
      expect(config.customSlug).toBe('myslug');
    });
  });

  describe('generateReferralLink', () => {
    it('generates valid referral link', () => {
      const link = generateReferralLink('ABC234');
      expect(link).toBe('https://app.toqua.co/signup?ref=ABC234');
    });

    it('handles custom base URL', () => {
      const link = generateReferralLink('ABC234', 'https://custom.com');
      expect(link).toBe('https://custom.com/signup?ref=ABC234');
    });

    it('returns empty string for invalid code', () => {
      expect(generateReferralLink('')).toBe('');
      expect(generateReferralLink('invalid')).toBe('');
    });
  });

  describe('parseReferralCodeFromUrl', () => {
    it('parses code from URL', () => {
      const code = parseReferralCodeFromUrl('https://app.toqua.co/signup?ref=ABC234');
      expect(code).toBe('ABC234');
    });

    it('parses code with referral param', () => {
      const code = parseReferralCodeFromUrl('https://app.toqua.co/signup?referral=xyz789');
      expect(code).toBe('XYZ789');
    });

    it('returns null for invalid URL', () => {
      expect(parseReferralCodeFromUrl('not-a-url')).toBeNull();
      expect(parseReferralCodeFromUrl('https://app.toqua.co/signup')).toBeNull();
    });

    it('validates parsed code', () => {
      const code = parseReferralCodeFromUrl('https://app.toqua.co/signup?ref=invalid');
      expect(code).toBeNull();
    });
  });

  describe('calculateConversionRate', () => {
    it('calculates conversion rate', () => {
      const stats = {
        totalClicks: 100,
        totalPaidConversions: 10,
      };
      expect(calculateConversionRate(stats)).toBe(10);
    });

    it('returns 0 for no clicks', () => {
      const stats = {
        totalClicks: 0,
        totalPaidConversions: 5,
      };
      expect(calculateConversionRate(stats)).toBe(0);
    });
  });

  describe('formatReferralRevenue', () => {
    it('formats USD revenue', () => {
      const formatted = formatReferralRevenue(1234.56, 'usd');
      expect(formatted).toContain('1,234.56');
    });

    it('formats MXN revenue', () => {
      const formatted = formatReferralRevenue(1234.56, 'mxn');
      expect(formatted).toContain('1,234.56');
    });
  });

  describe('getReferralTier', () => {
    it('returns bronze for 0 conversions', () => {
      const tier = getReferralTier(0);
      expect(tier.id).toBe('bronze');
    });

    it('returns silver for 5 conversions', () => {
      const tier = getReferralTier(5);
      expect(tier.id).toBe('silver');
    });

    it('returns gold for 20 conversions', () => {
      const tier = getReferralTier(20);
      expect(tier.id).toBe('gold');
    });

    it('returns platinum for 50 conversions', () => {
      const tier = getReferralTier(50);
      expect(tier.id).toBe('platinum');
    });
  });

  describe('getNextReferralTier', () => {
    it('returns silver as next tier for 0 conversions', () => {
      const nextTier = getNextReferralTier(0);
      expect(nextTier.id).toBe('silver');
    });

    it('returns gold as next tier for 5 conversions', () => {
      const nextTier = getNextReferralTier(5);
      expect(nextTier.id).toBe('gold');
    });

    it('returns null when at max tier', () => {
      const nextTier = getNextReferralTier(50);
      expect(nextTier).toBeNull();
    });
  });
});
