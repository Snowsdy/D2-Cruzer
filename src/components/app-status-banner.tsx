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
import { useAppStatus, useVisibleAnnouncements } from "@/hooks/useAppStatus"
import { useDismissedAnnouncements } from "@/store/dismissedAnnouncements"
import { sanitizeHtml } from "@/utils/sanitizeHtml"
import type { StatusSeverity } from "@/api/appStatus"

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
}

async function openExternal(url: string) {
  try {
    const { open } = await import("@tauri-apps/plugin-shell")
    await open(url)
  } catch {
    window.open(url, "_blank", "noopener,noreferrer")
  }
}

export function AppStatusBanner() {
  const { data } = useAppStatus()
  const announcements = useVisibleAnnouncements()
  const dismiss = useDismissedAnnouncements((s) => s.dismiss)

  const maintenance = data?.maintenance?.enabled ? data.maintenance : null
  if (!maintenance && announcements.length === 0) return null

  return (
    <>
      {maintenance && (
        <div
          className={`border-b ${SEVERITY_STYLE[maintenance.severity].border} ${
            SEVERITY_STYLE[maintenance.severity].bg
          } ${SEVERITY_STYLE[maintenance.severity].text} flex items-center gap-3 px-4 py-2 text-sm`}
        >
          <span
            className={`shrink-0 text-lg ${SEVERITY_STYLE[maintenance.severity].icon}`}
          >
            {SEVERITY_STYLE[maintenance.severity].glyph}
          </span>
          <span
            className="min-w-0 flex-1"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(maintenance.message),
            }}
          />
          {maintenance.expectedEndsAt && (
            <span className="shrink-0 text-xs font-bold tracking-widest uppercase opacity-80">
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
        const s = SEVERITY_STYLE[a.severity]
        return (
          <div
            key={a.id}
            className={`border-b ${s.border} ${s.bg} ${s.text} flex items-center gap-3 px-4 py-2 text-sm`}
          >
            <span className={`shrink-0 text-lg ${s.icon}`}>{s.glyph}</span>
            <span
              className="min-w-0 flex-1"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(a.message) }}
            />
            {a.link && (
              <button
                onClick={() => openExternal(a.link!.url)}
                className="shrink-0 rounded border border-current/40 px-2 py-1 text-xs font-bold tracking-widest uppercase transition-colors hover:bg-white/5"
              >
                {a.link.label} ↗
              </button>
            )}
            {a.dismissible && (
              <button
                onClick={() => dismiss(a.id)}
                aria-label="Ignorer"
                title="Ignorer"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current/40 text-[11px] transition-colors hover:bg-white/10"
              >
                ×
              </button>
            )}
          </div>
        )
      })}
    </>
  )
}
