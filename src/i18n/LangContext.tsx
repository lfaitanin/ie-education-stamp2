import { createContext, useContext, useState, type ReactNode } from 'react'
import translations, { type Language, type T } from './translations'

const STORAGE_KEY = 'ie-edu-lang'

function getSavedLang(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'pt' || saved === 'es') return saved
  } catch {}
  return 'en'
}

interface LangCtx { lang: Language; t: T; setLang: (l: Language) => void }
const LangContext = createContext<LangCtx>({
  lang: 'en', t: translations.en, setLang: () => {},
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(getSavedLang)

  function setLang(l: Language) {
    setLangState(l)
    try { localStorage.setItem(STORAGE_KEY, l) } catch {}
  }

  return (
    <LangContext.Provider value={{ lang, t: translations[lang] as T, setLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() { return useContext(LangContext) }
