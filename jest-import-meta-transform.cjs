module.exports = {
  process(sourceText) {
    if (!sourceText.includes('import.meta.env')) {
      return { code: sourceText };
    }
    return {
      code: sourceText.replaceAll('import.meta.env', '(globalThis.__VITE_ENV__)'),
    };
  },
};
