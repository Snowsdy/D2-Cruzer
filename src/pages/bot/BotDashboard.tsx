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
import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

// Allow overriding the stats source — handy when testing a bot running
// locally or on a staging host.
const STATS_URL = "https://cruzer.gg/bot-stats.json"
const BOT_INVITE_URL =
  "https://discord.com/oauth2/authorize?client_id=1465702655945867448&scope=bot+applications.commands&permissions=2048"
const SUPPORT_URL = "https://cruzer.gg"

interface BotStats {
  online: boolean
  version: string
  servers: number
  users: number
  commandsLast24h: number
  commandsAllTime: number
  uptimeSeconds: number
  lastDeployAt: string
  commands: Array<{
    name: string
    description: string
    count?: number
    category?: string
  }>
  topCommands24h: Array<{ name: string; count: number }>
}

// Cruzer categorisation — names match the bot's `SlashCommand.category`
// enum so the dashboard mirrors the bot's own grouping.
const CATEGORIES: Array<{
  key: string
  labelKey: string
  emoji: string
  tint: string
}> = [
  {
    key: "world",
    labelKey: "bot.categories.world",
    emoji: "🌍",
    tint: "from-sky-500/10",
  },
  {
    key: "player",
    labelKey: "bot.categories.player",
    emoji: "🛡",
    tint: "from-indigo-500/10",
  },
  {
    key: "items",
    labelKey: "bot.categories.items",
    emoji: "🗡",
    tint: "from-amber-500/10",
  },
  {
    key: "vendors",
    labelKey: "bot.categories.vendors",
    emoji: "🏪",
    tint: "from-emerald-500/10",
  },
  {
    key: "marathon",
    labelKey: "bot.categories.marathon",
    emoji: "🏁",
    tint: "from-lime-500/10",
  },
  {
    key: "utility",
    labelKey: "bot.categories.utility",
    emoji: "⚙",
    tint: "from-zinc-500/10",
  },
  {
    key: "admin",
    labelKey: "bot.categories.admin",
    emoji: "🔧",
    tint: "from-rose-500/10",
  },
]

// Static catalog of commands → their category, used to group the list
// pulled from bot-stats.json. If the JSON carries `category` fields
// directly, we use those; otherwise we fall back to this mapping.
const COMMAND_CATEGORY: Record<string, string> = {
  xur: "world",
  trials: "world",
  nightfall: "world",
  raid: "world",
  dungeon: "world",
  lost: "world",
  reset: "world",
  season: "world",
  stats: "player",
  raids: "player",
  titles: "player",
  season_stats: "player",
  inventory: "player",
  profile: "player",
  item: "items",
  roll: "items",
  perk: "items",
  exotic: "items",
  vendor: "vendors",
  checkpoint: "vendors",
  marathon: "marathon",
  help: "utility",
  bot: "utility",
  invite: "utility",
  feedback: "utility",
  setup: "admin",
}

function formatUptime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—"
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}j ${String(h).padStart(2, "0")}h`
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`
  return `${m}m`
}

function formatNumber(n: number | undefined): string {
  if (n === undefined || !Number.isFinite(n)) return "—"
  return n.toLocaleString("fr-FR")
}

