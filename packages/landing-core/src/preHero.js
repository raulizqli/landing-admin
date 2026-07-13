
export function shouldShowPreHero(data) {
  if (!data?.preHeroEnabled) return false;

  const imageUrl = String(data?.preHeroImageUrl ?? '').trim();
  if (!imageUrl) return false;

  if (data?.preHeroMode === 'split') {
    const title = String(data?.preHeroTitle ?? '').trim();
    const text = String(data?.preHeroText ?? '').trim();
    return Boolean(title || text);
  }

  return true;
}

export function splitPreHeroParagraphs(text) {
  return String(text ?? '')
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
