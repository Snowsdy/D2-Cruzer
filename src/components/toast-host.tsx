import { useTranslation } from "react-i18next"
import { useToastStore } from "../store/toast"

const KIND_STYLE: Record<string, string> = {
  success: "border-emerald-500/50 bg-emerald-500/10 text-emerald-200",
  error: "border-red-500/60 bg-red-500/10 text-red-200",
  info: "border-bungie-accent/50 bg-bungie-accent/10 text-bungie-accent",
}

const KIND_ICON: Record<string, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
}

export function ToastHost() {
  const { t } = useTranslation()
  const { toasts, dismiss } = useToastStore()
  return (
    <div className="pointer-events-none fixed top-20 right-4 z-60 space-y-2">
      {toasts.map((n) => {
        if (n.kind === "route" && n.meta) {
          return (
            <div
              key={n.id}
              className="border-bungie-accent/60 from-bungie-bg/95 to-bungie-panel/95 animate-fade-in pointer-events-auto max-w-105 min-w-[320px] overflow-hidden rounded-xl border bg-linear-to-br shadow-[0_12px_40px_-10px_rgba(243,7,94,0.6)] backdrop-blur-md"
            >
              <div className="bg-bungie-accent h-1 animate-[shimmerBg_1.6s_linear_infinite]" />
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="border-bungie-accent/70 text-bungie-accent flex h-10 w-10 shrink-0 animate-pulse items-center justify-center rounded-full border-2 text-lg">
                  ▶
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-bungie-muted text-[9px] font-bold tracking-[0.25em] uppercase">
                    {t("toast.join")}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-xs font-semibold whitespace-nowrap text-white/70">
                      {n.meta.section}
                    </span>
                    <span className="text-bungie-accent text-base leading-none">
                      →
                    </span>
                    <span className="truncate text-base font-extrabold text-white drop-shadow">
                      {n.meta.name}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => dismiss(n.id)}
                  className="shrink-0 text-xs opacity-60 hover:opacity-100"
                  aria-label={t("toast.close")}
                >
                  ✕
                </button>
              </div>
            </div>
          )
        }
        return (
          <div
            key={n.id}
            className={`animate-fade-in pointer-events-auto flex max-w-95 min-w-65 items-start gap-3 rounded-lg border px-4 py-2.5 backdrop-blur-md ${
              KIND_STYLE[n.kind]
            }`}
          >
            <span className="text-lg leading-none">{KIND_ICON[n.kind]}</span>
            <div className="min-w-0 flex-1 text-sm wrap-break-word">
              {n.message}
            </div>
            <button
              onClick={() => dismiss(n.id)}
              className="text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )
      })}
    </div>
  )
}
