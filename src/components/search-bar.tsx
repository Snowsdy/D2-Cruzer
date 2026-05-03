import { useEffect, useRef } from "react"
import { useSearchStore } from "@/store/search"
import { useTranslation } from "react-i18next"
import { IconSearch } from "./icon"

export function SearchBar() {
  const { query, setQuery } = useSearchStore()
  const { t } = useTranslation()
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isTypingInField =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"

      // Intercept WebView2's native find-in-page shortcuts so the ugly
      // browser overlay never appears — redirect to our own search field.
      if ((e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "F")) {
        e.preventDefault()
        e.stopPropagation()
        ref.current?.focus()
        ref.current?.select()
        return
      }
      if (e.key === "F3" || ((e.ctrlKey || e.metaKey) && e.key === "g")) {
        e.preventDefault()
        e.stopPropagation()
        ref.current?.focus()
        return
      }

      if (
        (e.key === "/" || (e.key === "k" && (e.ctrlKey || e.metaKey))) &&
        !isTypingInField
      ) {
        e.preventDefault()
        ref.current?.focus()
      }
      if (e.key === "Escape" && document.activeElement === ref.current) {
        ref.current?.blur()
      }
    }
    // Use capture phase so we catch the event before WebView2's internal
    // accelerator translation can open the native find bar.
    document.addEventListener("keydown", onKey, true)
    return () => document.removeEventListener("keydown", onKey, true)
  }, [])

  return (
    <div className="relative max-w-md min-w-50 flex-1">
      <span className="text-bungie-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
        <IconSearch size={14} />
      </span>
      <input
        ref={ref}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("search.placeholder")}
        className="bg-bungie-panel/70 border-bungie-border focus:border-bungie-accent/60 placeholder:text-bungie-muted h-8 w-full rounded-full border pr-16 pl-9 text-xs transition-colors focus:outline-none"
      />
      <span className="text-bungie-muted/70 border-bungie-border pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border px-1.5 py-0.5 font-mono text-[10px]">
        {query ? "ESC" : "/"}
      </span>
      {query && (
        <button
          onClick={() => setQuery("")}
          className="text-bungie-muted absolute top-1/2 right-10 -translate-y-1/2 text-xs hover:text-white"
        >
          ✕
        </button>
      )}
    </div>
  )
}
