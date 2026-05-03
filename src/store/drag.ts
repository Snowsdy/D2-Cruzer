import { create } from "zustand";
import type { DestinyItemComponent } from "bungie-api-ts/destiny2";

export interface DragSource {
  item: DestinyItemComponent;
  ownerCharacterId: string | null; // null = vault
  /**
   * The item's natural slot (from the item definition's
   * `inventory.bucketTypeHash`). Vault items all report a runtime
   * `bucketHash` of GeneralVault, which breaks slot-based drop targets —
   * drop zones should prefer this value when it's set.
   */
  naturalSlotHash?: number;
}

interface DragState {
  dragging: DragSource | null;
  setDragging: (s: DragSource | null) => void;
}

export const useDragStore = create<DragState>((set) => ({
  dragging: null,
  setDragging: (s) => set({ dragging: s }),
}));