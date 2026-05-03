import { create } from "zustand";
import type { DestinyItemComponent } from "bungie-api-ts/destiny2";

interface CompareState {
  items: DestinyItemComponent[];
  isOpen: boolean;
  add: (item: DestinyItemComponent) => void;
  remove: (id: string) => void;
  clear: () => void;
  setOpen: (open: boolean) => void;
}

export const useCompareStore = create<CompareState>((set) => ({
  items: [],
  isOpen: false,
  add: (item) =>
    set((s) => {
      if (!item.itemInstanceId) return s;
      if (s.items.find((x) => x.itemInstanceId === item.itemInstanceId)) return s;
      if (s.items.length >= 6) return s; // cap at 6
      return { items: [...s.items, item] };
    }),
  remove: (id) =>
    set((s) => ({ items: s.items.filter((x) => x.itemInstanceId !== id) })),
  clear: () => set({ items: [], isOpen: false }),
  setOpen: (isOpen) => set({ isOpen }),
}));