import { useMemo } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/useProfile";
import { useAccountStats } from "@/hooks/useAccountStats";
import { readStat } from "@/api/stats";

/* -------------------------------------------------------------------------- */
/* Tile                                                                       */
/* -------------------------------------------------------------------------- */

function StatTile({
  icon,
  label,
  value,
  suffix,
  accent = "accent",
  tag,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  suffix?: ReactNode;
  accent?: "accent" | "warm" | "emerald" | "purple" | "sky";
  tag?: string;
}) {
  const accentTint: Record<string, string> = {
    accent: "rgba(243,7,94,0.12)",
    warm: "rgba(245,166,35,0.15)",
    emerald: "rgba(52,211,153,0.13)",
    purple: "rgba(168,85,247,0.14)",
    sky: "rgba(56,189,248,0.13)",
  };
  const accentBorder: Record<string, string> = {
    accent: "rgba(243,7,94,0.30)",
    warm: "rgba(245,166,35,0.30)",
    emerald: "rgba(52,211,153,0.28)",
    purple: "rgba(168,85,247,0.30)",
    sky: "rgba(56,189,248,0.28)",
  };
  const iconColor: Record<string, string> = {
    accent: "text-bungie-accent",
    warm: "text-[#f5a623]",
    emerald: "text-emerald-400",
    purple: "text-[#c09bff]",
    sky: "text-sky-400",
  };
  return (
    <div
      className="relative overflow-hidden rounded-xl p-4 transition-all hover:-translate-y-0.5 group"
      style={{
        background:
          "linear-gradient(180deg, rgba(17,17,29,0.85), rgba(13,13,22,0.85))",
        border: "1px solid rgba(31,32,48,0.7)",
      }}
    >
      {/* Accent glow halo — subtle, only on hover */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-2xl"
        style={{ background: accentTint[accent] }}
      />

      <div className="relative flex items-start justify-between gap-2">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconColor[accent]}`}
          style={{
            background: accentTint[accent],
            border: `1px solid ${accentBorder[accent]}`,
          }}
        >
          {icon}
        </div>
        {tag && (
          <span className="text-[9px] uppercase tracking-[0.2em] font-extrabold text-white/40">
            {tag}
          </span>
        )}
      </div>
      <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-bungie-muted mt-3">
        {label}
      </div>
      <div className="text-[26px] font-extrabold tabular-nums leading-none mt-1 text-white">
        {value}
        {suffix && (
          <span className="text-sm text-bungie-muted font-semibold ml-1">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

const Ic = {
  power: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3 7h7l-6 4 2 7-6-4-6 4 2-7-6-4h7z" />
    </svg>
  ),
  time: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  kills: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M13 19l6-6M16 16l4 4M19 21l2-2" />
    </svg>
  ),
  activities: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l3 3 5-6" />
    </svg>
  ),
  crown: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 18l2-9 4 4 3-7 3 7 4-4 2 9z" />
      <rect x="3" y="19" width="18" height="2" rx="1" />
    </svg>
  ),
  events: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2 5 5 .4-4 3.6 1 5-4-3-4 3 1-5-4-3.6 5-.4z" />
    </svg>
  ),
};

/* -------------------------------------------------------------------------- */
/* QuickStats                                                                 */
/* -------------------------------------------------------------------------- */

export function QuickStats() {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const stats = useAccountStats();

  const localStats = useMemo(() => {
    const chars = profile.data?.characters?.data ?? {};
    const charList = Object.values(chars);
    const highestLight = charList.reduce((m, c) => Math.max(m, c.light ?? 0), 0);
    return { highestLight, numChars: charList.length };
  }, [profile.data]);

  const pve = stats.data?.mergedAllCharacters?.results?.allPvE?.allTime;
  const pvp = stats.data?.mergedAllCharacters?.results?.allPvP?.allTime;

  const totalSeconds = readStat(pve, "secondsPlayed") + readStat(pvp, "secondsPlayed");
  const totalHours = Math.round(totalSeconds / 3600);
  const totalKills = readStat(pve, "kills") + readStat(pvp, "kills");
  const activitiesCleared = readStat(pve, "activitiesCleared");
  const pvpKd = readStat(pvp, "killsDeathsRatio");
  const publicEvents = readStat(pve, "publicEventsCompleted");

  return (
    <div className="stagger grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
      <StatTile
        icon={Ic.power}
        label={t("dashboard.stats.power")}
        value={localStats.highestLight.toLocaleString()}
        suffix="◆"
        accent="warm"
        tag="MAX"
      />
      <StatTile
        icon={Ic.time}
        label={t("dashboard.stats.playtime")}
        value={totalHours.toLocaleString()}
        suffix="h"
        accent="sky"
      />
      <StatTile
        icon={Ic.kills}
        label={t("dashboard.stats.totalKills")}
        value={totalKills.toLocaleString()}
        accent="accent"
        tag="TOTAL"
      />
      <StatTile
        icon={Ic.activities}
        label={t("dashboard.stats.activitiesCleared")}
        value={activitiesCleared.toLocaleString()}
        accent="emerald"
        tag="PVE"
      />
      <StatTile
        icon={Ic.crown}
        label={t("dashboard.stats.pvpKd")}
        value={pvpKd.toFixed(2)}
        accent="purple"
        tag="PVP"
      />
      <StatTile
        icon={Ic.events}
        label={t("dashboard.stats.publicEvents")}
        value={publicEvents.toLocaleString()}
        accent="warm"
        tag="PVE"
      />
    </div>
  );
}