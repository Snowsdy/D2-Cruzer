import { useState } from "react"
import { useSeason } from "../hooks/useSeason"
import { SeasonModal } from "./season-modal"

/**
 * Compact header chip — matches the LivePlayersBadge pill style
 * (`h-9 px-3 rounded-full`) so the header reads as one cohesive row of
 * indicators rather than a mix of shapes.
 */
export function SeasonBadge() {
  const season = useSeason()
  const [open, setOpen] = useState(false)

  if (!season) return null

  const xpPct = Math.min(
    100,
    season.xpNeeded > 0 ? (season.xpProgress / season.xpNeeded) * 100 : 0
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={`${season.name} · Rang ${season.rank}${
          season.daysLeft != null ? ` · ${season.daysLeft}j restants` : ""
        }`}
        className="bg-bungie-panel/50 border-bungie-accent/25 hover:border-bungie-accent/60 flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2 transition-colors"
      >
        <span className="text-bungie-accent text-[10.5px] leading-none font-bold tracking-wider uppercase tabular-nums">
          S{season.number}
        </span>
        <span className="h-3 w-px bg-white/10" />
        <span className="font-mono text-[11px] leading-none font-bold text-white tabular-nums">
          {season.rank}
        </span>
        <span
          className="relative h-[2.5px] w-7 overflow-hidden rounded-full"
          style={{ background: "rgba(0,0,0,0.55)" }}
        >
          <span
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
            style={{
              width: `${xpPct}%`,
              background: "linear-gradient(90deg, #f3075e, #ff3d82)",
            }}
          />
        </span>
      </button>

      {open && <SeasonModal season={season} onClose={() => setOpen(false)} />}
    </>
  )
}
