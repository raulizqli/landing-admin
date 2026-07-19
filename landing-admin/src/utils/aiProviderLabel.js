const PROVIDER_LABELS = {
  openai: { es: 'OpenAI', en: 'OpenAI' },
  gemini: { es: 'Google Gemini', en: 'Google Gemini' },
  groq: { es: 'Groq', en: 'Groq' },
  anthropic: { es: 'Anthropic', en: 'Anthropic' },
  openai_compatible: { es: 'Proveedor privado', en: 'Private provider' },
  ollama: { es: 'LeftSide AI', en: 'LeftSide AI' },
  local: { es: 'LeftSide AI Local', en: 'LeftSide AI Local' },
  local_ollama: { es: 'LeftSide AI Local', en: 'LeftSide AI Local' },
  mock: { es: 'LeftSide AI (modo de prueba)', en: 'LeftSide AI (test mode)' },
};

export function getAiProviderDisplayName(provider, language = 'es') {
  const id = String(provider ?? '').trim().toLowerCase();
  const locale = language === 'en' ? 'en' : 'es';
  return PROVIDER_LABELS[id]?.[locale] || (id ? 'LeftSide AI' : '');
}
