import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAggregateActivities } from "@/hooks/useAggregateActivities";
import { useActivityTags } from "@/hooks/useActivityTags";
import { useManifestStore } from "@/store/manifest";
import { fmtDurationHMS as fmtTime } from "@/utils/format";
import { Dropdown } from "@/components/dropdown";

interface Props {
  /** Bungie activity mode: 4 = Raid, 82 = Dungeon */
  activityMode: number;
  accentText: string;
  accentBorder: string;
}

type Difficulty = "all" | "normal" | "master" | "contest";

function classifyDifficulty(name: string): Exclude<Difficulty, "all"> {
  const lc = name.toLowerCase();
  if (lc.includes("contest") || lc.includes("concours") || lc.includes("day one") || lc.includes("jour un")) return "contest";
  if (
    lc.includes("master") ||
    lc.includes("maître") ||
    lc.includes("maîtrise") ||
    lc.includes("maestro")
  )
    return "master";
  return "normal";
}

type SortKey = "clears" | "name" | "fastest";

const DIFFICULTY_BADGE: Record<Exclude<Difficulty, "all">, string> = {
  normal: "border-bungie-border bg-bungie-panel/60 text-white/70",
  master: "border-amber-500/60 bg-amber-500/15 text-amber-200",
  contest: "border-red-500/60 bg-red-500/15 text-red-200",
};

const DIFFICULTY_LABEL: Record<Exclude<Difficulty, "all">, string> = {
  normal: "Normal",
  master: "Master",
  contest: "Contest",
};

function Stat({
  label,
  value,
  accent,
  loading,
}: {
  label: string;
  value: string | number;
  accent?: string;
  loading?: boolean;
}) {
  const empty = value === 0 || value === "0" || value === "" || value == null;
  const displayValue = empty ? (loading ? "…" : "—") : value;
  return (
    <div className="min-w-0">
      <div className="text-[8px] uppercase tracking-widest text-white/50 truncate">
        {label}
      </div>
      <div
        className={`text-sm font-bold tabular-nums truncate ${
          empty ? "text-white/30" : accent ?? ""
        }`}
      >
        {displayValue}
      </div>
    </div>
  );
}

