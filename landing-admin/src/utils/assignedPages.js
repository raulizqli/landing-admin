export function parsePageIdsInput(value) {
  const items = Array.isArray(value)
    ? value
    : String(value ?? '').split(/[\n,]/);

  return [...new Set(items.map((item) => String(item ?? '').trim()).filter(Boolean))];
}

export function pageOptionLabel(page) {
  const name = String(page?.name ?? '').trim();
  const id = String(page?.id ?? '').trim();
  return name || id;
}

function foldText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

export function pageMatchesQuery(page, query) {
  const q = foldText(String(query ?? '').trim());
  if (!q) return true;
  return foldText(page?.id).includes(q) || foldText(page?.name).includes(q);
}

export function filterUnselectedPages(options, selectedIds, query) {
  const selected = new Set(parsePageIdsInput(selectedIds));
  return (Array.isArray(options) ? options : []).filter((page) => {
    const id = String(page?.id ?? '').trim();
    if (!id || selected.has(id)) return false;
    return pageMatchesQuery(page, query);
  });
}

export function resolveSelectedPages(options, selectedIds) {
  const ids = parsePageIdsInput(selectedIds);
  const byId = new Map(
    (Array.isArray(options) ? options : []).map((page) => [String(page?.id ?? '').trim(), page]),
  );
  return ids.map((id) => {
    const page = byId.get(id);
    if (page) return page;
    return { id, name: id };
  });
}
