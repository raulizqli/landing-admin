import { describe, expect, it } from 'vitest';
import { getAiProviderDisplayName, formatAiGenerationLabel } from './aiProviderLabel';

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

describe('formatAiGenerationLabel', () => {
  it('combines provider label and model id', () => {
    expect(formatAiGenerationLabel({
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      language: 'es',
    })).toBe('Google Gemini · gemini-2.0-flash');
    expect(formatAiGenerationLabel({
      provider: 'local_ollama',
      model: 'llama3.2',
      language: 'es',
    })).toBe('LeftSide AI Local · llama3.2');
  });
});
