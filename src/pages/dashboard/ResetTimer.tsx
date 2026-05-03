import { useEffect, useState } from "react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

// Returns the next occurrence of the given UTC day-of-week (0-6) at hour:minute UTC
function nextUtcDate(dayOfWeek: number, hour: number, minute = 0): Date {
  const now = new Date()
  const target = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      hour,
      minute,
      0,
      0
    )
  )
  let delta = (dayOfWeek - now.getUTCDay() + 7) % 7
  if (delta === 0 && target.getTime() <= now.getTime()) delta = 7
  target.setUTCDate(target.getUTCDate() + delta)
  return target
}

function fmtCountdown(d: Date): { str: string; totalSec: number } {
  const ms = d.getTime() - Date.now()
  const total = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const parts: string[] = []
  if (days > 0) parts.push(`${days}j`)
  parts.push(`${String(hours).padStart(2, "0")}h`)
  parts.push(`${String(minutes).padStart(2, "0")}m`)
  return { str: parts.join(" "), totalSec: total }
}

/* -------------------------------------------------------------------------- */
/* Single timer tile — with progress bar showing cycle position.              */
/* -------------------------------------------------------------------------- */

interface TimerProps {
  icon: ReactNode
  label: string
  target: Date
  cycleSeconds: number
  accent?: "accent" | "warm" | "sky" | "emerald"
  hint?: string
  highlight?: boolean
}

function Timer({
  icon,
  label,
  target,
  cycleSeconds,
  accent = "accent",
  hint,
  highlight = false,
}: TimerProps) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const { str: countdown, totalSec } = fmtCountdown(target)
  // "Elapsed %" — how far we are through the current cycle.
  const elapsed = Math.min(
    100,
    Math.max(0, ((cycleSeconds - totalSec) / cycleSeconds) * 100)
  )

  const accentMap = {
    accent: {
      text: "#f3075e",
      soft: "rgba(243,7,94,0.15)",
      border: "rgba(243,7,94,0.28)",
    },
    warm: {
      text: "#f5a623",
      soft: "rgba(245,166,35,0.15)",
      border: "rgba(245,166,35,0.3)",
    },
    sky: {
      text: "#38bdf8",
      soft: "rgba(56,189,248,0.13)",
      border: "rgba(56,189,248,0.28)",
    },
    emerald: {
      text: "#34d399",
      soft: "rgba(52,211,153,0.13)",
      border: "rgba(52,211,153,0.28)",
    },
  }[accent]

  return (
    <div
      className="relative overflow-hidden rounded-xl p-4 transition-all hover:-translate-y-0.5"
      style={{
        background: highlight
          ? `linear-gradient(135deg, ${accentMap.soft}, rgba(13,13,22,0.9))`
          : "linear-gradient(180deg, rgba(17,17,29,0.85), rgba(13,13,22,0.85))",
        border: `1px solid ${highlight ? accentMap.border : "rgba(31,32,48,0.7)"}`,
      }}
    >
      {highlight && (
        <div
          className="absolute -top-8 -right-8 h-24 w-24 rounded-full blur-2xl"
          style={{ background: accentMap.soft }}
        />
      )}
      <div className="relative flex items-center gap-2.5">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: accentMap.soft,
            color: accentMap.text,
            border: `1px solid ${accentMap.border}`,
          }}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="text-[10px] font-extrabold tracking-[0.22em] uppercase"
            style={{ color: accentMap.text }}
          >
            {label}
          </div>
          {hint && (
            <div className="text-bungie-muted truncate text-[10px] leading-tight">
              {hint}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 text-[26px] leading-none font-extrabold text-white tabular-nums">
        {countdown}
      </div>

      {/* Progress bar — shows how much of the cycle has elapsed. */}
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-black/40">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{
            width: `${elapsed}%`,
            background: `linear-gradient(90deg, ${accentMap.text}, ${accentMap.text}99)`,
            boxShadow: `0 0 8px ${accentMap.text}80`,
          }}
        />
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

const IcDaily = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="5" />
    <path
      d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
)
const IcWeekly = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
)
const IcXur = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 11c3-5 15-5 18 0-3 5-15 5-18 0z" />
    <circle cx="12" cy="11" r="3" fill="currentColor" />
  </svg>
)

/* -------------------------------------------------------------------------- */
/* Reset timers row                                                           */
/* -------------------------------------------------------------------------- */

const DAY = 24 * 3600
const WEEK = 7 * DAY

export function ResetTimers() {
  const { t } = useTranslation()
  const weeklyReset = nextUtcDate(2, 17) // Tuesday 17:00 UTC

  const dailyReset = (() => {
    const now = new Date()
    const target = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        17,
        0,
        0,
        0
      )
    )
    if (target.getTime() <= now.getTime()) {
      target.setUTCDate(target.getUTCDate() + 1)
    }
    return target
  })()

  // Xûr: arrives Friday 17:00 UTC → departs Tuesday 17:00 UTC
  const xurArrives = nextUtcDate(5, 17)
  const xurDeparts = nextUtcDate(2, 17)
  const xurHere = xurArrives.getTime() > xurDeparts.getTime()

  // Xûr's "here" cycle is 4 days (Fri→Tue), "away" cycle is 3 days (Tue→Fri).
  const xurCycleSec = xurHere ? 4 * DAY : 3 * DAY

  return (
    <div className="stagger grid gap-3 md:grid-cols-3">
      <Timer
        icon={IcDaily}
        label={t("dashboard.dailyReset")}
        target={dailyReset}
        cycleSeconds={DAY}
        accent="sky"
        hint="17:00 UTC"
      />
      <Timer
        icon={IcWeekly}
        label={t("dashboard.weeklyReset")}
        target={weeklyReset}
        cycleSeconds={WEEK}
        accent="accent"
        hint="Mardi 17:00 UTC"
      />
      <Timer
        icon={IcXur}
        label={xurHere ? t("dashboard.xurLeaves") : t("dashboard.xurArrives")}
        target={xurHere ? xurDeparts : xurArrives}
        cycleSeconds={xurCycleSec}
        accent="warm"
        hint={xurHere ? t("dashboard.xurHere") : t("dashboard.xurSoon")}
        highlight={xurHere}
      />
    </div>
  )
}
