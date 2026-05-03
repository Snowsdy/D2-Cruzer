/**
 * Persisted user preferences — all the toggles on the Settings page actually
 * write here, and features across the app read from here to apply behaviour.
 */

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { SK_SETTINGS } from "@/constants/storageKeys"

export type ThemeMode = "dark" | "light"

export interface AppSettings {
  // Display
  compactMode: boolean
  theme: ThemeMode

  // Notifications (reset timers, Xûr, alert tones)
  notifWeeklyReset: boolean
  notifDailyReset: boolean
  notifXur: boolean
  soundAlerts: boolean

  // Overlay — in-game HUD over Destiny 2 / Marathon
  overlayEnabled: boolean

  // Advanced / debug
  devLogs: boolean
  bungieDiagnostic: boolean
}

interface SettingsStore extends AppSettings {
  set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  toggle: (
    key: Extract<
      keyof AppSettings,
      | "compactMode"
      | "notifWeeklyReset"
      | "notifDailyReset"
      | "notifXur"
      | "soundAlerts"
      | "devLogs"
      | "bungieDiagnostic"
    >
  ) => void
  reset: () => void
}

const DEFAULTS: AppSettings = {
  compactMode: false,
  theme: "dark",
  notifWeeklyReset: true,
  notifDailyReset: true,
  notifXur: true,
  soundAlerts: false,
  overlayEnabled: false,
  devLogs: false,
  bungieDiagnostic: false,
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      set: (key, value) => set({ [key]: value } as Partial<SettingsStore>),
      toggle: (key) => set({ [key]: !get()[key] } as Partial<SettingsStore>),
      reset: () => set({ ...DEFAULTS }),
    }),
    {
      name: SK_SETTINGS,
      storage: createJSONStorage(() => localStorage),
    }
  )
)
