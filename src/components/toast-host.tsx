import { useTranslation } from "react-i18next";
import { useToastStore } from "../store/toast";

const KIND_STYLE: Record<string, string> = {
  success: "border-emerald-500/50 bg-emerald-500/10 text-emerald-200",
  error: "border-red-500/60 bg-red-500/10 text-red-200",
  info: "border-bungie-accent/50 bg-bungie-accent/10 text-bungie-accent",
};

const KIND_ICON: Record<string, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

export function ToastHost() {
  const { t } = useTranslation();
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="fixed top-20 right-4 z-60 space-y-2 pointer-events-none">
      {toasts.map((n) => {
        if (n.kind === "route" && n.meta) {
          return (
            <div
              key={n.id}
              className="pointer-events-auto min-w-[320px] max-w-105 rounded-xl border border-bungie-accent/60 bg-linear-to-br from-bungie-bg/95 to-bungie-panel/95 backdrop-blur-md shadow-[0_12px_40px_-10px_rgba(243,7,94,0.6)] overflow-hidden animate-fade-in"
            >
              <div className="h-1 bg-bungie-accent animate-[shimmerBg_1.6s_linear_infinite]" />
              <div className="px-4 py-3 flex items-center gap-3">
                <div className="shrink-0 w-10 h-10 rounded-full border-2 border-bungie-accent/70 flex items-center justify-center text-bungie-accent text-lg animate-pulse">
                  ▶
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] uppercase tracking-[0.25em] text-bungie-muted font-bold">
                    {t("toast.join")}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-semibold text-white/70 whitespace-nowrap">
                      {n.meta.section}
                    </span>
                    <span className="text-bungie-accent text-base leading-none">→</span>
                    <span className="text-base font-extrabold text-white truncate drop-shadow">
                      {n.meta.name}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => dismiss(n.id)}
                  className="text-xs opacity-60 hover:opacity-100 shrink-0"
                  aria-label={t("toast.close")}
                >
                  ✕
                </button>
              </div>
            </div>
          );
        }
        return (
          <div
            key={n.id}
            className={`pointer-events-auto min-w-65 max-w-95 px-4 py-2.5 rounded-lg border backdrop-blur-md animate-fade-in flex items-start gap-3 ${
              KIND_STYLE[n.kind]
            }`}
          >
            <span className="text-lg leading-none">{KIND_ICON[n.kind]}</span>
            <div className="text-sm flex-1 min-w-0 wrap-break-word">{n.message}</div>
            <button
              onClick={() => dismiss(n.id)}
              className="text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}