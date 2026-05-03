import { useGameStatus } from "@/hooks/useGameStatus";
import { sanitizeHtml } from "@/utils/sanitizeHtml";

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
} as const;

const openLink = async (url: string) => {
  try {
    const { open } = await import("@tauri-apps/plugin-shell");
    await open(url);
  } catch {
    window.open(url, "_blank");
  }
};

export function MaintenanceBanner() {
  const { status } = useGameStatus();
  if (!status.message) return null;

  const s = STYLE[status.severity];

  return (
    <div
      className={`border-b ${s.border} ${s.bg} ${s.text} px-4 py-2 text-sm flex items-center gap-3`}
    >
      <span className={`text-lg ${s.icon} shrink-0`}>
        {status.severity === "critical"
          ? "⚠"
          : status.severity === "warning"
            ? "⚒"
            : "ℹ"}
      </span>
      <span
        className="flex-1 min-w-0"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(status.message) }}
      />
      {status.link && (
        <button
          onClick={() => openLink(status.link!)}
          className="text-xs uppercase tracking-widest font-bold px-2 py-1 rounded border border-current/40 hover:bg-white/5 transition-colors shrink-0"
        >
          Détails ↗
        </button>
      )}
    </div>
  );
}