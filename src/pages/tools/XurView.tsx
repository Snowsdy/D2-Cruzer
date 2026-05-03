import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useQuery, useQueries } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { useState } from "react"
import { useProfile } from "@/hooks/useProfile"
import { getVendor, VendorHashes } from "@/api/vendors"
import { getItemDef } from "@/api/itemDef"
import { ItemPreviewModal } from "@/components/item-preview-modal"
import { fmtCountdownDHM as fmtCountdown } from "@/utils/format"
import { ACCENTS } from "@/constants/uiAccents"

const XUR_HASH = VendorHashes.Xur
const { text: ACCENT, border: ACCENT_BORDER } = ACCENTS.xur

// Xûr is present Friday 17:00 UTC → Tuesday 17:00 UTC.
function xurWindow(now = new Date()) {
  const dayUtc = now.getUTCDay() // 0=Sun … 5=Fri … 6=Sat
  const hourUtc = now.getUTCHours()
  // Friday after 17:00 UTC, all Saturday, all Sunday, all Monday,
  // Tuesday before 17:00 UTC.
  const present =
    (dayUtc === 5 && hourUtc >= 17) ||
    dayUtc === 6 ||
    dayUtc === 0 ||
    dayUtc === 1 ||
    (dayUtc === 2 && hourUtc < 17)

  // Compute next arrival/departure in UTC.
  const next = new Date(now)
  next.setUTCSeconds(0, 0)
  next.setUTCMinutes(0)
  if (present) {
    // Next Tuesday 17:00 UTC.
    const daysUntilTue = (2 - dayUtc + 7) % 7 || (hourUtc < 17 ? 0 : 7)
    next.setUTCDate(now.getUTCDate() + daysUntilTue)
    next.setUTCHours(17)
  } else {
    // Next Friday 17:00 UTC.
    const daysUntilFri = (5 - dayUtc + 7) % 7 || (hourUtc < 17 ? 0 : 7)
    next.setUTCDate(now.getUTCDate() + daysUntilFri)
    next.setUTCHours(17)
  }
  return { present, nextAt: next }
}

export function XurView() {
  const { t, i18n } = useTranslation()
  const { membership, activeCharacterId } = useProfile()
  const { present, nextAt } = useMemo(() => xurWindow(), [])
  const [previewHash, setPreviewHash] = useState<number | null>(null)

  const vendor = useQuery({
    queryKey: [
      "vendor",
      "xur",
      membership?.membershipType,
      membership?.membershipId,
      activeCharacterId,
    ],
    queryFn: () =>
      getVendor(
        membership!.membershipType,
        membership!.membershipId,
        activeCharacterId!,
        XUR_HASH
      ),
    enabled: !!membership && !!activeCharacterId && present,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const sales = useMemo(() => {
    const raw = vendor.data?.sales?.data ?? {}
    return Object.values(raw).filter((s) => s.itemHash)
  }, [vendor.data])

  const itemDefs = useQueries({
    queries: sales.map((s) => ({
      queryKey: ["itemDef", s.itemHash, i18n.language],
      queryFn: () => getItemDef(s.itemHash, i18n.language),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs">
        <Link to="/tools" className="text-bungie-muted hover:text-white">
          ← {t("nav.tools")}
        </Link>
      </div>

      {/* Header */}
      <div className={`panel border p-5 ${ACCENT_BORDER}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className={`text-[10px] tracking-widest uppercase ${ACCENT}`}>
              Xûr, Agent des Neuf
            </div>
            <div className="text-3xl font-bold">
              {present ? t("xur.here") : t("xur.arriving")}
            </div>
            <div className="text-bungie-muted mt-1 text-sm">
              {present
                ? `${t("xur.leavesIn")} ${fmtCountdown(nextAt)}`
                : `${t("xur.arrivesIn")} ${fmtCountdown(nextAt)}`}
            </div>
          </div>
          <div className={`text-5xl ${ACCENT} opacity-80 drop-shadow`}>✦</div>
        </div>
      </div>

      {!present && (
        <div className="panel text-bungie-muted p-6 text-center text-sm">
          {t("xur.awayNote")}
        </div>
      )}

      {present && vendor.isLoading && (
        <p className="text-bungie-muted text-sm">{t("common.loading")}</p>
      )}

      {present && vendor.isError && (
        <div className="panel border border-red-500/40 p-4">
          <p className="mb-1 font-semibold text-red-400">{t("common.error")}</p>
          <p className="text-bungie-muted text-sm">{String(vendor.error)}</p>
        </div>
      )}

      {present && sales.length > 0 && (
        <div className="stagger grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {sales.map((s, i) => {
            const def = itemDefs[i]?.data
            const icon = def?.displayProperties?.icon
            const name = def?.displayProperties?.name ?? `Item ${s.itemHash}`
            const typeName = def?.itemTypeDisplayName ?? ""
            const tier = def?.inventory?.tierTypeName ?? ""
            const tierClass =
              def?.inventory?.tierType === 6
                ? "border-yellow-400/60 bg-yellow-400/10 text-yellow-200"
                : def?.inventory?.tierType === 5
                  ? "border-purple-400/60 bg-purple-400/10 text-purple-200"
                  : "border-bungie-border bg-bungie-panel/60 text-white/70"
            return (
              <button
                key={`${s.itemHash}-${i}`}
                type="button"
                onClick={() => setPreviewHash(s.itemHash)}
                className="panel border-bungie-border flex cursor-pointer gap-3 border p-4 text-left transition-all hover:-translate-y-0.5 hover:border-amber-500/40"
              >
                {icon && (
                  <img
                    src={`https://www.bungie.net${icon}`}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg border border-white/20 bg-black/40"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-white">
                    {name}
                  </div>
                  <div className="text-bungie-muted truncate text-xs">
                    {typeName}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    {tier && (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-widest uppercase ${tierClass}`}
                      >
                        {tier}
                      </span>
                    )}
                  </div>
                  {s.costs && s.costs.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-white/80">
                      {s.costs.map((c, ci) => (
                        <CostBadge
                          key={ci}
                          itemHash={c.itemHash}
                          quantity={c.quantity}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {previewHash !== null && (
        <ItemPreviewModal
          itemHash={previewHash}
          onClose={() => setPreviewHash(null)}
        />
      )}
    </div>
  )
}

function CostBadge({
  itemHash,
  quantity,
}: {
  itemHash: number
  quantity: number
}) {
  const { i18n } = useTranslation()
  const { data } = useQuery({
    queryKey: ["itemDef", itemHash, i18n.language],
    queryFn: () => getItemDef(itemHash, i18n.language),
    staleTime: Infinity,
    gcTime: Infinity,
  })
  const icon = data?.displayProperties?.icon
  return (
    <span className="inline-flex items-center gap-1 rounded border border-white/10 bg-black/40 px-1.5 py-0.5 tabular-nums">
      {icon && (
        <img src={`https://www.bungie.net${icon}`} alt="" className="h-4 w-4" />
      )}
      {quantity.toLocaleString()}
    </span>
  )
}
