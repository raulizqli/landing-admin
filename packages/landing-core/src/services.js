
export function createEmptyService() {
  return {
    title: '',
    description: '',
    imageUrl: '',
  };
}

export function normalizeService(item = {}) {
  return {
    title: item.title || item.titulo || '',
    description: item.description || item.descripcion || item.text || item.texto || '',
    imageUrl: item.imageUrl || item.imagenUrl || '',
  };
}

export function normalizeServices(items) {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeService);
}

export function getVisibleServices(data) {
  return normalizeServices(data?.services).filter((item) => (
    String(item.title ?? '').trim() || String(item.description ?? '').trim()
  ));
}

export function shouldShowServicesSection(data) {
  if (!data?.servicesSectionEnabled) return false;
  return getVisibleServices(data).length > 0;
}

export function splitServicesSectionText(text) {
  return String(text ?? '')
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
