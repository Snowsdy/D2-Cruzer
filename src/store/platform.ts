import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SK_PLATFORM } from "@/constants/storageKeys";

interface PlatformStore {
  /** Currently selected Destiny membership ID (string, same format as Bungie). */
  selectedMembershipId: string | null;
  setSelected: (id: string | null) => void;
}

export const usePlatformStore = create<PlatformStore>()(
  persist(
    (set) => ({
      selectedMembershipId: null,
      setSelected: (id) => set({ selectedMembershipId: id }),
    }),
    {
      name: SK_PLATFORM,
      storage: createJSONStorage(() => localStorage),
    }
  )
);