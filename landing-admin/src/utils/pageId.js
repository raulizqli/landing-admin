export function slugifyPageId(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export function isValidPageId(pageId) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(pageId ?? '').trim());
}
