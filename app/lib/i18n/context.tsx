"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Lang = "en" | "id";
type Theme = "dark" | "light";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const translationCache: Record<Lang, any> = { en: null, id: null };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const translationModules: Record<Lang, () => Promise<{ default: any }>> = {
  en: () => import("./en"),
  id: () => import("./id"),
};

async function loadTranslation(lang: Lang) {
  if (translationCache[lang]) return translationCache[lang];
  const mod = await translationModules[lang]();
  translationCache[lang] = mod.default;
  return mod.default;
}

interface LanguageContextValue {
  lang: Lang;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
  toggle: () => void;
  theme: Theme;
  toggleTheme: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [t, setT] = useState<any>(null);
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("planet-lang");
      if (saved === "en" || saved === "id") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLang(saved);
        document.documentElement.lang = saved;
      }
      const savedTheme = localStorage.getItem("planet-theme") as Theme | null;
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
      }
    } catch {
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  useEffect(() => {
    loadTranslation(lang).then(setT);
  }, [lang]);

  const toggle = () => {
    const next = lang === "en" ? "id" : "en";
    setLang(next);
    try {
      localStorage.setItem("planet-lang", next);
      document.documentElement.lang = next;
    } catch {}
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("planet-theme", next);
      document.documentElement.setAttribute("data-theme", next);
    } catch {}
  };

  if (!t) return null;

  return (
    <LanguageContext.Provider value={{ lang, t, toggle, theme, toggleTheme }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used within LanguageProvider");
  return ctx;
}
