import { useTranslation } from "react-i18next"
import { useAccountStats } from "@/hooks/useAccountStats"
import { useSelectedMembership } from "@/hooks/useProfile"
import { readStat } from "@/api/stats"

interface ReportLink {
  id: string
  title: string
  desc: string
  url: (membershipType: number, membershipId: string) => string
  accent: string
  border: string
  stats?: { label: string; value: string }[]
}

export function Reports() {
  const { t } = useTranslation()
  const stats = useAccountStats()
  const membership = useSelectedMembership()

  const raidGroup = stats.data?.mergedAllCharacters?.results?.raid?.allTime
  const pveGroup = stats.data?.mergedAllCharacters?.results?.allPvE?.allTime
  const raidClears = readStat(raidGroup, "activitiesCleared")
  const raidKills = readStat(raidGroup, "kills")
  const raidFastestMs = readStat(raidGroup, "fastestCompletionMs")
  const fastestRaid =
    raidFastestMs > 0
      ? `${Math.floor(raidFastestMs / 60000)}m ${Math.floor((raidFastestMs % 60000) / 1000)}s`
      : "—"

  // Dungeon stats are inside allPvE.allDoables — Bungie doesn't separate dungeons cleanly.
  // We use total PvE activities cleared minus raid clears as a rough indicator.
  const totalActivities = readStat(pveGroup, "activitiesCleared")
  const otherClears = Math.max(0, totalActivities - raidClears)

  const reports: ReportLink[] = [
    {
      id: "raid",
      title: "Raid Report",
      desc: "Historique de raids, clears, low-man, flawless",
      url: (mt, mid) => `https://raid.report/destiny/${mt}/${mid}`,
      accent: "text-red-300",
      border: "border-red-500/40 hover:border-red-400",
      stats: [
        { label: "Raids clear", value: raidClears.toLocaleString() },
        { label: "Plus rapide", value: fastestRaid },
        { label: "Kills raid", value: raidKills.toLocaleString() },
      ],
    },
    {
      id: "dungeon",
      title: "Dungeon Report",
      desc: "Historique de donjons + solo flawless",
      url: (mt, mid) => `https://dungeon.report/destiny/${mt}/${mid}`,
      accent: "text-pink-300",
      border: "border-pink-500/40 hover:border-pink-400",
      stats: [{ label: "Activités PvE", value: otherClears.toLocaleString() }],
    },
    {
      id: "checkpoints",
      title: "Checkpoint Bot",
      desc: "Récupère des checkpoints d'activités sauvegardés (raids/donjons)",
      url: () => "https://checkpoints.tech/",
      accent: "text-pink-300",
      border: "border-pink-500/40 hover:border-pink-400",
      stats: [{ label: "Checkpoints partagés", value: "Communauté" }],
    },
  ]

  const open = async (url: string) => {
    try {
      const { openUrl } = await import("@tauri-apps/plugin-opener")
      await openUrl(url)
    } catch {
      window.open(url, "_blank")
    }
  }

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="section-title">{t("dashboard.reports")}</h3>
        <span className="text-bungie-muted text-[10px] tracking-widest uppercase">
          {t("dashboard.reportsHint")}
        </span>
      </div>
      <div className="stagger grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((r) => {
          const url = membership
            ? r.url(membership.membershipType, membership.membershipId)
            : null
          return (
            <button
              key={r.id}
              onClick={() => url && open(url)}
              disabled={!url && r.id !== "checkpoints"}
              className={`panel border p-4 text-left ${r.border} transition-all hover:-translate-y-0.5 disabled:opacity-50`}
            >
              <div
                className={`text-sm font-bold tracking-widest uppercase ${r.accent}`}
              >
                {r.title}
              </div>
              <p className="text-bungie-muted mt-1 text-xs">{r.desc}</p>
              {r.stats && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {r.stats.map((s) => (
                    <div key={s.label} className="min-w-0">
                      <div className="text-bungie-muted truncate text-[9px] tracking-widest uppercase">
                        {s.label}
                      </div>
                      <div className="truncate text-base font-bold tabular-nums">
                        {s.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div
                className={`mt-3 text-[10px] tracking-widest uppercase ${r.accent}`}
              >
                Ouvrir →
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
