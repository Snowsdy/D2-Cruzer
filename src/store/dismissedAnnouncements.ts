/**
 * Per-user dismissal tracking for maintainer announcements.
 *
 * Each announcement in `status.json` carries a stable `id`. Once the user
 * clicks "Got it" we record the id here; the banner then stays hidden
 * even after the app restarts. Persisted so a shell reload doesn't undo
 * the user's choice.
 */
import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface DismissedState {
  ids: string[]
  dismiss: (id: string) => void
  reset: () => void
  isDismissed: (id: string) => boolean
}

export const useDismissedAnnouncements = create<DismissedState>()(
  persist(
    (set, get) => ({
      ids: [],
      dismiss: (id) =>
        set((s) => (s.ids.includes(id) ? s : { ids: [...s.ids, id] })),
      reset: () => set({ ids: [] }),
      isDismissed: (id) => get().ids.includes(id),
    }),
    {
      name: "cruzer:dismissed_announcements",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
