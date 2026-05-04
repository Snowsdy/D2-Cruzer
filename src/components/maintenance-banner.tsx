import { useGameStatus } from "@/hooks/useGameStatus"
import { sanitizeHtml } from "@/utils/sanitizeHtml"

const STYLE = {
  info: {
    bg: "bg-pink-500/15",
    border: "border-pink-500/40",
    text: "text-pink-200",
    icon: "text-pink-300",
  },
  warning: {
    bg: "bg-amber-500/15",
    border: "border-amber-500/50",
    text: "text-amber-100",
    icon: "text-amber-300",
  },
  critical: {
    bg: "bg-red-500/15",
    border: "border-red-500/50",
    text: "text-red-100",
    icon: "text-red-300",
  },
} as const

const openLink = async (url: string) => {
  try {
    const { openUrl } = await import("@tauri-apps/plugin-opener")
    await openUrl(url)
  } catch {
    window.open(url, "_blank")
  }
}

export function MaintenanceBanner() {
  const { status } = useGameStatus()
  if (!status.message) return null

  const s = STYLE[status.severity]

  return (
    <div
      className={`border-b ${s.border} ${s.bg} ${s.text} flex items-center gap-3 px-4 py-2 text-sm`}
    >
      <span className={`text-lg ${s.icon} shrink-0`}>
        {status.severity === "critical"
          ? "⚠"
          : status.severity === "warning"
            ? "⚒"
            : "ℹ"}
      </span>
      <span
        className="min-w-0 flex-1"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(status.message) }}
      />
      {status.link && (
        <button
          onClick={() => openLink(status.link!)}
          className="shrink-0 rounded border border-current/40 px-2 py-1 text-xs font-bold tracking-widest uppercase transition-colors hover:bg-white/5"
        >
          Détails ↗
        </button>
      )}
    </div>
  )
}
