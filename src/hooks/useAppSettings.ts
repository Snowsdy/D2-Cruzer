/**
 * Applies user settings app-wide:
 *  - compact mode → sets a data-attribute on <html> for CSS to hook into
 *  - keyboard shortcuts → global hotkeys (Ctrl+I inventory, Ctrl+L checklist…)
 *  - reset notifications → scheduled Notification API fires
 *  - dev logs → toggles a global flag checked by api wrappers
 */

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { invoke } from "@tauri-apps/api/core"
import { getCurrentWindow } from "@tauri-apps/api/window"
import { useSettingsStore } from "../store/settings"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import i18n from "@/i18n"

// ---------------------------------------------------------------------------
// Daily / weekly reset timing (Bungie schedule is UTC-anchored).
// ---------------------------------------------------------------------------
const RESET_HOUR_UTC = 17

function nextDailyResetMs(now: number): number {
  const d = new Date(now)
  d.setUTCHours(RESET_HOUR_UTC, 0, 0, 0)
  if (d.getTime() <= now) d.setUTCDate(d.getUTCDate() + 1)
  return d.getTime()
}

function nextWeeklyResetMs(now: number): number {
  // Tuesday = day 2 in JS UTC. Bungie weekly reset is Tuesday 17:00 UTC.
  const d = new Date(now)
  d.setUTCHours(RESET_HOUR_UTC, 0, 0, 0)
  const day = d.getUTCDay() // 0=Sun, 2=Tue
  let delta = (2 - day + 7) % 7
  if (delta === 0 && d.getTime() <= now) delta = 7
  d.setUTCDate(d.getUTCDate() + delta)
  return d.getTime()
}

function nextXurArrivalMs(now: number): number {
  // Xûr arrives Friday 18:00 UTC, leaves Tuesday reset.
  const d = new Date(now)
  d.setUTCHours(18, 0, 0, 0)
  const day = d.getUTCDay() // 5 = Friday
  let delta = (5 - day + 7) % 7
  if (delta === 0 && d.getTime() <= now) delta = 7
  d.setUTCDate(d.getUTCDate() + delta)
  return d.getTime()
}

// ---------------------------------------------------------------------------
// Sound helper — lazy audio context + short beep
// ---------------------------------------------------------------------------
let sharedCtx: AudioContext | null = null
function playBeep() {
  try {
    if (!sharedCtx) {
      sharedCtx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )()
    }
    const ctx = sharedCtx
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.32)
  } catch {
    /* ignore */
  }
}

// Native browser notification (works in Tauri's webview too).
function nativeNotify(title: string, body: string, sound: boolean) {
  if (sound) playBeep()
  try {
    if (typeof Notification !== "undefined") {
      if (Notification.permission === "granted") {
        new Notification(title, { body })
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") new Notification(title, { body })
        })
      }
    }
  } catch {
    /* ignore */
  }
  toast.info(`${title} — ${body}`)
}

// ---------------------------------------------------------------------------
// Global dev-logs flag — read by api/bungie.ts etc.
// ---------------------------------------------------------------------------
declare global {
  interface Window {
    __CRUZER_DEV_LOGS__?: boolean
    __CRUZER_BUNGIE_DIAG__?: boolean
  }
}

