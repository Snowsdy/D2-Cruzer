/* eslint-disable @typescript-eslint/no-unused-vars */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { useProfile } from "@/hooks/useProfile";
import { useSelectedMembership } from "@/hooks/useProfile";
import { getActivityHistory } from "@/api/activityStats";
import { useAccountStats } from "@/hooks/useAccountStats";
import { readStat } from "@/api/stats";
import { useManifestStore } from "@/store/manifest";
import { BungieIcon } from "@/components/bungie-icon";
import { VendorHashes, getVendorDef } from "@/api/vendors";
import { fmtHoursMinutes as fmtHours } from "@/utils/format";
import { IconSparkle } from "@/components/icon";
import { WeaponMetaSection } from "./WeaponMetaSection";
import { CombatRecordsSection } from "./CombatRecords";
import { ActivityCompletionsSection } from "./ActivityCompletions";
import { GlobalDestinyStats } from "./GlobalDestinyStats";

interface SteamPlaytime {
  total_minutes: number;
  two_weeks_minutes: number;
  last_played: number;
  account_id: string;
}

function useSteamPlaytime() {
  return useQuery<SteamPlaytime | null>({
    queryKey: ["steamPlaytime"],
    queryFn: async () => {
      try {
        return await invoke<SteamPlaytime | null>("steam_destiny2_playtime");
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });
}

const HISTORY_COUNT = 250;

function readActivityStat(
  values: Record<string, { basic: { value: number } }> | undefined,
  key: string
): number {
  return values?.[key]?.basic?.value ?? 0;
}

type StatsTab = "trials" | "ironBanner" | "nightfall" | "crucible" | "gambit" | "playtime";

interface ModeConfig {
  key: StatsTab;
  labelKey: string;
  /** Bungie DestinyActivityModeType values to pull history for. */
  modes: number[];
  accent: string;
  accentBorder: string;
  /** CSS color used to tint the monochrome vendor crest. */
  tint: string;
  /** Damage type used as the visual identifier (color-matches the accent). */
  iconHash: number;
  /** Fallback symbol if the manifest icon isn't available. */
  fallback: string;
  flavour: "pvp" | "pve" | "gambit";
  /** Possible keys into the Bungie account stats `mergedAllCharacters.results` (Bungie sometimes uses snake_case, sometimes camelCase). */
  statsKeys: string[];
}

const MODES: ModeConfig[] = [
  {
    key: "trials",
    labelKey: "trials.title",
    modes: [84, 39, 41, 42],
    accent: "text-amber-300",
    accentBorder: "border-amber-500/40",
    iconHash: VendorHashes.SaintFourteen,
    tint: "#fbbf24",
    fallback: "⚔",
    flavour: "pvp",
    statsKeys: ["trialsOfOsiris", "trials_of_osiris"],
  },
  {
    key: "ironBanner",
    labelKey: "ironBanner.title",
    modes: [19, 43, 44, 45, 68, 90, 91],
    accent: "text-[#bdb76b]",
    accentBorder: "border-[#bdb76b]/50",
    iconHash: VendorHashes.LordSaladin,
    tint: "#bdb76b",
    fallback: "⚒",
    flavour: "pvp",
    statsKeys: ["ironBanner", "iron_banner"],
  },
  {
    key: "crucible",
    labelKey: "stats.crucible",
    modes: [5],
    accent: "text-red-400",
    accentBorder: "border-red-500/40",
    iconHash: VendorHashes.Shaxx,
    tint: "#ef4444",
    fallback: "✦",
    flavour: "pvp",
    statsKeys: ["allPvP"],
  },
  {
    key: "nightfall",
    labelKey: "nightfall.title",
    modes: [46, 47, 16, 17],
    accent: "text-blue-400",
    accentBorder: "border-blue-500/40",
    iconHash: VendorHashes.Zavala,
    tint: "#60a5fa",
    fallback: "☄",
    flavour: "pve",
    statsKeys: ["nightfall", "scored_nightfall", "all_strikes", "allStrikes"],
  },
  {
    key: "gambit",
    labelKey: "stats.gambit",
    modes: [63, 75],
    accent: "text-green-400",
    accentBorder: "border-green-500/40",
    iconHash: VendorHashes.Drifter,
    tint: "#22c55e",
    fallback: "𖤍",
    flavour: "gambit",
    statsKeys: ["gambit", "pvecomp_gambit", "allPvECompetitive"],
  },
];

function InlineTime({
  label,
  value,
  color,
  hint,
}: {
  label: string;
  value: string;
  color: string;
  hint?: string;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 h-11 rounded-md"
      style={{
        background: "rgba(0,0,0,0.45)",
        border: `1px solid ${color}30`,
      }}
    >
      <div>
        <div
          className="text-[8.5px] uppercase tracking-[0.22em] font-extrabold font-mono leading-none"
          style={{ color: `${color}cc` }}
        >
          {label}
        </div>
        <div
          className="text-sm font-extrabold tabular-nums leading-none mt-1"
          style={{ color }}
        >
          {value}
        </div>
      </div>
      {hint && (
        <div className="text-[9px] text-white/35 leading-tight">{hint}</div>
      )}
    </div>
  );
}

function HeroStat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="min-w-0 bg-black/35 border border-white/10 rounded-md px-2.5 py-2">
      <div className="text-[8.5px] uppercase tracking-widest text-white/45 font-extrabold font-mono leading-none">
        {label}
      </div>
      <div
        className={`text-[17px] font-extrabold tabular-nums mt-1 truncate leading-none ${accent ?? "text-white"}`}
      >
        {value}
      </div>
      {hint && (
        <div className="text-[9.5px] text-white/45 truncate mt-0.5 leading-tight">
          {hint}
        </div>
      )}
    </div>
  );
}