function categoryOf(cmd: { name: string; category?: string }): string {
  if (cmd.category) return cmd.category
  const slug = cmd.name.replace(/^\//, "")
  return COMMAND_CATEGORY[slug] ?? "utility"
}

export function BotDashboard() {
  const { t } = useTranslation()
  const { data, isLoading, isError, refetch, dataUpdatedAt } =
    useQuery<BotStats>({
      queryKey: ["bot-stats"],
      queryFn: async () => {
        const res = await fetch(STATS_URL, { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return (await res.json()) as BotStats
      },
      refetchInterval: 60_000,
      retry: 1,
    })

  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const grouped = useMemo(() => {
    const map = new Map<string, BotStats["commands"]>()
    for (const cmd of data?.commands ?? []) {
      const cat = categoryOf(cmd)
      const arr = map.get(cat) ?? []
      arr.push(cmd)
      map.set(cat, arr)
    }
    return map
  }, [data?.commands])

  const visibleCommands = useMemo(() => {
    const all = data?.commands ?? []
    const needle = search.trim().toLowerCase()
    return all.filter((cmd) => {
      if (activeCategory && categoryOf(cmd) !== activeCategory) return false
      if (!needle) return true
      return (
        cmd.name.toLowerCase().includes(needle) ||
        cmd.description.toLowerCase().includes(needle)
      )
    })
  }, [data?.commands, activeCategory, search])

  const maxTopCount = useMemo(
    () => Math.max(1, ...(data?.topCommands24h?.map((c) => c.count) ?? [0])),
    [data?.topCommands24h]
  )

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      {/* Hero strip — status + identity + actions */}
      <section
        className="border-bungie-border relative overflow-hidden rounded-2xl border p-6 md:p-7"
        style={{
          background:
            "linear-gradient(135deg, rgba(243,7,94,0.12) 0%, rgba(168,85,247,0.06) 50%, transparent 80%), #0d0d16",
        }}
      >
        <div className="bg-bungie-accent/15 pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full blur-3xl" />
        <div className="relative flex flex-wrap items-start gap-5 md:flex-nowrap">
          <div className="border-bungie-accent/40 flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-black/60 shadow-[0_0_24px_rgba(243,7,94,0.25)]">
            <img
              src="/cruzer-logo.png"
              alt=""
              className="h-14 w-14"
              onError={(e) =>
                ((e.target as HTMLImageElement).style.display = "none")
              }
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-[10px] tracking-[0.25em] uppercase">
              <span
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-bold",
                  data?.online
                    ? "border border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                    : "border border-zinc-500/30 bg-zinc-500/10 text-zinc-400",
                ].join(" ")}
              >
                <span
                  className={[
                    "h-1.5 w-1.5 rounded-full",
                    data?.online
                      ? "animate-pulse bg-emerald-400"
                      : "bg-zinc-500",
                  ].join(" ")}
                />
                {data?.online
                  ? t("bot.status.online")
                  : t("bot.status.offline")}
              </span>
              <span className="text-bungie-muted">
                {data ? `v${data.version}` : "—"}
              </span>
              <span className="text-bungie-muted">·</span>
              <span className="text-bungie-muted">{t("bot.meta")}</span>
            </div>
            <h1 className="mt-3 text-3xl leading-none font-extrabold tracking-tight md:text-4xl">
              Cruzer<span className="text-bungie-accent">.</span>gg{" "}
              {t("bot.heroTitle")}
            </h1>
            <p className="text-bungie-muted mt-3 max-w-2xl text-sm leading-relaxed">
              {t("bot.description")}
            </p>
          </div>

          <div className="flex shrink-0 gap-2 self-start">
            <a
              href={BOT_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-bold"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.317 4.369A19.79 19.79 0 0 0 16.558 3.2a.07.07 0 0 0-.074.035c-.163.29-.343.668-.47.97a18.27 18.27 0 0 0-5.487 0 12.66 12.66 0 0 0-.477-.97.074.074 0 0 0-.074-.035c-1.29.221-2.523.613-3.76 1.169a.066.066 0 0 0-.031.027C2.533 8.046 1.83 11.607 2.176 15.125a.082.082 0 0 0 .031.056 19.91 19.91 0 0 0 6.004 3.034.074.074 0 0 0 .081-.026c.463-.63.875-1.295 1.227-1.994a.072.072 0 0 0-.04-.1 13.1 13.1 0 0 1-1.872-.892.074.074 0 0 1-.007-.123c.126-.094.252-.192.372-.292a.07.07 0 0 1 .074-.01c3.928 1.793 8.18 1.793 12.061 0a.07.07 0 0 1 .075.009c.121.1.247.2.373.293a.074.074 0 0 1-.006.123c-.598.35-1.22.646-1.873.892a.073.073 0 0 0-.04.1c.36.7.772 1.365 1.226 1.994a.074.074 0 0 0 .082.026 19.84 19.84 0 0 0 6.013-3.034.074.074 0 0 0 .03-.055c.413-4.068-.691-7.6-2.926-10.73a.057.057 0 0 0-.03-.028zM8.02 12.985c-1.183 0-2.156-1.085-2.156-2.42 0-1.333.956-2.42 2.156-2.42 1.21 0 2.175 1.096 2.156 2.42 0 1.335-.955 2.42-2.156 2.42zm7.974 0c-1.183 0-2.156-1.085-2.156-2.42 0-1.333.956-2.42 2.156-2.42 1.21 0 2.175 1.096 2.156 2.42 0 1.335-.947 2.42-2.156 2.42z" />
              </svg>
              {t("bot.invite")}
            </a>
            <a
              href={SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="border-bungie-border hover:border-bungie-accent/40 text-bungie-text/85 flex h-9 items-center gap-1.5 rounded-full border px-4 text-xs font-medium transition-colors hover:bg-white/5 hover:text-white"
            >
              {t("bot.support")}
            </a>
            <button
              onClick={() => void refetch()}
              className="border-bungie-border hover:border-bungie-accent/40 text-bungie-text/85 flex h-9 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors hover:bg-white/5 hover:text-white"
              title={t("bot.refresh")}
            >
              ⟳
            </button>
          </div>
        </div>
      </section>

      {isLoading && (
        <div className="panel text-bungie-muted p-6 text-center text-sm">
          {t("bot.loading")}
        </div>
      )}

      {isError && (
        <div className="panel space-y-2 p-6 text-center">
          <div className="text-sm font-bold text-amber-300">
            {t("bot.statusUnavailable")}
          </div>
          <div className="text-bungie-muted text-xs">
            {t("bot.statusUnavailableHint", { url: STATS_URL })}
          </div>
        </div>
      )}

      {/* Stat tiles */}
      {data && (
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatTile
            label={t("bot.tiles.servers")}
            value={formatNumber(data.servers)}
          />
          <StatTile
            label={t("bot.tiles.users")}
            value={formatNumber(data.users)}
          />
          <StatTile
            label={t("bot.tiles.commands24h")}
            value={formatNumber(data.commandsLast24h)}
            hint={t("bot.tiles.commandsTotal", {
              n: formatNumber(data.commandsAllTime),
            })}
          />
          <StatTile
            label={t("bot.tiles.uptime")}
            value={formatUptime(data.uptimeSeconds)}
            hint={
              data.lastDeployAt
                ? t("bot.tiles.deployed", {
                    date: new Date(data.lastDeployAt).toLocaleDateString(),
                  })
                : undefined
            }
          />
        </section>
      )}

      {data && data.topCommands24h && data.topCommands24h.length > 0 && (
        <section className="panel p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-bungie-accent text-[10px] font-bold tracking-[0.25em] uppercase">
                {t("bot.top.kicker")}
              </div>
              <h2 className="mt-1 text-lg font-bold">{t("bot.top.title")}</h2>
            </div>
            <span className="text-bungie-muted font-mono text-[10px]">
              {dataUpdatedAt
                ? t("bot.top.updatedAt", {
                    time: new Date(dataUpdatedAt).toLocaleTimeString(),
                  })
                : ""}
            </span>
          </div>
          <div className="space-y-2.5">
            {data.topCommands24h.slice(0, 6).map((c, i) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="text-bungie-muted w-6 font-mono text-[11px] tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-bungie-accent text-xs font-bold">
                    /{c.name.replace(/^\//, "")}
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/40">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((c.count / maxTopCount) * 100)}%`,
                        background: "linear-gradient(90deg, #f3075e, #a855f7)",
                      }}
                    />
                  </div>
                </div>
                <span className="text-bungie-muted w-20 text-right font-mono text-[11px] tabular-nums">
                  {formatNumber(c.count)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Module tiles (category overview) */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-bungie-muted text-[10px] tracking-[0.25em] uppercase">
              {t("bot.modules.kicker")}
            </div>
            <h2 className="mt-1 text-lg font-bold">{t("bot.modules.title")}</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {CATEGORIES.map((cat) => {
            const list = grouped.get(cat.key) ?? []
            const active = activeCategory === cat.key
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(active ? null : cat.key)}
                className={[
                  "panel relative overflow-hidden p-4 text-left transition-colors",
                  active
                    ? "border-bungie-accent/60 shadow-[0_0_24px_rgba(243,7,94,0.15)]"
                    : "hover:border-bungie-accent/30",
                ].join(" ")}
              >
                <div
                  className={`absolute inset-0 bg-linear-to-br ${cat.tint} pointer-events-none to-transparent opacity-50`}
                />
                <div className="relative">
                  <div className="mb-1.5 text-2xl">{cat.emoji}</div>
                  <div className="text-sm font-bold">{t(cat.labelKey)}</div>
                  <div className="text-bungie-muted mt-1 font-mono text-[11px]">
                    {list.length > 1
                      ? t("bot.modules.cmdCountPlural", { n: list.length })
                      : t("bot.modules.cmdCount", { n: list.length })}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Command catalog */}
      {data && (
        <section className="panel p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-bungie-accent text-[10px] font-bold tracking-[0.25em] uppercase">
                {t("bot.catalog.kicker")}
              </div>
              <h2 className="mt-1 text-lg font-bold">
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
                  className="text-bungie-muted font-mono text-[10px] tracking-wider uppercase transition-colors hover:text-white"
                >
                  {t("bot.catalog.viewAll")}
                </button>
              )}
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("bot.catalog.search")}
                  className="border-bungie-border focus:border-bungie-accent/50 h-8 w-44 rounded-md border bg-black/40 px-3 text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-x-6 gap-y-1 md:grid-cols-2">
            {visibleCommands.map((cmd) => (
              <div
                key={cmd.name}
                className="border-bungie-border/40 flex items-center gap-3 border-b py-2 last:border-b-0"
              >
                <span className="text-bungie-accent w-32 shrink-0 truncate font-mono text-[12.5px] font-bold">
                  /{cmd.name.replace(/^\//, "")}
                </span>
                <span className="text-bungie-text/75 min-w-0 flex-1 truncate text-xs">
                  {cmd.description}
                </span>
                {cmd.count !== undefined && cmd.count > 0 && (
                  <span className="text-bungie-muted shrink-0 font-mono text-[10px] tabular-nums">
                    {formatNumber(cmd.count)}
                  </span>
                )}
              </div>
            ))}
            {visibleCommands.length === 0 && (
              <div className="text-bungie-muted col-span-full py-6 text-center text-xs">
                {t("bot.catalog.empty")}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Help strip */}
      <section className="panel flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="bg-bungie-accent/10 border-bungie-accent/30 text-bungie-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border">
            💬
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">{t("bot.help.title")}</div>
            <div className="text-bungie-muted mt-0.5 text-xs">
              {t("bot.help.subtitle")}
            </div>
          </div>
        </div>
        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary flex h-9 items-center gap-2 rounded-full px-4 text-xs font-bold"
        >
          {t("bot.help.openDiscord")}
        </a>
      </section>
    </div>
  )
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="panel relative overflow-hidden p-4">
      <div className="from-bungie-accent/5 pointer-events-none absolute inset-0 bg-linear-to-br to-transparent" />
      <div className="relative">
        <div className="text-bungie-muted font-mono text-[10px] tracking-[0.18em] uppercase">
          {label}
        </div>
        <div className="mt-1.5 font-mono text-2xl font-extrabold tabular-nums">
          {value}
        </div>
        {hint && (
          <div className="text-bungie-muted mt-1 font-mono text-[10px]">
            {hint}
          </div>
        )}
      </div>
    </div>
  )
}
