import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import fr from "./locales/fr.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import de from "./locales/de.json";
import it from "./locales/it.json";
import ptBR from "./locales/pt-br.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";
import ru from "./locales/ru.json";
import zhCN from "./locales/zh-chs.json";

export const SUPPORTED_LANGS = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pt-br", label: "Português (BR)" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "ru", label: "Русский" },
  { code: "zh-chs", label: "简体中文" },
] as const;

// Maps our UI locale codes to the locale expected by the Bungie Manifest API
export const BUNGIE_LOCALE_MAP: Record<string, string> = {
  fr: "fr",
  en: "en",
  es: "es",
  de: "de",
  it: "it",
  "pt-br": "pt-br",
  ja: "ja",
  ko: "ko",
  ru: "ru",
  "zh-chs": "zh-chs",
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      es: { translation: es },
      de: { translation: de },
      it: { translation: it },
      "pt-br": { translation: ptBR },
      ja: { translation: ja },
      ko: { translation: ko },
      ru: { translation: ru },
      "zh-chs": { translation: zhCN },
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGS.map((l) => l.code),
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "cruzer-lang",
    },
  });

export default i18n;