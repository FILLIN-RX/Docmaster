import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fr } from "../js/i18n/fr";
import { en } from "../js/i18n/en";

const I18nContext = createContext(null);

const translations = { fr, en };

function getInitialLang() {
  return localStorage.getItem("lang") || "fr";
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getInitialLang);

  const setLanguage = useCallback((code) => {
    if (translations[code]) {
      setLangState(code);
      localStorage.setItem("lang", code);
    }
  }, []);

  const t = useCallback(
    (key) => {
      return translations[lang]?.[key] || key;
    },
    [lang]
  );

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
