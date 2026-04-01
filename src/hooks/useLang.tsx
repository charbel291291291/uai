import { useState, useEffect, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { i18n, type Lang } from '../i18n';

// Dot-notation path getter (e.g. "nav.home")
function get(obj: Record<string, unknown>, path: string): string {
  const val = path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
  return typeof val === 'string' ? val : path;
}

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Simple string lookup via dot-path, e.g. t('nav.home') */
  t: (path: string) => string;
  isRTL: boolean;
}

export const LangContext = createContext<LangContextType>({
  lang: 'en',
  setLang: () => {},
  t: (p) => p,
  isRTL: false,
});

export const useLang = () => useContext(LangContext);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try { return (localStorage.getItem('uai-lang') as Lang) || 'en'; }
    catch { return 'en'; }
  });

  const isRTL = lang === 'ar';

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    try { localStorage.setItem('uai-lang', newLang); } catch {}
  };

  const t = (path: string): string =>
    get(i18n[lang] as unknown as Record<string, unknown>, path);

  useEffect(() => {
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [lang, isRTL]);

  return (
    <LangContext.Provider value={{ lang, setLang, t, isRTL }}>
      {children}
    </LangContext.Provider>
  );
}
