import { useEffect, useRef } from "react";
import { useSearchStore } from "@/store/search";
import { useTranslation } from "react-i18next";
import { IconSearch } from "./icon";

export function SearchBar() {
  const { query, setQuery } = useSearchStore();
  const { t } = useTranslation();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isTypingInField =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA";

      // Intercept WebView2's native find-in-page shortcuts so the ugly
      // browser overlay never appears — redirect to our own search field.
      if ((e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "F")) {
        e.preventDefault();
        e.stopPropagation();
        ref.current?.focus();
        ref.current?.select();
        return;
      }
      if (e.key === "F3" || ((e.ctrlKey || e.metaKey) && e.key === "g")) {
        e.preventDefault();
        e.stopPropagation();
        ref.current?.focus();
        return;
      }

      if (
        (e.key === "/" || (e.key === "k" && (e.ctrlKey || e.metaKey))) &&
        !isTypingInField
      ) {
        e.preventDefault();
        ref.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === ref.current) {
        ref.current?.blur();
      }
    };
    // Use capture phase so we catch the event before WebView2's internal
    // accelerator translation can open the native find bar.
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, []);

  return (
    <div className="relative flex-1 min-w-50 max-w-md">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-bungie-muted pointer-events-none">
        <IconSearch size={14} />
      </span>
      <input
        ref={ref}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("search.placeholder")}
        className="w-full h-8 pl-9 pr-16 rounded-full bg-bungie-panel/70 border border-bungie-border focus:border-bungie-accent/60 focus:outline-none text-xs placeholder:text-bungie-muted transition-colors"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-bungie-muted/70 border border-bungie-border rounded px-1.5 py-0.5 pointer-events-none">
        {query ? "ESC" : "/"}
      </span>
      {query && (
        <button
          onClick={() => setQuery("")}
          className="absolute right-10 top-1/2 -translate-y-1/2 text-bungie-muted hover:text-white text-xs"
        >
          ✕
        </button>
      )}
    </div>
  );
}