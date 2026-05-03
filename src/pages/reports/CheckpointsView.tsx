import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { fetchD2CheckpointBots, type D2CheckpointBot } from "@/api/d2checkpoint";
import { useManifestStore } from "@/store/manifest";
import { toast } from "@/store/toast";
import { ACCENTS } from "@/constants/uiAccents";
import { Dropdown } from "@/components/dropdown";

const { text: ACCENT_TEXT, border: ACCENT_BORDER } = ACCENTS.checkpoints;

// Destiny 2 in-game chat command — "/rejoindre" in French, "/join" elsewhere.
function joinCommandFor(lang: string): string {
  return lang.toLowerCase().startsWith("fr") ? "/rejoindre" : "/join";
}

type ModeFilter = "all" | "raid" | "dungeon" | "other";
type SortKey = "popularity" | "name";

interface Group {
  hash: number;
  activityName: string;
  description: string;
  icon?: string;
  pgcrImage?: string;
  releaseIcon?: string;
  mode?: number;
  lightLevel?: number;
  maxParty?: number;
  items: D2CheckpointBot[];
  encounters: number[];
  premiumCount: number;
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[9px] uppercase tracking-widest text-bungie-muted">
        {label}
      </div>
      <div
        className={`text-2xl font-bold tabular-nums ${accent ?? "text-white"}`}
      >
        {value || "—"}
      </div>
    </div>
  );
}

