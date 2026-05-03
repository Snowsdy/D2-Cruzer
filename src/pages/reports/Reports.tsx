import { useMemo, useState, type ReactElement } from "react"
import { useTranslation } from "react-i18next"
import { RaidsView } from "./RaidsView"
import { DungeonsView } from "./DungeonsView"
import { CheckpointsView } from "./CheckpointsView"
import { useAggregateActivities } from "@/hooks/useAggregateActivities"
import { useAccountStats } from "@/hooks/useAccountStats"
import { useManifestStore } from "@/store/manifest"
import { readStat } from "@/api/stats"
import { IconSparkle, IconVault, IconPackage } from "@/components/icon"
import { fmtDurationHMS as fmtTime } from "@/utils/format"

type Tab = "raids" | "dungeons" | "checkpoints"

interface TabDef {
  id: Tab
  label: string
  icon: ReactElement
  color: string
}

function StatCard({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string
  value: string | number
  hint?: string
  accent?: string
  icon?: ReactElement
}) {
  return (
    <div className="bg-bungie-panel/70 border-bungie-border hover:border-bungie-accent/30 relative overflow-hidden rounded-xl border p-4 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="text-bungie-muted text-[9px] font-semibold tracking-widest uppercase">
          {label}
        </div>
        {icon && <div className="text-bungie-muted/70">{icon}</div>}
      </div>
      <div
        className={`mt-2 text-2xl leading-none font-extrabold tabular-nums ${accent ?? "text-white"}`}
      >
        {value || "—"}
      </div>
      {hint && (
        <div className="text-bungie-muted mt-1.5 text-[10px] tabular-nums">
          {hint}
        </div>
      )}
    </div>
  )
}

function ReportsOverview() {
  const { merged } = useAggregateActivities()
  const accountStats = useAccountStats()
  const manifest = useManifestStore((s) => s.manifest)

  const summary = useMemo(() => {
    const actDefs = manifest?.DestinyActivityDefinition ?? {}
    let raidClears = 0
    let dungeonClears = 0
    let pveClears = 0
    let fastestRaidMs = 0
    let fastestDungeonMs = 0
    let bestRaidKills = 0
    let bestDungeonKills = 0
    const raidsPlayed = new Set<string>()
    const dungeonsPlayed = new Set<string>()

    for (const a of merged) {
      const def = actDefs[a.activityHash]
      if (!def) continue
      const mode = def.directActivityModeType
      const name = def.displayProperties?.name ?? ""
      if (mode === 4) {
        raidClears += a.completions
        if (a.completions > 0) raidsPlayed.add(name)
        if (
          a.fastestMs > 0 &&
          (fastestRaidMs === 0 || a.fastestMs < fastestRaidMs)
        ) {
          fastestRaidMs = a.fastestMs
        }
        if (a.bestKills > bestRaidKills) bestRaidKills = a.bestKills
      } else if (mode === 82) {
        dungeonClears += a.completions
        if (a.completions > 0) dungeonsPlayed.add(name)
        if (
          a.fastestMs > 0 &&
          (fastestDungeonMs === 0 || a.fastestMs < fastestDungeonMs)
        ) {
          fastestDungeonMs = a.fastestMs
        }
        if (a.bestKills > bestDungeonKills) bestDungeonKills = a.bestKills
      } else {
        pveClears += a.completions
      }
    }

    const r = accountStats.data?.mergedAllCharacters?.results
    const pveKills = readStat(r?.allPvE?.allTime, "kills")
    const pveTime = readStat(r?.allPvE?.allTime, "secondsPlayed")

    return {
      raidClears,
      dungeonClears,
      pveClears,
      fastestRaidMs,
      fastestDungeonMs,
      bestRaidKills,
      bestDungeonKills,
      raidActivities: raidsPlayed.size,
      dungeonActivities: dungeonsPlayed.size,
      pveKills,
      pveTime,
    }
  }, [merged, manifest, accountStats.data])

  return (
    <div className="stagger grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard
        label="Raids terminés"
        value={summary.raidClears.toLocaleString()}
        hint={`${summary.raidActivities} raid${summary.raidActivities > 1 ? "s" : ""} différent${summary.raidActivities > 1 ? "s" : ""}`}
        accent="text-red-300"
      />
      <StatCard
        label="Donjons terminés"
        value={summary.dungeonClears.toLocaleString()}
        hint={`${summary.dungeonActivities} donjon${summary.dungeonActivities > 1 ? "s" : ""} différent${summary.dungeonActivities > 1 ? "s" : ""}`}
        accent="text-pink-300"
      />
      <StatCard
        label="Raid le plus rapide"
        value={fmtTime(summary.fastestRaidMs)}
        hint={
          summary.bestRaidKills > 0
            ? `${summary.bestRaidKills} kills record`
            : undefined
        }
        accent="text-amber-300"
      />
      <StatCard
        label="Donjon le plus rapide"
        value={fmtTime(summary.fastestDungeonMs)}
        hint={
          summary.bestDungeonKills > 0
            ? `${summary.bestDungeonKills} kills record`
            : undefined
        }
        accent="text-emerald-300"
      />
    </div>
  )
}

export function Reports() {
  const { t } = useTranslation()
  const [active, setActive] = useState<Tab>("raids")

  const tabs: TabDef[] = [
    {
      id: "raids",
      label: "Raids",
      icon: <IconSparkle size={16} />,
      color: "text-red-300",
    },
    {
      id: "dungeons",
      label: "Donjons",
      icon: <IconVault size={16} />,
      color: "text-purple-300",
    },
    {
      id: "checkpoints",
      label: "Checkpoints",
      icon: <IconPackage size={16} />,
      color: "text-pink-300",
    },
  ]

  const view: Record<Tab, ReactElement> = {
    raids: <RaidsView />,
    dungeons: <DungeonsView />,
    checkpoints: <CheckpointsView />,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("reports.title")}</h1>
          <p className="text-bungie-muted mt-1 text-sm">
            {t("reports.subtitle")}
          </p>
        </div>
        <div className="bg-bungie-panel/60 border-bungie-border flex gap-1 rounded-full border p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-all ${
                active === tab.id
                  ? `bg-bungie-accent shadow-glow font-semibold text-black`
                  : `${tab.color} hover:text-white`
              }`}
            >
              <span className="inline-flex items-center">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <ReportsOverview />
      {view[active]}
    </div>
  )
}
