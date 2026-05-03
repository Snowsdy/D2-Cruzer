import { ItemTile } from "./ItemTile"
import { DropZone } from "./DropZone"
import type { DestinyItemComponent } from "bungie-api-ts/destiny2"

interface Props {
  bucketHash: number
  item: DestinyItemComponent | undefined
  characterId: string
  size?: "sm" | "md" | "lg"
}

// A bucket-specific dropzone that also displays the currently equipped item.
// Dropping a matching item will move it (if on vault/other char) then equip.
export function EquippedSlot({
  bucketHash,
  item,
  characterId,
  size = "md",
}: Props) {
  const dim =
    size === "sm" ? "w-12 h-12" : size === "lg" ? "w-20 h-20" : "w-16 h-16"

  return (
    <DropZone
      accept={(src) => (src.naturalSlotHash ?? src.bucketHash) === bucketHash}
      onDrop={async (actions, src) => {
        try {
          // If not already on this character, move it here first
          if (src.ownerCharacterId !== characterId) {
            await actions.moveToCharacter.mutateAsync({
              itemInstanceId: src.itemInstanceId,
              itemReferenceHash: src.itemHash,
              fromCharacterId: src.ownerCharacterId,
              toCharacterId: characterId,
            })
          }
          await actions.equip.mutateAsync({
            itemInstanceId: src.itemInstanceId,
            characterId,
          })
        } catch (e) {
          console.error("Equip failed:", e)
        }
      }}
      className={`${dim} rounded-md`}
    >
      {item ? (
        <ItemTile item={item} size={size} ownerCharacterId={characterId} />
      ) : (
        <div
          className={`${dim} rounded-md border-2 border-dashed border-white/10 bg-black/30`}
        />
      )}
    </DropZone>
  )
}