export function CheckpointsView() {
  const { t, i18n } = useTranslation();
  const manifest = useManifestStore((s) => s.manifest);
  const joinCmd = joinCommandFor(i18n.language);

  const [modeFilter, setModeFilter] = useState<ModeFilter>("all");
  const [sort, setSort] = useState<SortKey>("popularity");
  const [search, setSearch] = useState("");

  const {
    data: bots,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["d2checkpoint", "bots"],
    queryFn: fetchD2CheckpointBots,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const grouped = useMemo<Group[]>(() => {
    const actDefs = manifest?.DestinyActivityDefinition ?? {};
    const map = new Map<number, Group>();
    for (const b of bots ?? []) {
      const def = actDefs[b.activityHash];
      const name = def?.displayProperties?.name || `Activity ${b.activityHash}`;
      const mode = def?.directActivityModeType;
      const matchmakingMax = def?.matchmaking?.maxParty;
      const defaultMax =
        mode === 4 ? 6 : mode === 82 ? 3 : undefined;
      const bucket = map.get(b.activityHash) ?? {
        hash: b.activityHash,
        activityName: name,
        description: def?.displayProperties?.description ?? "",
        icon: def?.displayProperties?.icon,
        releaseIcon: def?.releaseIcon,
        pgcrImage: def?.pgcrImage,
        mode,
        lightLevel: def?.activityLightLevel,
        maxParty:
          matchmakingMax && matchmakingMax > 0 ? matchmakingMax : defaultMax,
        items: [],
        encounters: [],
        premiumCount: 0,
      };
      bucket.items.push(b);
      if (b.premium) bucket.premiumCount += 1;
      if (!bucket.encounters.includes(b.encounter))
        bucket.encounters.push(b.encounter);
      map.set(b.activityHash, bucket);
    }
    for (const g of map.values()) g.encounters.sort((a, b) => a - b);
    return Array.from(map.values());
  }, [bots, manifest]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = grouped.filter((g) => {
      if (modeFilter === "raid" && g.mode !== 4) return false;
      if (modeFilter === "dungeon" && g.mode !== 82) return false;
      if (modeFilter === "other" && (g.mode === 4 || g.mode === 82))
        return false;
      if (q && !g.activityName.toLowerCase().includes(q)) return false;
      return true;
    });
    list = [...list];
    list.sort((a, b) => {
      switch (sort) {
        case "popularity":
          return b.items.length - a.items.length;
        case "name":
          return a.activityName.localeCompare(b.activityName);
      }
    });
    return list;
  }, [grouped, modeFilter, sort, search]);

  const totals = useMemo(() => {
    const totalBots = bots?.length ?? 0;
    const premiumTotal = bots?.filter((b) => b.premium).length ?? 0;
    const encounterSet = new Set<string>();
    for (const b of bots ?? [])
      encounterSet.add(`${b.activityHash}:${b.encounter}`);
    const raidCount = grouped.filter((g) => g.mode === 4).length;
    const dungeonCount = grouped.filter((g) => g.mode === 82).length;
    return {
      totalBots,
      premiumTotal,
      encounters: encounterSet.size,
      activities: grouped.length,
      raidCount,
      dungeonCount,
    };
  }, [bots, grouped]);

  const counts: Record<ModeFilter, number> = {
    all: grouped.length,
    raid: grouped.filter((g) => g.mode === 4).length,
    dungeon: grouped.filter((g) => g.mode === 82).length,
    other: grouped.filter((g) => g.mode !== 4 && g.mode !== 82).length,
  };

  const copyJoinCommand = async (botName: string) => {
    const command = `${joinCmd} ${botName}`;
    try {
      await navigator.clipboard.writeText(command);
      toast.success(t("reports.commandCopied", { cmd: command }));
    } catch {
      toast.error(t("reports.copyFailed"));
    }
  };

  const joinBot = async (botName: string) => {
    const command = `${joinCmd} ${botName}`;
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      toast.error(t("reports.copyFailed"));
      return;
    }

    const running = await invoke<boolean>("d2_is_running").catch(() => false);
    if (!running) {
      toast.error(t("reports.d2NotRunning"));
      return;
    }

    try {
      await invoke("d2_inject_join", { command });
      toast.success(t("reports.joinSent", { bot: botName }));
    } catch (e) {
      const msg = String(e);
      if (msg.includes("d2_not_running")) {
        toast.error(t("reports.d2NotRunning"));
      } else if (msg.includes("d2_focus_failed")) {
        toast.error(t("reports.d2FocusFailed"));
      } else {
        toast.error(msg);
      }
    }
  };

  const labelForMode = (mode?: number) => {
    if (mode === 4) return "Raid";
    if (mode === 82) return "Donjon";
    return "Activité";
  };

  const modeBadgeClass = (mode?: number) => {
    if (mode === 4)
      return "border-purple-400/60 bg-purple-400/15 text-purple-200";
    if (mode === 82)
      return "border-emerald-400/60 bg-emerald-400/15 text-emerald-200";
    return "border-bungie-border bg-bungie-panel/60 text-white/70";
  };

  const lastUpdated = dataUpdatedAt
    ? new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(dataUpdatedAt))
    : "—";

  return (
    <div className="space-y-4">
      {/* Overview */}
      <div className={`panel p-4 border ${ACCENT_BORDER}`}>
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-2">
            {isFetching && (
              <span className={`text-xs ${ACCENT_TEXT} animate-pulse`}>
                ● live
              </span>
            )}
            <span className="text-[10px] text-bungie-muted">
              {t("reports.lastPlayed")}: {lastUpdated}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-3 py-1.5 rounded-full text-xs border border-bungie-border hover:border-pink-500/50 hover:text-pink-300 disabled:opacity-50 transition-all"
            >
              {t("common.refresh")}
            </button>
          </div>
        </div>

        <div className="stagger grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat
            label={t("reports.totalBots")}
            value={totals.totalBots}
            accent={ACCENT_TEXT}
          />
          <Stat label={t("reports.activities")} value={totals.activities} />
          <Stat label={t("reports.raids")} value={totals.raidCount} />
          <Stat label={t("reports.dungeons")} value={totals.dungeonCount} />
        </div>
      </div>

      {/* Filters */}
      <div className="panel p-3 flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 p-1 bg-black/30 border border-bungie-border rounded-full">
          {(["all", "raid", "dungeon", "other"] as ModeFilter[]).map((m) => {
            const active = modeFilter === m;
            const label =
              m === "all"
                ? t("reports.allActivities")
                : m === "raid"
                  ? t("reports.raids")
                  : m === "dungeon"
                    ? t("reports.dungeons")
                    : t("reports.otherActivities");
            return (
              <button
                key={m}
                onClick={() => setModeFilter(m)}
                disabled={counts[m] === 0}
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
                  {counts[m]}
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
            { value: "popularity", label: t("reports.sortPopularity") },
            { value: "name", label: t("reports.sortName") },
          ]}
        />

        <input
          type="text"
          placeholder={t("reports.searchActivity")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-40 bg-bungie-panel/60 border border-bungie-border rounded-full px-3 py-1.5 text-xs focus:outline-none focus:border-bungie-accent/60"
        />
      </div>

      {isLoading && (
        <p className="text-bungie-muted text-sm">{t("common.loading")}</p>
      )}

      {isError && (
        <div className="panel p-4 border border-red-500/40">
          <p className="text-red-400 font-semibold mb-1">{t("common.error")}</p>
          <p className="text-sm text-bungie-muted mb-3">{String(error)}</p>
          <button onClick={() => refetch()} className="btn-primary text-sm">
            {t("common.retry")}
          </button>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <p className="text-bungie-muted text-sm">
          {t("reports.checkpointsEmpty")}
        </p>
      )}

      {/* Activity cards */}
      <div className="stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((g) => {
          const bgStyle = g.pgcrImage
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(7,7,13,0.2), rgba(7,7,13,0.9) 70%, rgba(7,7,13,0.97)), url(https://www.bungie.net${g.pgcrImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : undefined;
          const maxEncounter = Math.max(...g.encounters, 0);
          return (
            <div
              key={g.hash}
              className="relative rounded-xl overflow-hidden panel flex flex-col"
              style={bgStyle}
            >
              {/* Header banner */}
              <div className="p-4 pb-2">
                <div className="flex items-start gap-3">
                  {g.icon && (
                    <img
                      src={`https://www.bungie.net${g.icon}`}
                      alt=""
                      className="w-12 h-12 rounded-lg border border-white/20 bg-black/50 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-base text-white drop-shadow leading-tight">
                      {g.activityName}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span
                        className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full border ${modeBadgeClass(g.mode)}`}
                      >
                        {labelForMode(g.mode)}
                      </span>
                      {g.lightLevel && g.lightLevel > 0 && (
                        <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full border border-pink-400/50 bg-pink-400/10 text-pink-200">
                          {g.lightLevel}
                        </span>
                      )}
                      {g.maxParty && g.maxParty > 0 && (
                        <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full border border-white/20 bg-black/40 text-white/70">
                          {g.maxParty} max
                        </span>
                      )}
                      <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full border border-pink-400/60 bg-pink-400/15 text-pink-200">
                        {g.items.length} bot{g.items.length > 1 ? "s" : ""}
                      </span>
                      {g.premiumCount > 0 && (
                        <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full border border-amber-500/60 bg-amber-500/15 text-amber-200">
                          ★ {g.premiumCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {g.description && (
                  <p className="text-xs text-white/70 mt-3 line-clamp-2">
                    {g.description}
                  </p>
                )}

                {/* Encounter coverage chips */}
                {g.encounters.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    <span className="text-[9px] uppercase tracking-widest text-bungie-muted">
                      {t("reports.encounters")}:
                    </span>
                    {g.encounters.map((e) => (
                      <span
                        key={e}
                        className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-200 border border-pink-500/30"
                      >
                        {e}
                      </span>
                    ))}
                    {maxEncounter > g.encounters.length && (
                      <span className="text-[9px] text-bungie-muted">
                        · {g.encounters.length}/{maxEncounter}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bot rows */}
              <div className="bg-black/50 backdrop-blur-sm mt-2 divide-y divide-white/5">
                {g.items
                  .slice()
                  .sort((a, b) => a.encounter - b.encounter)
                  .map((b) => (
                    <div
                      key={b.steam}
                      className="px-4 py-2.5 flex items-center justify-between gap-2 hover:bg-white/5 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono font-bold w-6 h-6 flex items-center justify-center rounded bg-pink-500/20 text-pink-200 border border-pink-500/40 shrink-0">
                            {b.encounter}
                          </span>
                          <span className="text-sm font-semibold text-white truncate">
                            {b.name}
                          </span>
                          {b.premium && (
                            <span
                              className="text-[9px] uppercase tracking-widest bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-px rounded"
                              title={t("reports.premiumBot")}
                            >
                              ★ premium
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-bungie-muted flex items-center gap-2 mt-0.5 pl-7">
                          <span className="font-mono opacity-80 truncate">
                            steam:{b.steam}
                          </span>
                          <span className="font-mono opacity-50 truncate hidden sm:inline">
                            #{b.membershipId.slice(-6)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => copyJoinCommand(b.name)}
                          title={t("reports.copyHint", {
                            cmd: `${joinCmd} ${b.name}`,
                          })}
                          className="text-[10px] uppercase tracking-widest px-2 py-1 rounded border border-bungie-border hover:border-pink-500/50 hover:text-pink-300 transition-colors"
                        >
                          {t("reports.copy")}
                        </button>
                        <button
                          onClick={() => joinBot(b.name)}
                          title={t("reports.joinHint")}
                          className="text-[10px] uppercase tracking-widest font-semibold px-2 py-1 rounded border border-pink-500/60 bg-pink-500/15 text-pink-200 hover:bg-pink-500/25 transition-colors"
                        >
                          {t("reports.join")}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-bungie-muted text-center pt-1">
        {t("reports.checkpointsDisclaimer")}
      </p>
    </div>
  );
}