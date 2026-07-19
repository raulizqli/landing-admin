import { describe, expect, it } from 'vitest';
import { getAiProviderDisplayName } from './aiProviderLabel';

describe('getAiProviderDisplayName', () => {
  it('presents technical providers using end-user labels', () => {
    expect(getAiProviderDisplayName('gemini', 'es')).toBe('Google Gemini');
    expect(getAiProviderDisplayName('ollama', 'es')).toBe('LeftSide AI');
    expect(getAiProviderDisplayName('local_ollama', 'es')).toBe('LeftSide AI Local');
    expect(getAiProviderDisplayName('openai_compatible', 'en')).toBe('Private provider');
  });

  it('does not expose unknown technical identifiers', () => {
    expect(getAiProviderDisplayName('custom_internal_engine', 'es')).toBe('LeftSide AI');
  });
});
