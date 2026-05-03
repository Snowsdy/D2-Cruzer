/* eslint-disable react-hooks/purity */
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { invoke } from "@tauri-apps/api/core"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useProfile } from "@/hooks/useProfile"
import { useAuthStore } from "@/store/auth"
import { useSelectedMembership } from "@/hooks/useProfile"

import { ItemTile } from "./ItemTile"
import { Buckets } from "@/constants/buckets"
import type { DestinyItemComponent } from "bungie-api-ts/destiny2"

const API_KEY = import.meta.env.VITE_BUNGIE_API_KEY as string

export function Postmaster() {
  const { t } = useTranslation()
  const { profile, activeCharacterId } = useProfile()
  const membership = useSelectedMembership()
  const qc = useQueryClient()

  const items: DestinyItemComponent[] = useMemo(() => {
    if (!activeCharacterId) return []
    const all =
      profile.data?.characterInventories?.data?.[activeCharacterId]?.items ?? []
    return all.filter((it) => it.bucketHash === Buckets.LostItems)
  }, [profile.data, activeCharacterId])

  const pull = useMutation({
    mutationFn: async (it: DestinyItemComponent) => {
      if (!activeCharacterId || !membership) throw new Error("No character")
      const token = useAuthStore.getState().accessToken
      if (!token) throw new Error("Not authenticated")
      await invoke("pull_from_postmaster", {
        apiKey: API_KEY,
        accessToken: token,
        itemReferenceHash: it.itemHash,
        stackSize: it.quantity ?? 1,
        itemId: it.itemInstanceId ?? "0",
        characterId: activeCharacterId,
        membershipType: membership.membershipType,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] })
      setTimeout(() => qc.refetchQueries({ queryKey: ["profile"] }), 1000)
      setTimeout(() => qc.refetchQueries({ queryKey: ["profile"] }), 2500)
    },
  })

  const pullAll = async () => {
    for (const it of items) {
      try {
        await pull.mutateAsync(it)
      } catch (e) {
        console.error("pull postmaster item failed:", e)
      }
    }
  }

  if (!activeCharacterId) {
    return <p className="text-bungie-muted">{t("inventory.noCharacter")}</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{t("postmaster.title")}</h2>
          <p className="text-bungie-muted text-sm">
            {t("postmaster.count", { n: items.length })}
          </p>
        </div>
        <button
          onClick={pullAll}
          disabled={pull.isPending || items.length === 0}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pull.isPending ? t("common.loading") : t("postmaster.pullAll")}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-bungie-muted text-sm">{t("postmaster.empty")}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((it) => (
            <button
              key={it.itemInstanceId ?? `${it.itemHash}-${Math.random()}`}
              onClick={() => pull.mutate(it)}
              className="relative"
              title={t("postmaster.pull")}
            >
              <ItemTile
                item={it}
                size="md"
                ownerCharacterId={activeCharacterId}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