export function useAppSettings() {
  const settings = useSettingsStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  // -------------------------------------------------------------------------
  // 1 · Compact mode → toggles an html data attribute that CSS hooks into.
  // -------------------------------------------------------------------------
  useEffect(() => {
    document.documentElement.dataset.compact = settings.compactMode
      ? "true"
      : "false"
  }, [settings.compactMode])

  // Theme variant → data-theme attribute on <html>, picked up by CSS overrides.
  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
  }, [settings.theme])

  // -------------------------------------------------------------------------
  // 2 · Dev flags exposed globally so non-React modules can check them.
  // -------------------------------------------------------------------------
  useEffect(() => {
    window.__CRUZER_DEV_LOGS__ = settings.devLogs
  }, [settings.devLogs])
  useEffect(() => {
    window.__CRUZER_BUNGIE_DIAG__ = settings.bungieDiagnostic
  }, [settings.bungieDiagnostic])

  // -------------------------------------------------------------------------
  // 3 · Keyboard shortcuts (Ctrl+I, Ctrl+L, F5, Ctrl+G, F10)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      const typing =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement | null)?.isContentEditable
      if (typing) return

      // Ctrl/Cmd + I → inventory
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
        e.preventDefault()
        navigate("/inventory")
        return
      }
      // Ctrl/Cmd + L → checklist
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "l") {
        e.preventDefault()
        navigate("/checklist")
        return
      }
      // F5 → force-refresh all queries
      if (e.key === "F5") {
        e.preventDefault()
        qc.invalidateQueries()
        toast.success(i18n.t("toasts.dataRefreshed"))
        return
      }
      // Ctrl/Cmd + G → focus Destiny 2 window
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "g") {
        e.preventDefault()
        try {
          await invoke("d2_focus")
        } catch {
          toast.info(i18n.t("toasts.d2NotRunning"))
        }
        return
      }
      // F10 → toggle always-on-top
      if (e.key === "F10") {
        e.preventDefault()
        try {
          const w = getCurrentWindow()
          const cur =
            (await (
              w as unknown as { isAlwaysOnTop?: () => Promise<boolean> }
            ).isAlwaysOnTop?.()) ?? false
          await w.setAlwaysOnTop(!cur)
          toast.success(
            !cur
              ? i18n.t("toasts.alwaysOnTopEnabled")
              : i18n.t("toasts.alwaysOnTopDisabled")
          )
        } catch {
          /* ignore */
        }
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [navigate, qc])

  // -------------------------------------------------------------------------
  // 4 · Reset / Xûr notification timers
  //
  // Each toggle schedules a single recursive setTimeout that re-arms itself
  // after firing. Two guardrails:
  //   1. If the next anchor is already past (or within 30 s), skip one cycle
  //      so we never fire on a negative delay (previous bug: spammed the
  //      toast on every re-render when 16:45 < now < 17:00).
  //   2. All recursively-spawned timer ids are tracked in a shared Set so
  //      effect cleanup cancels them all, not just the initial ones.
  // -------------------------------------------------------------------------
  useEffect(() => {
    const timers = new Set<number>()
    let stopped = false

    const schedule = (
      anchorMs: number,
      leadMs: number,
      label: string,
      body: string,
      nextFn: (now: number) => number
    ) => {
      if (stopped) return
      let target = anchorMs - leadMs
      const now = Date.now()
      // Skip-forward guard — if the anchor lead-time is already past,
      // re-compute for the NEXT occurrence instead of firing at 0-delay.
      while (target - now < 30_000) {
        const nextAnchor = nextFn(anchorMs + 1_000)
        if (nextAnchor === anchorMs) break // nextFn not making progress
        anchorMs = nextAnchor
        target = anchorMs - leadMs
      }
      const delay = Math.max(30_000, target - now)
      const id = window.setTimeout(() => {
        timers.delete(id)
        if (stopped) return
        nativeNotify(label, body, settings.soundAlerts)
        // Re-arm for the following cycle
        schedule(nextFn(Date.now()), leadMs, label, body, nextFn)
      }, delay)
      timers.add(id)
    }

    if (settings.notifDailyReset) {
      schedule(
        nextDailyResetMs(Date.now()),
        15 * 60_000,
        i18n.t("resetNotif.daily.title"),
        i18n.t("resetNotif.daily.body"),
        nextDailyResetMs
      )
    }

    if (settings.notifWeeklyReset) {
      schedule(
        nextWeeklyResetMs(Date.now()),
        60 * 60_000,
        i18n.t("resetNotif.weekly.title"),
        i18n.t("resetNotif.weekly.body"),
        nextWeeklyResetMs
      )
    }

    if (settings.notifXur) {
      schedule(
        nextXurArrivalMs(Date.now()),
        0,
        i18n.t("resetNotif.xur.title"),
        i18n.t("resetNotif.xur.body"),
        nextXurArrivalMs
      )
    }

    return () => {
      stopped = true
      timers.forEach((id) => window.clearTimeout(id))
      timers.clear()
    }
  }, [
    settings.notifDailyReset,
    settings.notifWeeklyReset,
    settings.notifXur,
    settings.soundAlerts,
  ])
}
