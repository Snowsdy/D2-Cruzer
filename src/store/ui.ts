import { create } from "zustand"
import type { DestinyItemComponent } from "bungie-api-ts/destiny2"

interface UiState {
  selectedItem: DestinyItemComponent | null
  selectItem: (item: DestinyItemComponent | null) => void
}

export const useUiStore = create<UiState>((set) => ({
  selectedItem: null,
  selectItem: (item) => set({ selectedItem: item }),
}))
