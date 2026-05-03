import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useSelectedMembership } from "@/hooks/useProfile";
import { getAccountStats, readStat } from "@/api/stats";
import { ACTIVITY_MODE } from "@/constants/bungieHashes";
import { ACCENTS } from "@/constants/uiAccents";

const { text: ACCENT, border: ACCENT_BORDER } = ACCENTS.nightfall;
// NightfallStrike covers Nightfall: The Ordeal / all tiers.
const NIGHTFALL_MODE = ACTIVITY_MODE.Nightfall;

function fmtNum(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  return `${m}m`;
}

function fmtDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function Stat({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: string;
  accent?: string;
  hint?: string;
}) {
  return (
    <div className="panel p-4">
      <div className="text-[9px] uppercase tracking-widest text-bungie-muted">
        {label}
      </div>
      <div
        className={`text-2xl font-bold tabular-nums mt-1 ${accent ?? "text-white"}`}
      >
        {value}
      </div>
      {hint && (
        <div className="text-[10px] text-bungie-muted mt-0.5 tabular-nums">
          {hint}
        </div>
      )}
    </div>
  );
}

export function NightfallView() {
  const { t } = useTranslation();
  const membership = useSelectedMembership();

  const stats = useQuery({
    queryKey: [
      "nightfallStats",
      membership?.membershipType,
      membership?.membershipId,
    ],
    queryFn: () =>
      getAccountStats(membership!.membershipType, membership!.membershipId, [
        NIGHTFALL_MODE,
      ]),
    enabled: !!membership,
    staleTime: 15_000,
    refetchInterval: 45_000,
  });

  const row = useMemo(() => {
    const r = stats.data?.mergedAllCharacters?.results;
    const bucket = r?.nightfall?.allTime ?? null;
    if (!bucket) return null;

    const matches = readStat(bucket, "activitiesEntered");
    const completions = readStat(bucket, "activitiesCleared");
    const kills = readStat(bucket, "kills");
    const deaths = readStat(bucket, "deaths");
    const assists = readStat(bucket, "assists");
    const kd = deaths > 0 ? kills / deaths : kills;
    const bestScore = readStat(bucket, "highestCharacterLevel");
    const bestKills = readStat(bucket, "bestSingleGameKills");
    const fastest = readStat(bucket, "fastestCompletionMsNightfall");
    const longestSpree = readStat(bucket, "longestKillSpree");
    const secondsPlayed = readStat(bucket, "secondsPlayed");
    const precision = readStat(bucket, "precisionKills");
    const opponents = readStat(bucket, "opponentsDefeated");
    const completionRate =
      matches > 0 ? completions / matches : 0;

    return {
      matches,
      completions,
      kills,
      deaths,
      assists,
      kd,
      bestScore,
      bestKills,
      fastestSec: fastest / 1000,
      longestSpree,
      secondsPlayed,
      precision,
      precisionPct: kills > 0 ? precision / kills : 0,
      opponents,
      completionRate,
    };
  }, [stats.data]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs">
        <Link to="/tools" className="text-bungie-muted hover:text-white">
          ← {t("nav.tools")}
        </Link>
      </div>

      {/* Header */}
      <div className={`panel p-5 border ${ACCENT_BORDER}`}>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className={`text-[10px] uppercase tracking-widest ${ACCENT}`}>
              {t("nightfall.title")}
            </div>
            <div className="text-3xl font-bold">
              {row ? fmtNum(row.completions) : "—"}{" "}
              <span className="text-base text-bungie-muted font-normal">
                {t("nightfall.clears")}
              </span>
            </div>
            <div className="text-sm text-bungie-muted mt-1">
              {row
                ? `${fmtNum(row.matches)} ${t("nightfall.attempts")} · ${(row.completionRate * 100).toFixed(1)}% ${t("nightfall.successRate")}`
                : t("common.loading")}
            </div>
          </div>
          <div className={`text-5xl ${ACCENT} drop-shadow opacity-80`}>☄</div>
        </div>
      </div>

      {stats.isLoading && !row && (
        <p className="text-bungie-muted text-sm">{t("common.loading")}</p>
      )}

      {stats.isError && (
        <div className="panel p-4 border border-red-500/40">
          <p className="text-red-400 font-semibold mb-1">
            {t("common.error")}
          </p>
          <p className="text-sm text-bungie-muted">{String(stats.error)}</p>
        </div>
      )}

      {!stats.isLoading && row && row.matches === 0 && (
        <div className="panel p-6 text-center text-bungie-muted text-sm">
          {t("nightfall.noMatches")}
        </div>
      )}

      {row && row.matches > 0 && (
        <>
          {/* Primary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat
              label={t("nightfall.kd")}
              value={fmtNum(row.kd)}
              accent={ACCENT}
              hint={`${fmtNum(row.kills)} K · ${fmtNum(row.deaths)} D`}
            />
            <Stat
              label={t("nightfall.fastest")}
              value={row.fastestSec > 0 ? fmtDuration(row.fastestSec) : "—"}
              accent="text-pink-300"
            />
            <Stat
              label={t("nightfall.bestKills")}
              value={fmtNum(row.bestKills)}
            />
            <Stat
              label={t("nightfall.opponentsDefeated")}
              value={fmtNum(row.opponents)}
            />
          </div>

          {/* Completion bar */}
          <div className="panel p-5">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold">
                {t("nightfall.completionRatio")}
              </span>
              <span className="text-bungie-muted tabular-nums">
                {fmtNum(row.completions)} / {fmtNum(row.matches)}
              </span>
            </div>
            <div className="h-3 bg-black/40 border border-white/5 rounded-full overflow-hidden flex">
              <div
                className="bg-orange-400/70 h-full"
                style={{ width: `${row.completionRate * 100}%` }}
              />
              <div
                className="bg-red-400/50 h-full"
                style={{ width: `${(1 - row.completionRate) * 100}%` }}
              />
            </div>
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat
              label={t("nightfall.assists")}
              value={fmtNum(row.assists)}
            />
            <Stat
              label={t("nightfall.precisionKills")}
              value={fmtNum(row.precision)}
              hint={`${(row.precisionPct * 100).toFixed(1)}% ${t("nightfall.ofKills")}`}
            />
            <Stat
              label={t("nightfall.timePlayed")}
              value={fmtTime(row.secondsPlayed)}
            />
          </div>
        </>
      )}
    </div>
  );
}