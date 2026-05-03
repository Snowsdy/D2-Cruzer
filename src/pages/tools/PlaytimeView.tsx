import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { useProfile } from "@/hooks/useProfile"
import { useAccountStats } from "@/hooks/useAccountStats"
import { useManifestStore } from "@/store/manifest"
import { readStat } from "@/api/stats"
import { fmtHoursMinutes as fmtHours, fmtDays } from "@/utils/format"
import { ACCENTS } from "@/constants/uiAccents"

const { text: ACCENT, border: ACCENT_BORDER } = ACCENTS.playtime

export function PlaytimeView() {
  const { t } = useTranslation()
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs">
        <Link to="/tools" className="text-bungie-muted hover:text-white">
          ← {t("nav.tools")}
        </Link>
      </div>
      <PlaytimeContent />
    </div>
  )
}

export function PlaytimeContent() {
  const { t } = useTranslation()
  const { profile } = useProfile()
  const accountStats = useAccountStats()
  const manifest = useManifestStore((s) => s.manifest)

  const chars = profile.data?.characters?.data
  const charsArr = useMemo(() => {
    if (!chars) return []
    return Object.values(chars).sort(
      (a, b) =>
        (Number(b.minutesPlayedTotal) || 0) -
        (Number(a.minutesPlayedTotal) || 0)
    )
  }, [chars])

  const totalSeconds = useMemo(() => {
    let total = 0
    for (const c of charsArr) total += (Number(c.minutesPlayedTotal) || 0) * 60
    return total
  }, [charsArr])

  const firstLogin = useMemo(() => {
    if (!charsArr.length) return null
    return charsArr
      .map((c) => new Date(c.dateLastPlayed))
      .sort((a, b) => a.getTime() - b.getTime())[0]
  }, [charsArr])

  const lastLogin = useMemo(() => {
    if (!charsArr.length) return null
    return charsArr
      .map((c) => new Date(c.dateLastPlayed))
      .sort((a, b) => b.getTime() - a.getTime())[0]
  }, [charsArr])

  // Per-mode seconds (from account-level merged stats).
  const modeBreakdown = useMemo(() => {
    const r = accountStats.data?.mergedAllCharacters?.results
    if (!r) return []
    const rows: Array<{
      key: string
      label: string
      seconds: number
      color: string
    }> = [
      {
        key: "pvp",
        label: t("playtime.mode.pvp"),
        seconds: readStat(r.allPvP?.allTime, "secondsPlayed"),
        color: "bg-red-400/70",
      },
      {
        key: "strikes",
        label: t("playtime.mode.strikes"),
        seconds: readStat(r.allStrikes?.allTime, "secondsPlayed"),
        color: "bg-pink-400/70",
      },
      {
        key: "raid",
        label: t("playtime.mode.raid"),
        seconds: readStat(r.raid?.allTime, "secondsPlayed"),
        color: "bg-purple-400/70",
      },
      {
        key: "pve",
        label: t("playtime.mode.pve"),
        seconds: readStat(r.allPvE?.allTime, "secondsPlayed"),
        color: "bg-emerald-400/70",
      },
    ].filter((x) => x.seconds > 0)
    rows.sort((a, b) => b.seconds - a.seconds)
    return rows
  }, [accountStats.data, t])

  const maxMode = Math.max(1, ...modeBreakdown.map((x) => x.seconds))

  const classDefs = manifest?.DestinyClassDefinition ?? {}
  const raceDefs = manifest?.DestinyRaceDefinition ?? {}

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`panel border p-5 ${ACCENT_BORDER}`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className={`text-[10px] tracking-widest uppercase ${ACCENT}`}>
              {t("playtime.title")}
            </div>
            <div className="text-4xl font-bold tabular-nums">
              {fmtHours(totalSeconds)}
            </div>
            <div className="text-bungie-muted mt-1 text-sm">
              ≈ {fmtDays(totalSeconds)} {t("playtime.spentInDestiny")}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6 text-right">
            <div>
              <div className="text-bungie-muted text-[9px] tracking-widest uppercase">
                {t("playtime.firstSeen")}
              </div>
              <div className="text-sm font-semibold">
                {firstLogin
                  ? new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                    }).format(firstLogin)
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-bungie-muted text-[9px] tracking-widest uppercase">
                {t("playtime.lastSeen")}
              </div>
              <div className="text-sm font-semibold">
                {lastLogin
                  ? new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                    }).format(lastLogin)
                  : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mode breakdown */}
      {modeBreakdown.length > 0 && (
        <div className="panel p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <span className={ACCENT}>◆</span>
            {t("playtime.byMode")}
          </h3>
          <div className="space-y-3">
            {modeBreakdown.map((row) => {
              const pct = (row.seconds / maxMode) * 100
              const sharePct = totalSeconds
                ? (row.seconds / totalSeconds) * 100
                : 0
              return (
                <div key={row.key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold">{row.label}</span>
                    <span className="text-bungie-muted tabular-nums">
                      {fmtHours(row.seconds)} ·{" "}
                      <span className={ACCENT}>{sharePct.toFixed(1)}%</span>
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full border border-white/5 bg-black/40">
                    <div
                      className={`${row.color} h-full rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Per-character */}
      <div className="panel p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <span className={ACCENT}>◆</span>
          {t("playtime.byCharacter")}
        </h3>
        <div className="stagger grid gap-3 md:grid-cols-3">
          {charsArr.map((c) => {
            const secs = (Number(c.minutesPlayedTotal) || 0) * 60
            const share = totalSeconds ? (secs / totalSeconds) * 100 : 0
            const className =
              classDefs[c.classHash]?.displayProperties?.name ?? "?"
            const raceName = raceDefs[c.raceHash]?.displayProperties?.name ?? ""
            return (
              <div
                key={c.characterId}
                className="border-bungie-border bg-bungie-panel/50 relative overflow-hidden rounded-xl border p-4"
                style={
                  c.emblemBackgroundPath
                    ? {
                        backgroundImage: `linear-gradient(180deg, rgba(7,7,13,0.7), rgba(7,7,13,0.92)), url(https://www.bungie.net${c.emblemBackgroundPath})`,
                        backgroundSize: "cover",
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-3">
                  {c.emblemPath && (
                    <img
                      src={`https://www.bungie.net${c.emblemPath}`}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded border border-white/20 bg-black/40"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-white drop-shadow">
                      {className}
                    </div>
                    <div className="text-[10px] tracking-widest text-white/70 uppercase">
                      {raceName} · {c.light} PL
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold tabular-nums">
                    {fmtHours(secs)}
                  </div>
                  <div className="text-[10px] text-white/60 tabular-nums">
                    {share.toFixed(1)}% {t("playtime.ofTotal")}
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/40">
                  <div
                    className="h-full bg-emerald-400/70"
                    style={{ width: `${share}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {(profile.isLoading || accountStats.isLoading) && (
        <p className="text-bungie-muted text-sm">{t("common.loading")}</p>
      )}
    </div>
  )
}
