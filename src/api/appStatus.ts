/**
 * Maintainer-controlled app status (distinct from Bungie's GlobalAlerts).
 *
 * Fetched from a JSON file hosted at a stable URL (see `APP_STATUS_URL`).
 * The admin panel at `/admin` produces this JSON; the maintainer commits it
 * to the hosting and every running instance of the app picks it up within
 * one poll cycle.
 *
 * Schema is versioned so we can evolve it without breaking older clients —
 * unknown `version` values are treated as "no status" rather than crashing.
 */

export type StatusSeverity = "info" | "warning" | "critical"

/** Active announcement. Shown as a banner; dismissible per user. */
export interface Announcement {
  /** Stable ID used for per-user dismissal tracking. */
  id: string
  severity: StatusSeverity
  /** Sanitized HTML is allowed (rendered via `sanitizeHtml`). */
  message: string
  /** Optional call-to-action link shown alongside the banner. */
  link?: { url: string; label: string }
  /** ISO 8601. Used to sort and to show "posted X ago" if relevant. */
  publishedAt: string
  /** ISO 8601. If set and past, the announcement is hidden. */
  expiresAt?: string
  /** Whether the user may dismiss it (some critical notices shouldn't be). */
  dismissible: boolean
}

/** App-level maintenance mode — banner + optional gate on sensitive actions. */
export interface Maintenance {
  enabled: boolean
  severity: StatusSeverity
  message: string
  /** When the window is expected to end. Shown as countdown if set. */
  expectedEndsAt?: string
}

/** Short release-note blob displayed in a "What's new" modal on first launch. */
export interface ReleaseNotes {
  version: string
  date: string
  highlights: string[]
  /** Full markdown / HTML body rendered in the modal. */
  body?: string
}

export interface AppStatus {
  /** Schema version — bump on breaking shape changes. Current: 1. */
  version: 1
  /** When the maintainer last updated this payload. */
  updatedAt: string
  maintenance: Maintenance | null
  announcements: Announcement[]
  releaseNotes: ReleaseNotes | null
}

export const APP_STATUS_SCHEMA_VERSION = 1

export const EMPTY_APP_STATUS: AppStatus = {
  version: APP_STATUS_SCHEMA_VERSION,
  updatedAt: new Date(0).toISOString(),
  maintenance: null,
  announcements: [],
  releaseNotes: null,
}

/**
 * Public URL the app polls. Can be overridden at build time by setting
 * `VITE_APP_STATUS_URL` in `.env` (useful for a staging environment).
 */
export const APP_STATUS_URL =
  (import.meta.env.VITE_APP_STATUS_URL as string | undefined) ??
  "https://cruzer.gg/status.json"

/**
 * Fetches the hosted status JSON. Never throws on network errors — callers
 * get `null` and silently fall back to "no status". Only verified-fresh
 * payloads with a known schema version are returned.
 */
export async function fetchAppStatus(
  signal?: AbortSignal
): Promise<AppStatus | null> {
  try {
    const res = await fetch(APP_STATUS_URL, {
      signal,
      // Bypass any CDN cache so banners go live promptly after an update.
      cache: "no-store",
      headers: { Accept: "application/json" },
    })
    if (!res.ok) return null
    const data = (await res.json()) as Partial<AppStatus>
    if (data?.version !== APP_STATUS_SCHEMA_VERSION) return null
    return {
      version: APP_STATUS_SCHEMA_VERSION,
      updatedAt: data.updatedAt ?? new Date(0).toISOString(),
      maintenance: data.maintenance ?? null,
      announcements: Array.isArray(data.announcements)
        ? data.announcements
        : [],
      releaseNotes: data.releaseNotes ?? null,
    }
  } catch {
    return null
  }
}

/**
 * Only returns announcements whose `expiresAt` hasn't passed, sorted newest
 * first. Used by the banner displayer so expired content disappears without
 * the maintainer having to prune the JSON.
 */
export function activeAnnouncements(
  list: Announcement[],
  now: Date = new Date()
): Announcement[] {
  const t = now.getTime()
  return list
    .filter((a) => !a.expiresAt || new Date(a.expiresAt).getTime() > t)
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
}
