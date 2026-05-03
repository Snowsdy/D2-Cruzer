import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useSelectedMembership } from "@/hooks/useProfile";
import { getAccountStats, readStat } from "@/api/stats";
import { ACTIVITY_MODE } from "@/constants/bungieHashes";
import { ACCENTS } from "@/constants/uiAccents";

const { text: ACCENT, border: ACCENT_BORDER } = ACCENTS.trials;
const TRIALS_MODE = ACTIVITY_MODE.TrialsOfOsiris;

function fmtNum(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
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

export function TrialsView() {
  const { t } = useTranslation();
  const membership = useSelectedMembership();

  const stats = useQuery({
    queryKey: [
      "trialsStats",
      membership?.membershipType,
      membership?.membershipId,
    ],
    queryFn: () =>
      getAccountStats(membership!.membershipType, membership!.membershipId, [
        TRIALS_MODE,
      ]),
    enabled: !!membership,
    staleTime: 15_000,
    refetchInterval: 45_000,
  });

  const row = useMemo(() => {
    const r = stats.data?.mergedAllCharacters?.results;
    // Bungie keys historical stats response by mode — trials shows up as
    // "trialsOfOsiris" or "trialsOfTheNine" depending on era.
    const bucket =
      r?.trialsOfOsiris?.allTime ?? r?.trialsOfTheNine?.allTime ?? null;
    if (!bucket) return null;

    const kills = readStat(bucket, "kills");
    const deaths = readStat(bucket, "deaths");
    const assists = readStat(bucket, "assists");
    const matches = readStat(bucket, "activitiesEntered");
    const wins = readStat(bucket, "activitiesWon");
    const losses = Math.max(0, matches - wins);
    const kdRatio = deaths > 0 ? kills / deaths : kills;
    const kdaRatio = deaths > 0 ? (kills + assists) / deaths : kills + assists;
    const winRate = matches > 0 ? wins / matches : 0;
    const bestKills = readStat(bucket, "bestSingleGameKills");
    const avgKills = readStat(bucket, "averageKillDistance");
    const longestKill = readStat(bucket, "longestKillDistance");
    const precision = readStat(bucket, "precisionKills");
    const secondsPlayed = readStat(bucket, "secondsPlayed");
    const opponentsDefeated = readStat(bucket, "opponentsDefeated");
    const longestSpree = readStat(bucket, "longestKillSpree");
    const lifespan = readStat(bucket, "averageLifespan");

    return {
      kills,
      deaths,
      assists,
      matches,
      wins,
      losses,
      kdRatio,
      kdaRatio,
      winRate,
      bestKills,
      avgKills,
      longestKill,
      precision,
      precisionPct: kills > 0 ? precision / kills : 0,
      secondsPlayed,
      opponentsDefeated,
      longestSpree,
      lifespan,
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
              {t("trials.title")}
            </div>
            <div className="text-3xl font-bold">
              {row ? fmtNum(row.matches) : "—"}{" "}
              <span className="text-base text-bungie-muted font-normal">
                {t("trials.matches")}
              </span>
            </div>
            <div className="text-sm text-bungie-muted mt-1">
              {row
                ? `${fmtNum(row.wins)} ${t("trials.wins")} · ${fmtNum(row.losses)} ${t("trials.losses")}`
                : t("common.loading")}
            </div>
          </div>
          <div className={`text-5xl ${ACCENT} drop-shadow opacity-80`}>⚔</div>
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
          {t("trials.noMatches")}
        </div>
      )}

      {row && row.matches > 0 && (
        <>
          {/* Primary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat
              label={t("trials.kd")}
              value={fmtNum(row.kdRatio)}
              accent={ACCENT}
              hint={`${fmtNum(row.kills)} K · ${fmtNum(row.deaths)} D`}
            />
            <Stat
              label={t("trials.kda")}
              value={fmtNum(row.kdaRatio)}
              hint={`+ ${fmtNum(row.assists)} A`}
            />
            <Stat
              label={t("trials.winRate")}
              value={fmtPct(row.winRate)}
              accent="text-emerald-300"
              hint={`${fmtNum(row.wins)} / ${fmtNum(row.matches)}`}
            />
            <Stat
              label={t("trials.opponentsDefeated")}
              value={fmtNum(row.opponentsDefeated)}
            />
          </div>

          {/* Win/Loss bar */}
          <div className="panel p-5">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold">{t("trials.record")}</span>
              <span className="text-bungie-muted tabular-nums">
                {fmtNum(row.wins)} W · {fmtNum(row.losses)} L
              </span>
            </div>
            <div className="h-3 bg-black/40 border border-white/5 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-400/70 h-full"
                style={{ width: `${row.winRate * 100}%` }}
                title={`${fmtNum(row.wins)} ${t("trials.wins")}`}
              />
              <div
                className="bg-red-400/70 h-full"
                style={{ width: `${(1 - row.winRate) * 100}%` }}
                title={`${fmtNum(row.losses)} ${t("trials.losses")}`}
              />
            </div>
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat
              label={t("trials.bestKills")}
              value={fmtNum(row.bestKills)}
            />
            <Stat
              label={t("trials.longestKill")}
              value={`${fmtNum(row.longestKill)}m`}
            />
            <Stat
              label={t("trials.avgKillDistance")}
              value={`${fmtNum(row.avgKills)}m`}
            />
            <Stat
              label={t("trials.precisionKills")}
              value={fmtNum(row.precision)}
              hint={`${fmtPct(row.precisionPct)} ${t("trials.ofKills")}`}
            />
            <Stat
              label={t("trials.avgLifespan")}
              value={`${fmtNum(row.lifespan)}s`}
            />
            <Stat
              label={t("trials.timePlayed")}
              value={`${Math.floor(row.secondsPlayed / 3600)}h`}
              hint={`${Math.floor((row.secondsPlayed % 3600) / 60)}m`}
            />
          </div>
        </>
      )}
    </div>
  );
}