import { useMemberships } from "@/hooks/useProfile"
import { usePlatformStore } from "@/store/platform"
import { useQueryClient } from "@tanstack/react-query"
import type { UserInfoCard } from "bungie-api-ts/user"

// BungieMembershipType enum values — https://bungie-net.github.io/multi/schema_BungieMembershipType.html
const PLATFORM_META: Record<number, { label: string; icon: string }> = {
  1: { label: "Xbox", icon: "🟢" },
  2: { label: "PlayStation", icon: "🔵" },
  3: { label: "Steam", icon: "⚫" },
  4: { label: "Blizzard", icon: "🔷" },
  5: { label: "Stadia", icon: "🔴" },
  6: { label: "Epic", icon: "◼" },
}

function platformLabel(type: number): string {
  return PLATFORM_META[type]?.label ?? `Plateforme ${type}`
}

function platformIcon(type: number): string {
  return PLATFORM_META[type]?.icon ?? "?"
}

export function PlatformSwitcher() {
  const memberships = useMemberships()
  const qc = useQueryClient()
  const selectedId = usePlatformStore((s) => s.selectedMembershipId)
  const setSelected = usePlatformStore((s) => s.setSelected)
  const list: UserInfoCard[] = memberships.data?.destinyMemberships ?? []
  const primaryId = memberships.data?.primaryMembershipId

  if (list.length <= 1) return null

  const selected =
    list.find((m) => m.membershipId === selectedId) ??
    list.find((m) => m.membershipId === primaryId) ??
    list[0]

  return (
    <div
      className="bg-bungie-panel/60 border-bungie-border flex shrink-0 items-center gap-1 rounded-full border p-1"
      title="Plateforme Destiny active"
    >
      {list.map((m) => {
        const active = selected?.membershipId === m.membershipId
        const isCrossSaveOwner = m.membershipId === primaryId
        return (
          <button
            key={m.membershipId}
            onClick={() => {
              setSelected(m.membershipId)
              // Fully remove cached data for all membership-scoped queries so
              // the new platform starts from a clean slate (avoids mixing
              // inventory/stats from the previous platform in the UI).
              const scopes = [
                "profile",
                "accountStats",
                "characterStatsAll",
                "characterStatsMode",
                "history",
                "aggregateActivityStats",
                "vendor",
                "vendorDef",
                "itemInstance",
                "trialsStats",
                "nightfallStats",
                "ironBannerStats",
              ]
              for (const key of scopes) {
                qc.removeQueries({ queryKey: [key] })
              }
            }}
            title={`${platformLabel(m.membershipType)} · ${m.displayName || m.bungieGlobalDisplayName || ""}${isCrossSaveOwner ? " (primaire cross-save)" : ""}`}
            className={`flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-bold tracking-widest uppercase transition-all ${
              active
                ? "bg-bungie-accent/25 text-bungie-accent border-bungie-accent/50 border"
                : "text-bungie-muted hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="text-xs leading-none">
              {platformIcon(m.membershipType)}
            </span>
            <span>{platformLabel(m.membershipType)}</span>
            {isCrossSaveOwner && (
              <span
                className={`rounded px-1 text-[8px] ${active ? "bg-bungie-accent/30" : "bg-white/10"}`}
                title="Compte primaire cross-save"
              >
                ★
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