function PlaytimeHero() {
  const { profile } = useProfile();
  const accountStats = useAccountStats();
  const manifest = useManifestStore((s) => s.manifest);
  const steamQuery = useSteamPlaytime();
  const steamMinutes = steamQuery.data?.total_minutes ?? 0;
  const steamSeconds = steamMinutes * 60;
  const chars = profile.data?.characters?.data;

  const charsArr = useMemo(() => {
    if (!chars) return [];
    return Object.values(chars).sort(
      (a, b) => (Number(b.minutesPlayedTotal) || 0) - (Number(a.minutesPlayedTotal) || 0)
    );
  }, [chars]);

  // Canonical total: sum each character's `minutesPlayedTotal` (what the
  // Bungie profile endpoint returns — same number Wasted on Destiny shows).
  // allPvP+allPvE secondsPlayed from /Stats/ undercounts because menu/patrol
  // time isn't attributed to a specific bucket.
  const totalSeconds = useMemo(() => {
    return charsArr.reduce(
      (acc, c) => acc + (Number(c.minutesPlayedTotal) || 0) * 60,
      0
    );
  }, [charsArr]);

  const days = totalSeconds / 86400;

  const firstLogin = useMemo(() => {
    if (!charsArr.length) return null;
    return charsArr
      .map((c) => new Date(c.dateLastPlayed))
      .sort((a, b) => a.getTime() - b.getTime())[0];
  }, [charsArr]);

  const lastLogin = useMemo(() => {
    if (!charsArr.length) return null;
    return charsArr
      .map((c) => new Date(c.dateLastPlayed))
      .sort((a, b) => b.getTime() - a.getTime())[0];
  }, [charsArr]);

  const modeBreakdown = useMemo(() => {
    const r = accountStats.data?.mergedAllCharacters?.results as
      | Record<string, { allTime?: Record<string, { basic?: { value: number } }> } | undefined>
      | undefined;
    if (!r) return [];
    const rows = [
      { key: "pvp", label: "Épreuve", keys: ["allPvP"], color: "bg-red-400/70" },
      {
        key: "trials",
        label: "Trials of Osiris",
        keys: ["trialsOfOsiris", "trials_of_osiris"],
        color: "bg-amber-400/70",
      },
      {
        key: "iron",
        label: "Iron Banner",
        keys: ["ironBanner", "iron_banner"],
        color: "bg-yellow-400/70",
      },
      {
        key: "strikes",
        label: "Strikes",
        keys: ["allStrikes"],
        color: "bg-pink-400/70",
      },
      {
        key: "nightfall",
        label: "Nightfall",
        keys: ["nightfall", "scored_nightfall"],
        color: "bg-blue-400/70",
      },
      {
        key: "raid",
        label: "Raids",
        keys: ["raid"],
        color: "bg-purple-400/70",
      },
      {
        key: "gambit",
        label: "Gambit",
        keys: ["gambit", "pvecomp_gambit"],
        color: "bg-green-400/70",
      },
      {
        key: "pve",
        label: "PvE total",
        keys: ["allPvE"],
        color: "bg-emerald-400/70",
      },
    ]
      .map((row) => {
        let seconds = 0;
        for (const k of row.keys) {
          const s = readStat(r[k]?.allTime, "secondsPlayed");
          if (s > 0) {
            seconds = s;
            break;
          }
        }
        return { ...row, seconds };
      })
      .filter((x) => x.seconds > 0);
    rows.sort((a, b) => b.seconds - a.seconds);
    return rows;
  }, [accountStats.data]);

  // Aggregate combat stats across all available PvE + PvP modes.
  const combat = useMemo(() => {
    const r = accountStats.data?.mergedAllCharacters?.results;
    if (!r) return null;
    const pvpAll = r.allPvP?.allTime;
    const pveAll = r.allPvE?.allTime;
    const kills = readStat(pvpAll, "kills") + readStat(pveAll, "kills");
    const deaths = readStat(pvpAll, "deaths") + readStat(pveAll, "deaths");
    const assists = readStat(pvpAll, "assists") + readStat(pveAll, "assists");
    const precisionKills =
      readStat(pvpAll, "precisionKills") + readStat(pveAll, "precisionKills");
    const activitiesCleared =
      readStat(pvpAll, "activitiesCleared") +
      readStat(pveAll, "activitiesCleared");
    const activitiesEntered =
      readStat(pvpAll, "activitiesEntered") +
      readStat(pveAll, "activitiesEntered");
    const bestSingleGame = Math.max(
      readStat(pvpAll, "bestSingleGameKills"),
      readStat(pveAll, "bestSingleGameKills")
    );
    const orbsDropped =
      readStat(pvpAll, "orbsDropped") + readStat(pveAll, "orbsDropped");
    const resurrectionsGranted =
      readStat(pvpAll, "resurrectionsGranted") +
      readStat(pveAll, "resurrectionsGranted");
    const publicEvents = readStat(pveAll, "publicEventsCompleted");
    return {
      kills,
      deaths,
      assists,
      kd: deaths > 0 ? kills / deaths : kills,
      kda: deaths > 0 ? (kills + assists) / deaths : kills + assists,
      precisionKills,
      precisionPct: kills > 0 ? precisionKills / kills : 0,
      activitiesCleared,
      activitiesEntered,
      bestSingleGame,
      orbsDropped,
      resurrectionsGranted,
      publicEvents,
    };
  }, [accountStats.data]);

  const maxMode = Math.max(1, ...modeBreakdown.map((x) => x.seconds));
  const bgEmblem = charsArr[0]?.emblemBackgroundPath;
  const classDefs = manifest?.DestinyClassDefinition ?? {};
  const fmtDate = (d: Date) =>
    new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);

  const afkSeconds = steamSeconds > 0 ? Math.max(0, steamSeconds - totalSeconds) : 0;
  const afkPct = steamSeconds > 0 ? (afkSeconds / steamSeconds) * 100 : 0;

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-emerald-500/40 shadow-[0_0_24px_rgba(16,185,129,0.12)]"
      style={{
        backgroundImage: bgEmblem
          ? `linear-gradient(90deg, rgba(7,7,13,0.97) 0%, rgba(7,7,13,0.85) 45%, rgba(7,7,13,0.55) 100%), url(https://www.bungie.net${bgEmblem})`
          : "linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(17,17,29,0.9) 60%)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Compact top row — big number + inline Steam/AFK + last login */}
      <div className="relative flex items-center gap-5 px-5 py-4 flex-wrap md:flex-nowrap">
        <span className="w-11 h-11 rounded-md bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
          <IconSparkle size={22} />
        </span>
        <div className="min-w-0 shrink-0">
          <div className="text-[9px] uppercase tracking-[0.26em] font-extrabold text-emerald-300 font-mono">
            Temps de jeu — Bungie
          </div>
          <div className="text-3xl font-extrabold tabular-nums leading-none text-white mt-0.5">
            {totalSeconds > 0 ? fmtHours(totalSeconds) : "—"}
          </div>
          {days >= 1 && (
            <div className="text-[10px] text-emerald-300/75 tabular-nums mt-1">
              ≈ {days.toFixed(1)} jours en jeu
            </div>
          )}
        </div>

        {/* Inline Steam vs Bungie vs AFK chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <InlineTime
            label="Steam"
            value={steamMinutes > 0 ? fmtHours(steamSeconds) : "—"}
            color="#cbd5e1"
            hint={steamMinutes > 0 ? "localconfig.vdf" : "Non détecté"}
          />
          <InlineTime
            label="AFK + Menu"
            value={afkSeconds > 0 ? fmtHours(afkSeconds) : "0h"}
            color="#fbbf24"
            hint={afkSeconds > 0 ? `${afkPct.toFixed(1)}% Steam` : "—"}
          />
        </div>

        <div className="flex-1" />

        <div className="flex gap-4 text-[10px] shrink-0">
          <div>
            <div className="uppercase tracking-widest text-white/45 font-semibold">
              Premier login
            </div>
            <div className="text-sm font-bold text-white/90 mt-0.5">
              {firstLogin ? fmtDate(firstLogin) : "—"}
            </div>
          </div>
          <div>
            <div className="uppercase tracking-widest text-white/45 font-semibold">
              Dernier login
            </div>
            <div className="text-sm font-bold text-white/90 mt-0.5">
              {lastLogin ? fmtDate(lastLogin) : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Combat summary */}
      {combat && combat.activitiesEntered > 0 && (
        <div className="relative px-5 pb-3 pt-1">
          <div className="text-[9px] uppercase tracking-[0.25em] font-extrabold font-mono text-emerald-300/80 mb-2">
            Combat — à vie
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <HeroStat
              label="K/D"
              value={combat.kd.toFixed(2)}
              hint={`${combat.kills.toLocaleString()} K · ${combat.deaths.toLocaleString()} D`}
              accent="text-emerald-300"
            />
            <HeroStat
              label="K+A/D"
              value={combat.kda.toFixed(2)}
              hint={`+ ${combat.assists.toLocaleString()} A`}
            />
            <HeroStat
              label="Précision"
              value={`${(combat.precisionPct * 100).toFixed(1)}%`}
              hint={`${combat.precisionKills.toLocaleString()} headshots`}
            />
            <HeroStat
              label="Activités"
              value={combat.activitiesCleared.toLocaleString()}
              hint={`sur ${combat.activitiesEntered.toLocaleString()} entrées`}
            />
            <HeroStat
              label="Meilleure partie"
              value={combat.bestSingleGame.toLocaleString()}
              hint="kills en un match"
              accent="text-amber-300"
            />
            <HeroStat
              label="Events publics"
              value={combat.publicEvents.toLocaleString()}
              hint={`${combat.orbsDropped.toLocaleString()} orbes`}
            />
          </div>
        </div>
      )}

      {/* Mode breakdown */}
      {modeBreakdown.length > 0 && (
        <div className="relative px-5 pb-3">
          <div className="text-[9px] uppercase tracking-[0.25em] font-extrabold font-mono text-emerald-300/80 mb-2">
            Par mode
          </div>
          <div className="grid md:grid-cols-2 gap-x-5 gap-y-2">
            {modeBreakdown.map((row) => {
              const pct = (row.seconds / maxMode) * 100;
              const sharePct = totalSeconds ? (row.seconds / totalSeconds) * 100 : 0;
              return (
                <div key={row.key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-white">{row.label}</span>
                    <span className="text-bungie-muted tabular-nums">
                      {fmtHours(row.seconds)} ·{" "}
                      <span className="text-emerald-300">{sharePct.toFixed(1)}%</span>
                    </span>
                  </div>
                  <div className="h-2 bg-black/50 border border-white/5 rounded-full overflow-hidden">
                    <div
                      className={`${row.color} h-full rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Per-character breakdown */}
      {charsArr.length > 0 && (
        <div className="relative px-5 pb-4 pt-1">
          <div className="text-[9px] uppercase tracking-[0.25em] font-extrabold font-mono text-emerald-300/80 mb-2">
            Par personnage · {charsArr.length} {charsArr.length > 1 ? "Gardiens" : "Gardien"}
          </div>
          <div className="grid md:grid-cols-3 gap-2">
            {charsArr.map((c) => {
              const secs = (Number(c.minutesPlayedTotal) || 0) * 60;
              const share = totalSeconds ? (secs / totalSeconds) * 100 : 0;
              const className =
                classDefs[c.classHash]?.displayProperties?.name ?? "?";
              return (
                <div
                  key={c.characterId}
                  className="relative overflow-hidden rounded-lg border border-white/10 bg-black/40 p-3"
                  style={
                    c.emblemBackgroundPath
                      ? {
                          backgroundImage: `linear-gradient(180deg, rgba(7,7,13,0.65), rgba(7,7,13,0.95)), url(https://www.bungie.net${c.emblemBackgroundPath})`,
                          backgroundSize: "cover",
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2">
                    {c.emblemPath && (
                      <img
                        src={`https://www.bungie.net${c.emblemPath}`}
                        alt=""
                        className="w-9 h-9 rounded border border-white/15 bg-black/40 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate text-white">
                        {className}
                      </div>
                      <div className="text-[10px] text-white/70 tabular-nums">
                        {c.light} PL
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <div className="text-lg font-extrabold tabular-nums text-emerald-300">
                      {fmtHours(secs)}
                    </div>
                    <div className="text-[10px] text-white/50 tabular-nums">
                      {share.toFixed(1)}%
                    </div>
                  </div>
                  <div className="mt-1.5 h-1 bg-black/50 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400/70 h-full"
                      style={{ width: `${Math.min(100, share)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ModeCardGrid() {
  const { t, i18n } = useTranslation();
  const membership = useSelectedMembership();
  const { profile } = useProfile();
  const locale = i18n.resolvedLanguage ?? "en";
  const characterIds = useMemo(() => {
    const d = profile.data?.characters?.data;
    return d ? Object.keys(d) : [];
  }, [profile.data]);

  // Fetch banner art from each vendor def.
  const vendorDefs = useQueries({
    queries: MODES.map((m) => ({
      queryKey: ["vendorDef", m.iconHash, locale],
      queryFn: () => getVendorDef(m.iconHash, locale),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  });

  // Aggregate activity history per mode × character. More reliable than
  // /Stats/ for per-mode (Bungie's character-stats endpoint sometimes omits
  // trials_of_osiris / ironBanner buckets even when activity history has entries).
  const historyQueries = useQueries({
    queries: MODES.flatMap((m) =>
      characterIds.flatMap((cid) =>
        m.modes.map((mode) => ({
          queryKey: [
            "history",
            membership?.membershipType,
            membership?.membershipId,
            cid,
            mode,
          ] as const,
          queryFn: () =>
            getActivityHistory(
              membership!.membershipType,
              membership!.membershipId,
              cid,
              mode,
              HISTORY_COUNT
            ),
          enabled: !!membership,
          staleTime: 15_000,
          refetchInterval: 45_000,
        }))
      )
    ),
  });

  // Map results back to mode keys via index math.
  const modeAggregates = useMemo(() => {
    const agg = new Map<
      string,
      { matches: number; kills: number; deaths: number; seconds: number }
    >();
    let idx = 0;
    for (const m of MODES) {
      const seen = new Set<string>();
      let matches = 0,
        kills = 0,
        deaths = 0,
        seconds = 0;
      for (const _cid of characterIds) {
        for (const _mode of m.modes) {
          const q = historyQueries[idx++];
          for (const a of q?.data?.activities ?? []) {
            const id = a.activityDetails.instanceId;
            if (seen.has(id)) continue;
            seen.add(id);
            matches += 1;
            kills += readActivityStat(a.values, "kills");
            deaths += readActivityStat(a.values, "deaths");
            seconds += readActivityStat(a.values, "activityDurationSeconds");
          }
        }
      }
      agg.set(m.key, { matches, kills, deaths, seconds });
    }
    return agg;
  }, [historyQueries, characterIds]);

  // Pull richer stats per mode from the aggregate account stats
  // (kills, deaths, winrate, precision) — /Stats/ has these ready.
  const accountStats = useAccountStats();
  const modeStats = useMemo(() => {
    const r = accountStats.data?.mergedAllCharacters?.results;
    const out = new Map<
      string,
      {
        kills: number;
        deaths: number;
        assists: number;
        precisionKills: number;
        entered: number;
        won: number;
      }
    >();
    if (!r) return out;
    for (const m of MODES) {
      let entry;
      for (const k of m.statsKeys) {
        const b = (r as Record<string, { allTime?: Parameters<typeof readStat>[0] }>)[k]?.allTime;
        if (b) {
          entry = b;
          break;
        }
      }
      if (!entry) continue;
      out.set(m.key, {
        kills: readStat(entry, "kills"),
        deaths: readStat(entry, "deaths"),
        assists: readStat(entry, "assists"),
        precisionKills: readStat(entry, "precisionKills"),
        entered: readStat(entry, "activitiesEntered"),
        won: readStat(entry, "activitiesWon"),
      });
    }
    return out;
  }, [accountStats.data]);

  return (
    <div className="stagger grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {MODES.map((m, i) => {
        const banner = vendorDefs[i]?.data?.displayProperties?.largeIcon;
        const agg = modeAggregates.get(m.key) ?? {
          matches: 0,
          kills: 0,
          deaths: 0,
          seconds: 0,
        };
        const s = modeStats.get(m.key);
        // Prefer the richer account-stats numbers when available, fall back to
        // history aggregate counts (which only cover the last HISTORY_COUNT).
        const kills = s?.kills ?? agg.kills;
        const deaths = s?.deaths ?? agg.deaths;
        const assists = s?.assists ?? 0;
        const kd = deaths > 0 ? kills / deaths : kills;
        const kda = deaths > 0 ? (kills + assists) / deaths : kills + assists;
        const precisionPct =
          kills > 0 && s?.precisionKills ? (s.precisionKills / kills) * 100 : 0;
        const activities = s?.entered ?? agg.matches;
        const won = s?.won ?? 0;
        const winrate = activities > 0 ? (won / activities) * 100 : 0;
        const hours = Math.floor(agg.seconds / 3600);
        const hasData = kills + deaths + activities > 0;

        return (
          <div
            key={m.key}
            className="relative rounded-lg overflow-hidden transition-all hover:-translate-y-0.5"
            style={{
              backgroundImage: banner
                ? `linear-gradient(135deg, rgba(7,7,13,0.95) 0%, rgba(7,7,13,0.65) 55%, rgba(7,7,13,0.35) 100%), url(https://www.bungie.net${banner})`
                : `linear-gradient(135deg, ${m.tint}22, rgba(7,7,13,0.9))`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              border: `1px solid ${m.tint}55`,
              boxShadow: `0 6px 20px -8px ${m.tint}50`,
            }}
          >
            {/* Left tier stripe */}
            <div
              className="absolute left-0 top-3 bottom-3 w-0.5"
              style={{
                background: `linear-gradient(180deg, ${m.tint}, transparent)`,
                boxShadow: `0 0 10px ${m.tint}`,
              }}
            />

            <div className="relative p-4 flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-center gap-3">
                <BungieIcon
                  source="vendorCrest"
                  hash={m.iconHash}
                  size={42}
                  tint={m.tint}
                  fallback={
                    <span className="text-2xl leading-none">{m.fallback}</span>
                  }
                />
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-[15px] text-white drop-shadow leading-tight truncate">
                    {t(m.labelKey)}
                  </div>
                  <div
                    className="text-[9px] uppercase tracking-[0.22em] font-extrabold mt-0.5"
                    style={{ color: m.tint }}
                  >
                    {m.flavour === "pve"
                      ? "PvE"
                      : m.flavour === "gambit"
                        ? "Gambit"
                        : "PvP"}
                    {hasData && ` · ${hours}h · ${activities.toLocaleString("fr-FR")} activités`}
                  </div>
                </div>
              </div>

              {!hasData ? (
                <div className="text-[11px] text-white/45 italic py-2">
                  Pas encore joué ce mode.
                </div>
              ) : (
                <>
                  {/* Primary stats — K/D big number + winrate */}
                  <div className="grid grid-cols-3 gap-2">
                    <PrimaryChip
                      label="K/D"
                      value={kd.toFixed(2)}
                      color={m.tint}
                      big
                    />
                    <PrimaryChip
                      label="K+A/D"
                      value={kda.toFixed(2)}
                      color="#ffffff"
                    />
                    {m.flavour === "pvp" ? (
                      <PrimaryChip
                        label="Winrate"
                        value={`${winrate.toFixed(1)}%`}
                        color={winrate >= 50 ? "#34d399" : "#f87171"}
                      />
                    ) : (
                      <PrimaryChip
                        label="Précision"
                        value={`${precisionPct.toFixed(1)}%`}
                        color="#fde047"
                      />
                    )}
                  </div>

                  {/* Secondary stats — kills / deaths / assists */}
                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono font-extrabold tabular-nums pt-2 border-t border-white/5">
                    <span className="text-emerald-300">
                      <span className="text-white/40 uppercase tracking-widest mr-1">
                        K
                      </span>
                      {kills.toLocaleString("fr-FR")}
                    </span>
                    <span className="text-red-300">
                      <span className="text-white/40 uppercase tracking-widest mr-1">
                        D
                      </span>
                      {deaths.toLocaleString("fr-FR")}
                    </span>
                    <span className="text-blue-300">
                      <span className="text-white/40 uppercase tracking-widest mr-1">
                        A
                      </span>
                      {assists.toLocaleString("fr-FR")}
                    </span>
                    {m.flavour === "pvp" && won > 0 && (
                      <span className="text-amber-300">
                        <span className="text-white/40 uppercase tracking-widest mr-1">
                          W
                        </span>
                        {won.toLocaleString("fr-FR")}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PrimaryChip({
  label,
  value,
  color,
  big,
}: {
  label: string;
  value: string;
  color: string;
  big?: boolean;
}) {
  return (
    <div
      className="rounded-md px-2 py-1.5"
      style={{
        background: "rgba(0,0,0,0.55)",
        border: `1px solid ${color}30`,
      }}
    >
      <div className="text-[8.5px] uppercase tracking-[0.22em] text-white/40 font-extrabold font-mono leading-none">
        {label}
      </div>
      <div
        className={`${big ? "text-[22px]" : "text-[17px]"} font-extrabold tabular-nums leading-none mt-1`}
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}

type SectionTab = "overview" | "weapons" | "activities" | "records";

const SECTION_TABS: { key: SectionTab; label: string; icon: string }[] = [
  { key: "overview", label: "Vue d'ensemble", icon: "◆" },
  { key: "weapons", label: "Armes", icon: "⚔" },
  { key: "activities", label: "Activités", icon: "🏆" },
  { key: "records", label: "Records", icon: "★" },
];

export function StatsView() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<SectionTab>("overview");

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-xs">
        <Link to="/tools" className="text-bungie-muted hover:text-white">
          ← {t("nav.tools")}
        </Link>
      </div>

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-extrabold">{t("stats.title")}</h1>
          <p className="text-sm text-bungie-muted mt-1">
            {t("stats.subtitle")}
          </p>
        </div>
      </div>

      {/* Global Destiny 2 stats — live Steam players + popularity.report totals */}
      <GlobalDestinyStats />

      {/* ALWAYS-ON hero — playtime + combat summary + per-character */}
      <PlaytimeHero />

      {/* Section tabs */}
      <div className="flex items-center gap-1 p-1 bg-black/30 border border-bungie-border rounded-full w-fit">
        {SECTION_TABS.map((s) => (
          <button
            key={s.key}
            onClick={() => setTab(s.key)}
            className={`flex items-center gap-1.5 px-4 h-9 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              tab === s.key
                ? "bg-bungie-accent text-black shadow-glow"
                : "text-bungie-text/70 hover:text-white"
            }`}
          >
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Active tab content */}
      {tab === "overview" && <ModeCardGrid />}
      {tab === "weapons" && <WeaponMetaSection />}
      {tab === "activities" && <ActivityCompletionsSection />}
      {tab === "records" && <CombatRecordsSection />}
    </div>
  );
}
