/**
 * Banner row for maintainer-controlled app status.
 *
 * Renders (top → bottom):
 *   1. Active maintenance banner (app-wide, non-dismissible)
 *   2. One row per active announcement the user hasn't dismissed
 *
 * Styling mirrors `MaintenanceBanner` (Bungie alerts) so the two feel
 * like one system from the user's perspective, even though they're fed by
 * different APIs.
 */
import { useAppStatus, useVisibleAnnouncements } from "@/hooks/useAppStatus";
import { useDismissedAnnouncements } from "@/store/dismissedAnnouncements";
import { sanitizeHtml } from "@/utils/sanitizeHtml";
import type { StatusSeverity } from "@/api/appStatus";

const SEVERITY_STYLE: Record<
  StatusSeverity,
  { bg: string; border: string; text: string; icon: string; glyph: string }
> = {
  info: {
    bg: "bg-sky-500/15",
    border: "border-sky-500/40",
    text: "text-sky-100",
    icon: "text-sky-300",
    glyph: "ℹ",
  },
  warning: {
    bg: "bg-amber-500/15",
    border: "border-amber-500/50",
    text: "text-amber-100",
    icon: "text-amber-300",
    glyph: "⚒",
  },
  critical: {
    bg: "bg-red-500/15",
    border: "border-red-500/50",
    text: "text-red-100",
    icon: "text-red-300",
    glyph: "⚠",
  },
};

async function openExternal(url: string) {
  try {
    const { open } = await import("@tauri-apps/plugin-shell");
    await open(url);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function AppStatusBanner() {
  const { data } = useAppStatus();
  const announcements = useVisibleAnnouncements();
  const dismiss = useDismissedAnnouncements((s) => s.dismiss);

  const maintenance = data?.maintenance?.enabled ? data.maintenance : null;
  if (!maintenance && announcements.length === 0) return null;

  return (
    <>
      {maintenance && (
        <div
          className={`border-b ${SEVERITY_STYLE[maintenance.severity].border} ${
            SEVERITY_STYLE[maintenance.severity].bg
          } ${SEVERITY_STYLE[maintenance.severity].text} px-4 py-2 text-sm flex items-center gap-3`}
        >
          <span className={`text-lg shrink-0 ${SEVERITY_STYLE[maintenance.severity].icon}`}>
            {SEVERITY_STYLE[maintenance.severity].glyph}
          </span>
          <span
            className="flex-1 min-w-0"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(maintenance.message) }}
          />
          {maintenance.expectedEndsAt && (
            <span className="text-xs uppercase tracking-widest font-bold opacity-80 shrink-0">
              fin prévue ·{" "}
              {new Date(maintenance.expectedEndsAt).toLocaleString(undefined, {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
      )}

      {announcements.map((a) => {
        const s = SEVERITY_STYLE[a.severity];
        return (
          <div
            key={a.id}
            className={`border-b ${s.border} ${s.bg} ${s.text} px-4 py-2 text-sm flex items-center gap-3`}
          >
            <span className={`text-lg shrink-0 ${s.icon}`}>{s.glyph}</span>
            <span
              className="flex-1 min-w-0"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(a.message) }}
            />
            {a.link && (
              <button
                onClick={() => openExternal(a.link!.url)}
                className="text-xs uppercase tracking-widest font-bold px-2 py-1 rounded border border-current/40 hover:bg-white/5 transition-colors shrink-0"
              >
                {a.link.label} ↗
              </button>
            )}
            {a.dismissible && (
              <button
                onClick={() => dismiss(a.id)}
                aria-label="Ignorer"
                title="Ignorer"
                className="w-6 h-6 rounded-full border border-current/40 hover:bg-white/10 transition-colors shrink-0 flex items-center justify-center text-[11px]"
              >
                ×
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}