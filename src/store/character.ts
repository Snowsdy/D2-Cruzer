import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { SK_CHARACTER } from "../constants/storageKeys"

interface CharacterState {
  activeCharacterId: string | null
  setActiveCharacter: (id: string | null) => void
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set) => ({
      activeCharacterId: null,
      setActiveCharacter: (id) => set({ activeCharacterId: id }),
    }),
    {
      name: SK_CHARACTER,
      storage: createJSONStorage(() => localStorage),
    }
  )
)
