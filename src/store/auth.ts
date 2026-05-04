import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { SK_PLATFORM, SK_AUTH_CHARACTER } from "@/constants/storageKeys"

export interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  expiresAt: number | null
  membershipId: string | null
  setTokens: (t: {
    accessToken: string
    refreshToken: string | null
    expiresIn: number
    membershipId: string
  }) => void
  clear: () => void
  isExpired: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      membershipId: null,
      setTokens: ({ accessToken, refreshToken, expiresIn, membershipId }) =>
        set({
          accessToken,
          refreshToken,
          expiresAt: Date.now() + expiresIn * 1000,
          membershipId,
        }),
      clear: () => {
        // Wipe auth.
        set({
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          membershipId: null,
        })
        // Wipe platform + character selection so the next login re-detects
        // from scratch (no leftover state from the previous user).
        try {
          localStorage.removeItem(SK_PLATFORM)
          localStorage.removeItem(SK_AUTH_CHARACTER)
        } catch {
          // ignore
        }
      },
      isExpired: () => {
        const exp = get().expiresAt
        // Consider the token "expired" 5 minutes before Bungie actually
        // invalidates it — gives us plenty of runway to refresh in the
        // background before any API call hits a 401/99.
        return !exp || Date.now() >= exp - 5 * 60_000
      },
    }),
    {
      name: "cruzer-auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
