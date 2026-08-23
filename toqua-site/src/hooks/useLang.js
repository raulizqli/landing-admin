import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { DEFAULT_LANG } from '../content/site';
import { getMessages, langPath, normalizeLang, swapLangPath } from '../utils/i18n';

export function useLang() {
  const { lang: rawLang } = useParams();
  const lang = normalizeLang(rawLang || DEFAULT_LANG);
  const t = useMemo(() => getMessages(lang), [lang]);

  return {
    lang,
    t,
    path: (suffix = '') => langPath(lang, suffix),
    swapTo: (pathname, nextLang) => swapLangPath(pathname, nextLang),
  };
}
