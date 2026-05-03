/**
 * In-app dashboard for the Cruzer Discord bot.
 *
 * Pulls live stats from the bot's exported JSON snapshot
 * (`/bot-stats.json` at cruzer.gg) and renders a BotGhost-inspired
 * layout — hero card, module tiles, command catalog, 24h leaderboard —
 * restyled in the Cruzer visual language (magenta accent, glass panels).
 *
 * When the bot is offline or the snapshot is unreachable, we show an
 * empty-state placeholder with the invite link instead of a broken UI.
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

// Allow overriding the stats source — handy when testing a bot running
// locally or on a staging host.
const STATS_URL = "https://cruzer.gg/bot-stats.json";
const BOT_INVITE_URL =
  "https://discord.com/oauth2/authorize?client_id=1465702655945867448&scope=bot+applications.commands&permissions=2048";
const SUPPORT_URL = "https://cruzer.gg";

interface BotStats {
  online: boolean;
  version: string;
  servers: number;
  users: number;
  commandsLast24h: number;
  commandsAllTime: number;
  uptimeSeconds: number;
  lastDeployAt: string;
  commands: Array<{
    name: string;
    description: string;
    count?: number;
    category?: string;
  }>;
  topCommands24h: Array<{ name: string; count: number }>;
}

// Cruzer categorisation — names match the bot's `SlashCommand.category`
// enum so the dashboard mirrors the bot's own grouping.
const CATEGORIES: Array<{ key: string; labelKey: string; emoji: string; tint: string }> = [
  { key: "world", labelKey: "bot.categories.world", emoji: "🌍", tint: "from-sky-500/10" },
  { key: "player", labelKey: "bot.categories.player", emoji: "🛡", tint: "from-indigo-500/10" },
  { key: "items", labelKey: "bot.categories.items", emoji: "🗡", tint: "from-amber-500/10" },
  { key: "vendors", labelKey: "bot.categories.vendors", emoji: "🏪", tint: "from-emerald-500/10" },
  { key: "marathon", labelKey: "bot.categories.marathon", emoji: "🏁", tint: "from-lime-500/10" },
  { key: "utility", labelKey: "bot.categories.utility", emoji: "⚙", tint: "from-zinc-500/10" },
  { key: "admin", labelKey: "bot.categories.admin", emoji: "🔧", tint: "from-rose-500/10" },
];

// Static catalog of commands → their category, used to group the list
// pulled from bot-stats.json. If the JSON carries `category` fields
// directly, we use those; otherwise we fall back to this mapping.
const COMMAND_CATEGORY: Record<string, string> = {
  xur: "world", trials: "world", nightfall: "world", raid: "world",
  dungeon: "world", lost: "world", reset: "world", season: "world",
  stats: "player", raids: "player", titles: "player", season_stats: "player",
  inventory: "player", profile: "player",
  item: "items", roll: "items", perk: "items", exotic: "items",
  vendor: "vendors", checkpoint: "vendors",
  marathon: "marathon",
  help: "utility", bot: "utility", invite: "utility", feedback: "utility",
  setup: "admin",
};

function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}j ${String(h).padStart(2, "0")}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m`;
}

function formatNumber(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "—";
  return n.toLocaleString("fr-FR");
}

function categoryOf(cmd: { name: string; category?: string }): string {
  if (cmd.category) return cmd.category;
  const slug = cmd.name.replace(/^\//, "");
  return COMMAND_CATEGORY[slug] ?? "utility";
}

export function BotDashboard() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useQuery<BotStats>({
    queryKey: ["bot-stats"],
    queryFn: async () => {
      const res = await fetch(STATS_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as BotStats;
    },
    refetchInterval: 60_000,
    retry: 1,
  });

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const grouped = useMemo(() => {
    const map = new Map<string, BotStats["commands"]>();
    for (const cmd of data?.commands ?? []) {
      const cat = categoryOf(cmd);
      const arr = map.get(cat) ?? [];
      arr.push(cmd);
      map.set(cat, arr);
    }
    return map;
  }, [data?.commands]);

  const visibleCommands = useMemo(() => {
    const all = data?.commands ?? [];
    const needle = search.trim().toLowerCase();
    return all.filter((cmd) => {
      if (activeCategory && categoryOf(cmd) !== activeCategory) return false;
      if (!needle) return true;
      return (
        cmd.name.toLowerCase().includes(needle) ||
        cmd.description.toLowerCase().includes(needle)
      );
    });
  }, [data?.commands, activeCategory, search]);

  const maxTopCount = useMemo(
    () =>
      Math.max(1, ...(data?.topCommands24h?.map((c) => c.count) ?? [0])),
    [data?.topCommands24h]
  );

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-10">
      {/* Hero strip — status + identity + actions */}
      <section
        className="relative overflow-hidden rounded-2xl border border-bungie-border p-6 md:p-7"
        style={{
          background:
            "linear-gradient(135deg, rgba(243,7,94,0.12) 0%, rgba(168,85,247,0.06) 50%, transparent 80%), #0d0d16",
        }}
      >
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-bungie-accent/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-5 flex-wrap md:flex-nowrap">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-bungie-accent/40 shadow-[0_0_24px_rgba(243,7,94,0.25)] shrink-0 flex items-center justify-center bg-black/60">
            <img src="/cruzer-logo.png" alt="" className="w-14 h-14"
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-[10px] uppercase tracking-[0.25em]">
              <span
                className={[
                  "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold",
                  data?.online
                    ? "text-emerald-300 border border-emerald-400/40 bg-emerald-400/10"
                    : "text-zinc-400 border border-zinc-500/30 bg-zinc-500/10",
                ].join(" ")}
              >
                <span
                  className={[
                    "w-1.5 h-1.5 rounded-full",
                    data?.online ? "bg-emerald-400 animate-pulse" : "bg-zinc-500",
                  ].join(" ")}
                />
                {data?.online ? t("bot.status.online") : t("bot.status.offline")}
              </span>
              <span className="text-bungie-muted">
                {data ? `v${data.version}` : "—"}
              </span>
              <span className="text-bungie-muted">·</span>
              <span className="text-bungie-muted">
                {t("bot.meta")}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-none mt-3">
              Cruzer<span className="text-bungie-accent">.</span>gg {t("bot.heroTitle")}
            </h1>
            <p className="text-sm text-bungie-muted mt-3 max-w-2xl leading-relaxed">
              {t("bot.description")}
            </p>
          </div>

          <div className="flex gap-2 shrink-0 self-start">
            <a
              href={BOT_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-4 rounded-full btn-primary font-bold text-xs flex items-center gap-1.5"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3.2a.07.07 0 0 0-.074.035c-.163.29-.343.668-.47.97a18.27 18.27 0 0 0-5.487 0 12.66 12.66 0 0 0-.477-.97.074.074 0 0 0-.074-.035c-1.29.221-2.523.613-3.76 1.169a.066.066 0 0 0-.031.027C2.533 8.046 1.83 11.607 2.176 15.125a.082.082 0 0 0 .031.056 19.91 19.91 0 0 0 6.004 3.034.074.074 0 0 0 .081-.026c.463-.63.875-1.295 1.227-1.994a.072.072 0 0 0-.04-.1 13.1 13.1 0 0 1-1.872-.892.074.074 0 0 1-.007-.123c.126-.094.252-.192.372-.292a.07.07 0 0 1 .074-.01c3.928 1.793 8.18 1.793 12.061 0a.07.07 0 0 1 .075.009c.121.1.247.2.373.293a.074.074 0 0 1-.006.123c-.598.35-1.22.646-1.873.892a.073.073 0 0 0-.04.1c.36.7.772 1.365 1.226 1.994a.074.074 0 0 0 .082.026 19.84 19.84 0 0 0 6.013-3.034.074.074 0 0 0 .03-.055c.413-4.068-.691-7.6-2.926-10.73a.057.057 0 0 0-.03-.028zM8.02 12.985c-1.183 0-2.156-1.085-2.156-2.42 0-1.333.956-2.42 2.156-2.42 1.21 0 2.175 1.096 2.156 2.42 0 1.335-.955 2.42-2.156 2.42zm7.974 0c-1.183 0-2.156-1.085-2.156-2.42 0-1.333.956-2.42 2.156-2.42 1.21 0 2.175 1.096 2.156 2.42 0 1.335-.947 2.42-2.156 2.42z" />
              </svg>
              {t("bot.invite")}
            </a>
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-4 rounded-full border border-bungie-border hover:border-bungie-accent/40 hover:bg-white/5 text-bungie-text/85 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              {t("bot.support")}
            </a>
            <button
              onClick={() => void refetch()}
              className="h-9 px-3 rounded-full border border-bungie-border hover:border-bungie-accent/40 hover:bg-white/5 text-bungie-text/85 hover:text-white font-medium text-xs flex items-center gap-1 transition-colors"
              title={t("bot.refresh")}
            >
              ⟳
            </button>
          </div>
        </div>
      </section>

      {isLoading && (
        <div className="panel p-6 text-center text-bungie-muted text-sm">
          {t("bot.loading")}
        </div>
      )}

      {isError && (
        <div className="panel p-6 text-center space-y-2">
          <div className="text-sm font-bold text-amber-300">
            {t("bot.statusUnavailable")}
          </div>
          <div className="text-xs text-bungie-muted">
            {t("bot.statusUnavailableHint", { url: STATS_URL })}
          </div>
        </div>
      )}

      {/* Stat tiles */}
      {data && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile label={t("bot.tiles.servers")} value={formatNumber(data.servers)} />
          <StatTile label={t("bot.tiles.users")} value={formatNumber(data.users)} />
          <StatTile
            label={t("bot.tiles.commands24h")}
            value={formatNumber(data.commandsLast24h)}
            hint={t("bot.tiles.commandsTotal", { n: formatNumber(data.commandsAllTime) })}
          />
          <StatTile
            label={t("bot.tiles.uptime")}
            value={formatUptime(data.uptimeSeconds)}
            hint={
              data.lastDeployAt
                ? t("bot.tiles.deployed", { date: new Date(data.lastDeployAt).toLocaleDateString() })
                : undefined
            }
          />
        </section>
      )}

      {data && data.topCommands24h && data.topCommands24h.length > 0 && (
        <section className="panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-bungie-accent font-bold">
                {t("bot.top.kicker")}
              </div>
              <h2 className="text-lg font-bold mt-1">
                {t("bot.top.title")}
              </h2>
            </div>
            <span className="text-[10px] font-mono text-bungie-muted">
              {dataUpdatedAt
                ? t("bot.top.updatedAt", { time: new Date(dataUpdatedAt).toLocaleTimeString() })
                : ""}
            </span>
          </div>
          <div className="space-y-2.5">
            {data.topCommands24h.slice(0, 6).map((c, i) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-bungie-muted w-6 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-bungie-accent">
                    /{c.name.replace(/^\//, "")}
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-black/40 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((c.count / maxTopCount) * 100)}%`,
                        background:
                          "linear-gradient(90deg, #f3075e, #a855f7)",
                      }}
                    />
                  </div>
                </div>
                <span className="font-mono text-[11px] text-bungie-muted w-20 text-right tabular-nums">
                  {formatNumber(c.count)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Module tiles (category overview) */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-bungie-muted">
              {t("bot.modules.kicker")}
            </div>
            <h2 className="text-lg font-bold mt-1">
              {t("bot.modules.title")}
            </h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => {
            const list = grouped.get(cat.key) ?? [];
            const active = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() =>
                  setActiveCategory(active ? null : cat.key)
                }
                className={[
                  "text-left panel p-4 transition-colors relative overflow-hidden",
                  active
                    ? "border-bungie-accent/60 shadow-[0_0_24px_rgba(243,7,94,0.15)]"
                    : "hover:border-bungie-accent/30",
                ].join(" ")}
              >
                <div
                  className={`absolute inset-0 bg-linear-to-br ${cat.tint} to-transparent opacity-50 pointer-events-none`}
                />
                <div className="relative">
                  <div className="text-2xl mb-1.5">{cat.emoji}</div>
                  <div className="font-bold text-sm">{t(cat.labelKey)}</div>
                  <div className="font-mono text-[11px] text-bungie-muted mt-1">
                    {list.length > 1
                      ? t("bot.modules.cmdCountPlural", { n: list.length })
                      : t("bot.modules.cmdCount", { n: list.length })}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Command catalog */}
      {data && (
        <section className="panel p-6">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-bungie-accent font-bold">
                {t("bot.catalog.kicker")}
              </div>
              <h2 className="text-lg font-bold mt-1">
                {activeCategory
                  ? t(
                      CATEGORIES.find((c) => c.key === activeCategory)
                        ?.labelKey ?? ""
                    )
                  : t("bot.catalog.allCommands", { n: data.commands.length })}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {activeCategory && (
                <button
                  onClick={() => setActiveCategory(null)}
                  className="text-[10px] font-mono uppercase tracking-wider text-bungie-muted hover:text-white transition-colors"
                >
                  {t("bot.catalog.viewAll")}
                </button>
              )}
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("bot.catalog.search")}
                  className="h-8 w-44 rounded-md bg-black/40 border border-bungie-border px-3 text-xs focus:outline-none focus:border-bungie-accent/50"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            {visibleCommands.map((cmd) => (
              <div
                key={cmd.name}
                className="flex items-center gap-3 py-2 border-b border-bungie-border/40 last:border-b-0"
              >
                <span className="font-mono text-[12.5px] font-bold text-bungie-accent shrink-0 w-32 truncate">
                  /{cmd.name.replace(/^\//, "")}
                </span>
                <span className="text-xs text-bungie-text/75 flex-1 min-w-0 truncate">
                  {cmd.description}
                </span>
                {cmd.count !== undefined && cmd.count > 0 && (
                  <span className="font-mono text-[10px] text-bungie-muted shrink-0 tabular-nums">
                    {formatNumber(cmd.count)}
                  </span>
                )}
              </div>
            ))}
            {visibleCommands.length === 0 && (
              <div className="col-span-full text-center py-6 text-xs text-bungie-muted">
                {t("bot.catalog.empty")}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Help strip */}
      <section className="panel p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-bungie-accent/10 border border-bungie-accent/30 flex items-center justify-center text-bungie-accent shrink-0">
            💬
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm">
              {t("bot.help.title")}
            </div>
            <div className="text-xs text-bungie-muted mt-0.5">
              {t("bot.help.subtitle")}
            </div>
          </div>
        </div>
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 h-9 rounded-full btn-primary font-bold text-xs flex items-center gap-2"
        >
          {t("bot.help.openDiscord")}
        </a>
      </section>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="panel p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-bungie-accent/5 to-transparent pointer-events-none" />
      <div className="relative">
        <div className="text-[10px] uppercase tracking-[0.18em] text-bungie-muted font-mono">
          {label}
        </div>
        <div className="text-2xl font-extrabold font-mono tabular-nums mt-1.5">
          {value}
        </div>
        {hint && (
          <div className="text-[10px] font-mono text-bungie-muted mt-1">
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}