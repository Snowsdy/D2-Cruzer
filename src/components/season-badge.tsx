import { useState } from "react";
import { useSeason } from "../hooks/useSeason";
import { SeasonModal } from "./season-modal";

/**
 * Compact header chip — matches the LivePlayersBadge pill style
 * (`h-9 px-3 rounded-full`) so the header reads as one cohesive row of
 * indicators rather than a mix of shapes.
 */
export function SeasonBadge() {
  const season = useSeason();
  const [open, setOpen] = useState(false);

  if (!season) return null;

  const xpPct = Math.min(
    100,
    season.xpNeeded > 0 ? (season.xpProgress / season.xpNeeded) * 100 : 0
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={`${season.name} · Rang ${season.rank}${
          season.daysLeft != null ? ` · ${season.daysLeft}j restants` : ""
        }`}
        className="flex items-center gap-1.5 h-7 px-2 rounded-full bg-bungie-panel/50 border border-bungie-accent/25 hover:border-bungie-accent/60 transition-colors shrink-0"
      >
        <span className="text-[10.5px] font-bold uppercase tracking-wider text-bungie-accent tabular-nums leading-none">
          S{season.number}
        </span>
        <span className="w-px h-3 bg-white/10" />
        <span className="font-mono text-[11px] font-bold tabular-nums text-white leading-none">
          {season.rank}
        </span>
        <span
          className="relative h-[2.5px] w-7 rounded-full overflow-hidden"
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
  );
}