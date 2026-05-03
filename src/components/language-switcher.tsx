import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGS } from "@/i18n";
import { Flag } from "./flag";

const LANG_META: Record<string, { code: string; country: string }> = {
  fr: { code: "FR", country: "fr" },
  en: { code: "EN", country: "us" },
  es: { code: "ES", country: "es" },
  de: { code: "DE", country: "de" },
  it: { code: "IT", country: "it" },
  "pt-br": { code: "PT", country: "br" },
  ja: { code: "日", country: "jp" },
  ko: { code: "한", country: "kr" },
  ru: { code: "RU", country: "ru" },
  "zh-chs": { code: "中", country: "cn" },
};

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const current = i18n.resolvedLanguage ?? "en";
  const meta = LANG_META[current] ?? {
    code: current.slice(0, 2).toUpperCase(),
    country: current,
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-10 h-10 rounded-full flex items-center justify-center border border-bungie-border hover:border-bungie-accent/50 transition-colors overflow-hidden"
        title="Langue"
        aria-label="Langue"
      >
        <Flag code={meta.country} size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 panel py-1 z-50 animate-fade-in">
          {SUPPORTED_LANGS.map((l) => {
            const active = current === l.code;
            const m = LANG_META[l.code] ?? {
              code: l.code.toUpperCase(),
              country: l.code,
            };
            return (
              <button
                key={l.code}
                onClick={() => {
                  i18n.changeLanguage(l.code);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                  active
                    ? "text-bungie-accent font-semibold"
                    : "text-bungie-text/80 hover:text-white hover:bg-white/5"
                }`}
              >
                <Flag code={m.country} size={14} />
                <span className="flex-1 text-left truncate">{l.label}</span>
                <span className="text-[10px] font-mono opacity-70 shrink-0">
                  {m.code}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}