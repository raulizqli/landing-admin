function isDev() {
  const value = process.env.DEV;
  if (value === 'false' || value === '0') return false;
  if (value === 'true' || value === '1') return true;
  return process.env.NODE_ENV !== 'production';
}

globalThis.__VITE_ENV__ = new Proxy(
  {},
  {
    get(_, prop) {
      if (prop === 'DEV') return isDev();
      if (prop === 'PROD') return !isDev();
      if (prop === 'SSR') return false;
      if (prop === 'MODE') return process.env.MODE || process.env.NODE_ENV || 'test';
      if (prop === 'BASE_URL') return process.env.BASE_URL || '/';
      const value = process.env[prop];
      return value === undefined ? '' : value;
    },
  },
);
