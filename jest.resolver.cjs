const path = require('node:path');

const EXTENSIONS = ['.js', '.jsx', '.mjs', '.json'];

module.exports = (request, options) => {
  const tryResolve = (candidate) => {
    try {
      return options.defaultResolver(candidate, options);
    } catch {
      return undefined;
    }
  };

  const resolved = tryResolve(request);
  if (resolved) return resolved;

  if (request.startsWith('.') && !path.extname(request)) {
    for (const ext of EXTENSIONS) {
      const withExt = tryResolve(request + ext);
      if (withExt) return withExt;
    }
  }

  throw new Error(`Cannot resolve module ${request}`);
};
