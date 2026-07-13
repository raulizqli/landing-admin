
export function normalizeHostname(hostname) {
  return String(hostname ?? '').trim().toLowerCase().replace(/^www\./, '');
}

export function isLocalHostname(hostname) {
  const host = normalizeHostname(hostname);
  return !host || host === 'localhost' || host === '127.0.0.1';
}
