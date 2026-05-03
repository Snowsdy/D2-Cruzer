import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { getCurrentUserMemberships } from "@/api/profile"
import { useManifestStore } from "@/store/manifest"
import { useProfile } from "@/hooks/useProfile"
import { useUiStore } from "@/store/ui"
import { ItemDetailsModal } from "@/pages/inventory/ItemDetailsModal"
import { ExoticHero } from "./ExoticHero"
import { ExoticArsenal } from "./ExoticArsenal"
import { NewsPreview } from "./NewsPreview"
import { ResetTimers } from "./ResetTimer"
import { Currencies } from "./Currencies"
import { QuickStats } from "./QuickStats"
import { RecentDrops } from "./RecentDrops"
import { CharactersRow } from "./CharactersRow"
import { isABungieApiError } from "@/api/bungie"

function ErrorPanel({ error }: { error: unknown }) {
  const { t } = useTranslation()
  return (
    <div className="panel p-4 text-red-400">
      <p className="font-semibold">{t("common.error")}</p>
      <p className="mt-1 text-sm">
        {isABungieApiError(error)
          ? `${error.status} (${error.errorCode ?? "?"}): ${error.message}`
          : (error as Error).message}
      </p>
    </div>
  )
}

export function Dashboard() {
  const { t, i18n } = useTranslation()
  const loadManifest = useManifestStore((s) => s.load)
  const manifestError = useManifestStore((s) => s.error)

  useEffect(() => {
    loadManifest(i18n.resolvedLanguage)
  }, [i18n.resolvedLanguage, loadManifest])

  const memberships = useQuery({
    queryKey: ["memberships"],
    queryFn: getCurrentUserMemberships,
  })

  const { profile } = useProfile()

  const selectedItem = useUiStore((s) => s.selectedItem)
  const clearSelection = useUiStore((s) => s.selectItem)
  const itemInstances = profile.data?.itemComponents?.instances?.data ?? {}
  const itemStats = profile.data?.itemComponents?.stats?.data ?? {}

  const displayName = memberships.data?.bungieNetUser?.displayName
  const hour = new Date().getHours()
  const greeting =
    hour < 6
      ? t("dashboard.greeting.night", "Bonne nuit")
      : hour < 12
        ? t("dashboard.greeting.morning", "Bonjour")
        : hour < 18
          ? t("dashboard.greeting.afternoon", "Bon après-midi")
          : t("dashboard.greeting.evening", "Bonsoir")

  return (
    <div className="space-y-6">
      {/* Hero heading — time-aware greeting + subtle player identity strip. */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-bungie-accent mb-1.5 text-[10px] font-extrabold tracking-[0.3em] uppercase">
            {greeting}
          </div>
          <h1 className="text-3xl leading-none font-extrabold tracking-tight md:text-4xl">
            {displayName ? (
              <>
                <span className="text-white">{displayName}</span>
                <span className="text-bungie-muted font-bold">
                  {" "}
                  — {t("nav.dashboard")}
                </span>
              </>
            ) : (
              t("auth.welcome")
            )}
          </h1>
          <p className="text-bungie-muted mt-2 max-w-2xl text-sm">
            {t("dashboard.welcomeHint")}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.25em] text-white/50 uppercase"
          style={{
            background: "rgba(7,7,13,0.5)",
            border: "1px solid rgba(243,7,94,0.25)",
          }}
        >
          <span className="pulse-live h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {t("dashboard.liveBadge", "Données live")}
        </div>
      </div>

      {(memberships.error || profile.error || manifestError) && (
        <ErrorPanel
          error={
            memberships.error ?? profile.error ?? new Error(manifestError ?? "")
          }
        />
      )}

      <ExoticHero />

      <CharactersRow />

      <QuickStats />

      <ResetTimers />

      <ExoticArsenal />

      <RecentDrops />

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Currencies />
        <NewsPreview />
      </div>

      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          instance={
            selectedItem.itemInstanceId
              ? itemInstances[selectedItem.itemInstanceId]
              : undefined
          }
          stats={
            selectedItem.itemInstanceId
              ? itemStats[selectedItem.itemInstanceId]?.stats
              : undefined
          }
          onClose={() => clearSelection(null)}
        />
      )}
    </div>
  )
}