export function ActivityList({
  activityMode,
  accentText,
  accentBorder,
}: Props) {
  const { t } = useTranslation();
  const { merged, isLoading } = useAggregateActivities();
  const { tagsByActivity, isLoading: tagsLoading, totalAnalyzed } =
    useActivityTags(activityMode);
  const manifest = useManifestStore((s) => s.manifest);
  const [difficulty, setDifficulty] = useState<Difficulty>("all");
  const [sort, setSort] = useState<SortKey>("clears");
  const [hidePlayed, setHidePlayed] = useState(false);
  const [hideUnplayed, setHideUnplayed] = useState(true);

  const rows = useMemo(() => {
    if (!manifest) return [];

    // Build a map of stats by activity hash
    const statsByHash = new Map<number, (typeof merged)[number]>();
    for (const s of merged) statsByHash.set(s.activityHash, s);

    // Iterate ALL activities in the manifest matching this mode (even unplayed)
    const out: Array<{
      stats: { activityHash: number; completions: number; fastestMs: number; bestKills: number; bestDeaths: number };
      def: NonNullable<typeof manifest>["DestinyActivityDefinition"][number];
      name: string;
      diff: Exclude<Difficulty, "all">;
    }> = [];

    for (const [hashStr, def] of Object.entries(
      manifest.DestinyActivityDefinition ?? {}
    )) {
      if (!def || def.directActivityModeType !== activityMode) continue;
      // Skip placeholder/redacted defs
      if (!def.displayProperties?.name) continue;
      // Skip private matchmaking variants & test instances
      const name = def.displayProperties.name;
      if (/_private|test/i.test(name)) continue;

      const hash = Number(hashStr);
      const stats = statsByHash.get(hash) ?? {
        activityHash: hash,
        completions: 0,
        fastestMs: 0,
        bestKills: 0,
        bestDeaths: 0,
      };
      out.push({ stats, def, name, diff: classifyDifficulty(name) });
    }

    return out;
  }, [merged, manifest, activityMode]);

  const filtered = useMemo(() => {
    let list =
      difficulty === "all" ? rows : rows.filter((r) => r.diff === difficulty);
    if (hideUnplayed) list = list.filter((r) => r.stats.completions > 0);
    if (hidePlayed) list = list.filter((r) => r.stats.completions === 0);
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case "clears":
          return b.stats.completions - a.stats.completions;
        case "fastest":
          // Items with 0 fastest go to the end
          if (a.stats.fastestMs === 0 && b.stats.fastestMs > 0) return 1;
          if (b.stats.fastestMs === 0 && a.stats.fastestMs > 0) return -1;
          return a.stats.fastestMs - b.stats.fastestMs;
        case "name":
          return a.name.localeCompare(b.name);
      }
    });
    return sorted;
  }, [rows, difficulty, sort, hidePlayed, hideUnplayed]);

  const counts: Record<Difficulty, number> = {
    all: rows.length,
    normal: rows.filter((r) => r.diff === "normal").length,
    master: rows.filter((r) => r.diff === "master").length,
    contest: rows.filter((r) => r.diff === "contest").length,
  };

  const totalClears = filtered.reduce((s, r) => s + r.stats.completions, 0);

  return (
    <div className="space-y-4">
      <div
        className={`panel p-4 flex items-center justify-between gap-4 flex-wrap border ${accentBorder}`}
      >
        <div>
          <div className="text-[10px] uppercase tracking-widest text-bungie-muted">
            {t("reports.totalCompletions")}
          </div>
          <div className={`text-3xl font-bold tabular-nums ${accentText}`}>
            {totalClears.toLocaleString()}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 p-1 bg-black/30 border border-bungie-border rounded-full">
            {(["all", "normal", "master", "contest"] as Difficulty[]).map((d) => {
              const active = difficulty === d;
              const label =
                d === "all" ? t("reports.allDifficulties") : DIFFICULTY_LABEL[d];
              return (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  disabled={counts[d] === 0}
                  className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-all ${
                    active
                      ? "bg-bungie-accent text-black font-semibold"
                      : "text-bungie-text/70 hover:text-white disabled:opacity-30"
                  }`}
                >
                  {label}
                  <span
                    className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded-full ${
                      active ? "bg-black/20" : "bg-white/5"
                    }`}
                  >
                    {counts[d]}
                  </span>
                </button>
              );
            })}
          </div>
          <Dropdown
            value={sort}
            onChange={(v) => setSort(v as SortKey)}
            variant="pill"
            size="sm"
            options={[
              { value: "clears", label: t("reports.sortClears") },
              { value: "fastest", label: t("reports.sortFastest") },
              { value: "name", label: t("reports.sortName") },
            ]}
          />

          <div className="flex gap-1 p-1 bg-black/30 border border-bungie-border rounded-full text-[10px]">
            <button
              onClick={() => {
                setHideUnplayed(true);
                setHidePlayed(false);
              }}
              className={`px-3 py-1 rounded-full uppercase tracking-widest transition-all ${
                hideUnplayed && !hidePlayed
                  ? "bg-bungie-accent text-black font-semibold"
                  : "text-bungie-text/70 hover:text-white"
              }`}
            >
              {t("reports.playedOnly")}
            </button>
            <button
              onClick={() => {
                setHideUnplayed(false);
                setHidePlayed(false);
              }}
              className={`px-3 py-1 rounded-full uppercase tracking-widest transition-all ${
                !hideUnplayed && !hidePlayed
                  ? "bg-bungie-accent text-black font-semibold"
                  : "text-bungie-text/70 hover:text-white"
              }`}
            >
              {t("reports.allActivities")}
            </button>
            <button
              onClick={() => {
                setHideUnplayed(false);
                setHidePlayed(true);
              }}
              className={`px-3 py-1 rounded-full uppercase tracking-widest transition-all ${
                hidePlayed
                  ? "bg-bungie-accent text-black font-semibold"
                  : "text-bungie-text/70 hover:text-white"
              }`}
            >
              {t("reports.unplayedOnly")}
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <p className="text-bungie-muted text-sm">{t("common.loading")}</p>
      )}
      {tagsLoading && totalAnalyzed > 0 && (
        <p className="text-xs text-bungie-accent/70">
          {t("reports.analyzingPgcrs", { n: totalAnalyzed })}
        </p>
      )}
      {!isLoading && filtered.length === 0 && (
        <p className="text-bungie-muted text-sm">{t("reports.noActivities")}</p>
      )}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((r) => {
          const icon = r.def.displayProperties?.icon;
          const pgcr = r.def.pgcrImage;
          const diffBadge = DIFFICULTY_BADGE[r.diff];
          const diffLabel = DIFFICULTY_LABEL[r.diff];
          const unplayed = r.stats.completions === 0;
          return (
            <div
              key={r.stats.activityHash}
              className={`relative rounded-xl overflow-hidden panel transition-opacity ${
                unplayed ? "opacity-50 hover:opacity-90" : ""
              }`}
              style={{
                backgroundImage: pgcr
                  ? `linear-gradient(180deg, rgba(7,7,13,0.35), rgba(7,7,13,0.92)), url(https://www.bungie.net${pgcr})`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="p-4 min-h-40 flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  {icon && (
                    <img
                      src={`https://www.bungie.net${icon}`}
                      alt=""
                      className="w-10 h-10 rounded border border-white/20 bg-black/40 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base text-white drop-shadow leading-tight">
                      {r.name}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span
                        className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full border ${diffBadge}`}
                      >
                        {diffLabel}
                      </span>
                      {(() => {
                        const t = tagsByActivity.get(r.stats.activityHash);
                        if (!t) return null;
                        const tags: { label: string; cls: string }[] = [];
                        if (t.flawlessSolo > 0) {
                          tags.push({
                            label: `Solo Flawless${t.flawlessSolo > 1 ? " ×" + t.flawlessSolo : ""}`,
                            cls: "border-yellow-300 bg-yellow-300/20 text-yellow-100",
                          });
                        } else if (t.flawlessTotal > 0) {
                          tags.push({
                            label: `Flawless${t.flawlessTotal > 1 ? " ×" + t.flawlessTotal : ""}`,
                            cls: "border-yellow-400/70 bg-yellow-400/15 text-yellow-200",
                          });
                        }
                        if (t.soloClears > 0 && t.flawlessSolo === 0) {
                          tags.push({
                            label: `Solo${t.soloClears > 1 ? " ×" + t.soloClears : ""}`,
                            cls: "border-orange-400/70 bg-orange-400/15 text-orange-200",
                          });
                        }
                        if (t.duoClears > 0) {
                          tags.push({
                            label: `Duo${t.duoClears > 1 ? " ×" + t.duoClears : ""}`,
                            cls: "border-pink-400/70 bg-pink-400/15 text-pink-200",
                          });
                        }
                        if (t.trioClears > 0) {
                          tags.push({
                            label: `Trio${t.trioClears > 1 ? " ×" + t.trioClears : ""}`,
                            cls: "border-fuchsia-400/70 bg-fuchsia-400/15 text-fuchsia-200",
                          });
                        }
                        return tags.map((tag) => (
                          <span
                            key={tag.label}
                            className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full border ${tag.cls}`}
                          >
                            {tag.label}
                          </span>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
                {(() => {
                  const tg = tagsByActivity.get(r.stats.activityHash);
                  const lastDate = tg?.lastCompletedISO
                    ? new Intl.DateTimeFormat(undefined, { dateStyle: "short" }).format(
                        new Date(tg.lastCompletedISO)
                      )
                    : "—";
                  const kd =
                    tg && tg.myDeaths > 0
                      ? (tg.myKills / tg.myDeaths).toFixed(2)
                      : tg && tg.myKills > 0
                        ? "∞"
                        : "—";
                  const avgK =
                    tg && tg.totalAnalyzed > 0
                      ? Math.round(tg.myKills / tg.totalAnalyzed)
                      : 0;
                  const avgD =
                    tg && tg.totalAnalyzed > 0
                      ? Math.round(tg.myDeaths / tg.totalAnalyzed)
                      : 0;
                  // Stats that depend on PGCR analysis should show a subtle
                  // "…" while tags are still loading, rather than "—" which
                  // looks like missing data.
                  const tagsStillAnalyzing = tagsLoading && !tg;
                  return (
                    <div className="grid grid-cols-4 gap-2 mt-3 text-white/85">
                      <Stat label={t("reports.clears")} value={r.stats.completions} accent={accentText} />
                      <Stat label={t("reports.fastest")} value={fmtTime(r.stats.fastestMs || tg?.fastestMs || 0)} loading={tagsStillAnalyzing} />
                      <Stat label={t("reports.avgTime")} value={fmtTime(tg?.avgDurationMs ?? 0)} loading={tagsStillAnalyzing} />
                      <Stat label={t("reports.lastPlayed")} value={lastDate} loading={tagsStillAnalyzing} />

                      <Stat label={t("reports.bestKills")} value={r.stats.bestKills || tg?.bestKillsSingleRun || 0} loading={tagsStillAnalyzing} />
                      <Stat label={t("reports.kd")} value={kd} loading={tagsStillAnalyzing} />
                      <Stat label={t("reports.avgKills")} value={avgK} loading={tagsStillAnalyzing} />
                      <Stat label={t("reports.avgDeaths")} value={avgD} loading={tagsStillAnalyzing} />
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}