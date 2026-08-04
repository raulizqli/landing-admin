import { describe, expect, it } from 'vitest';
import { mapAiError } from './aiAssistFunctions';

describe('mapAiError', () => {
  it('surfaces unavailable provider detail instead of INTERNAL', () => {
    expect(mapAiError({
      code: 'functions/unavailable',
      message: 'unavailable: Gemini (gemini-2.0-flash) respondió 401: API key invalid',
      details: {
        reason: 'ai_provider_failure',
        detail: 'Gemini (gemini-2.0-flash) respondió 401: API key invalid',
      },
    })).toContain('Gemini');
  });

  it('does not return bare INTERNAL for functions/internal', () => {
    const message = mapAiError({
      code: 'functions/internal',
      message: 'INTERNAL',
    });
    expect(message.toLowerCase()).not.toBe('internal');
    expect(message).toMatch(/API key|proveedor|configuración/i);
  });

  it('keeps resource-exhausted messages', () => {
    expect(mapAiError({
      code: 'functions/resource-exhausted',
      message: 'Cuota de IA full agotada (50/mes).',
    })).toContain('Cuota de IA');
  });
});
