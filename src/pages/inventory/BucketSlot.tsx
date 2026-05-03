/* eslint-disable react-hooks/purity */
import { useTranslation } from "react-i18next"
import { useManifestStore } from "@/store/manifest"
import { ItemTile } from "./ItemTile"
import type { DestinyItemComponent } from "bungie-api-ts/destiny2"

interface Props {
  bucketHash: number
  equipped?: DestinyItemComponent
  items?: DestinyItemComponent[]
}

// A single bucket column — equipped item (top, larger) + stash items below.
export function BucketSlot({ bucketHash, equipped, items = [] }: Props) {
  const manifest = useManifestStore((s) => s.manifest)
  const { t } = useTranslation()
  const bucketName =
    manifest?.DestinyInventoryBucketDefinition[bucketHash]?.displayProperties
      ?.name ?? ""

  return (
    <div className="min-w-0">
      <div className="text-bungie-muted mb-1 truncate text-[10px] tracking-wider uppercase">
        {bucketName || t("common.loading")}
      </div>
      <div className="space-y-2">
        {equipped && <ItemTile item={equipped} size="lg" />}
        {items.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {items.map((it) => (
              <ItemTile
                key={it.itemInstanceId ?? `${it.itemHash}-${Math.random()}`}
                item={it}
                size="sm"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
