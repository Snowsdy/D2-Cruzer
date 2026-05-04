import { useEffect, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"

// Injected at build time by Vite (see vite.config.ts).
declare const __APP_VERSION__: string
import { getCurrentWindow } from "@tauri-apps/api/window"
import { useAuthStore } from "@/store/auth"
import { useManifestStore } from "@/store/manifest"
import { useSettingsStore, type ThemeMode } from "@/store/settings"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Dropdown } from "@/components/dropdown"
import { toast } from "sonner"

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function Section({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <section className="relative">
      <header className="border-bungie-border/40 mb-1 flex items-center gap-2.5 border-b px-1 pb-3">
        <span className="text-bungie-accent h-4 w-4 shrink-0">{icon}</span>
        <h2 className="text-[15px] font-extrabold tracking-tight text-white/95">
          {title}
        </h2>
      </header>
      <div className="divide-bungie-border/30 divide-y">{children}</div>
    </section>
  )
}

function Row({
  icon,
  label,
  hint,
  control,
  shortcut,
}: {
  icon?: ReactNode
  label: string
  hint?: string
  control: ReactNode
  shortcut?: string
}) {
  return (
    <div className="group flex items-center gap-4 px-1 py-3.5">
      {icon && (
        <span className="text-bungie-accent/80 group-hover:text-bungie-accent h-4 w-4 shrink-0 transition-colors">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-[13px] leading-tight font-semibold text-white/90">
          {label}
        </div>
        {hint && (
          <div className="text-bungie-muted mt-0.5 text-[11px] leading-snug">
            {hint}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        {control}
        {shortcut && (
          <span className="border-bungie-border rounded-md border bg-white/5 px-2 py-1 font-mono text-[10px] tracking-wide text-white/70 uppercase">
            {shortcut}
          </span>
        )}
      </div>
    </div>
  )
}

function Toggle({
  value,
  onChange,
  ariaLabel,
}: {
  value: boolean
  onChange: (v: boolean) => void
  ariaLabel?: string
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      aria-label={ariaLabel}
      aria-pressed={value}
      className={`relative h-6 w-11 rounded-full transition-all ${
        value
          ? "bg-bungie-accent/90"
          : "border-bungie-border border bg-white/10"
      }`}
      style={value ? { boxShadow: "0 0 12px rgba(243,7,94,0.5)" } : undefined}
    >
      <span
        className={`absolute top-0.75 h-4.5 w-4.5 rounded-full bg-white transition-all ${
          value ? "left-5.25" : "left-0.75"
        }`}
        style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }}
      />
    </button>
  )
}

function ActionButton({
  onClick,
  children,
  variant = "primary",
}: {
  onClick: () => void
  children: ReactNode
  variant?: "primary" | "danger" | "ghost"
}) {
  const cls =
    variant === "danger"
      ? "bg-red-500/90 hover:bg-red-500 text-white"
      : variant === "ghost"
        ? "bg-white/5 hover:bg-white/10 border border-bungie-border text-white/85"
        : "bg-bungie-accent hover:brightness-110 text-black font-extrabold"
  return (
    <button
      onClick={onClick}
      className={`h-8 rounded-md px-3.5 text-[11px] font-bold tracking-wider uppercase transition-all ${cls}`}
    >
      {children}
    </button>
  )
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <Dropdown
      value={value}
      onChange={onChange}
      options={options}
      variant="md"
      size="md"
    />
  )
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const IcUser = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
  </svg>
)
const IcDisplay = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 18v3" />
  </svg>
)
const IcBell = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
)
const IcKey = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="8" cy="12" r="4" />
    <path d="M12 12h9l-2 2m2-2l-2-2" />
  </svg>
)
const IcData = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <ellipse cx="12" cy="5" rx="8" ry="3" />
    <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
    <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
  </svg>
)
const IcDot = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="4" />
  </svg>
)
const IcShield = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z" />
  </svg>
)
const IcTool = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
)

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function Settings() {
  const { t, i18n } = useTranslation()
  const clearAuth = useAuthStore((s) => s.clear)
  const manifest = useManifestStore((s) => s.manifest)
  const reloadManifest = useManifestStore((s) => s.load)

  // Persisted settings (localStorage via zustand/persist) — any toggle here
  // is immediately applied by useAppSettings() in Layout.
  const s = useSettingsStore()

  const [alwaysOnTop, setAlwaysOnTop] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  // Sync always-on-top state with Tauri window.
  useEffect(() => {
    ;(async () => {
      try {
        const w = getCurrentWindow()
        const current =
          (await (
            w as unknown as { isAlwaysOnTop?: () => Promise<boolean> }
          ).isAlwaysOnTop?.()) ?? false
        setAlwaysOnTop(!!current)
      } catch {
        // ignore on web
      }
    })()
  }, [])

  const toggleAlwaysOnTop = async (v: boolean) => {
    setAlwaysOnTop(v)
    try {
      await getCurrentWindow().setAlwaysOnTop(v)
    } catch (e) {
      toast.error(
        t("toasts.alwaysOnTopFailed", { error: (e as Error).message })
      )
      setAlwaysOnTop(!v)
    }
  }

  const doRefresh = () => {
    void reloadManifest(i18n.resolvedLanguage)
    toast.success(t("toasts.manifestReloaded"))
  }
  const confirmDoLogout = () => {
    clearAuth()
    toast.info(t("toasts.disconnected"))
    setConfirmLogout(false)
  }
  const doClearCache = () => {
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("cruzer:") || k.includes("manifest"))
          localStorage.removeItem(k)
      })
      toast.success(t("toasts.localCacheCleared"))
    } catch (e) {
      toast.error(t("toasts.errorGeneric", { error: (e as Error).message }))
    }
  }

  const lang = i18n.resolvedLanguage ?? "fr"

  return (
    <div className="mx-auto max-w-225 space-y-6">
      {/* Hero */}
      <div className="fade-in-up flex items-start justify-between gap-4">
        <div>
          <h1 className="glitch text-3xl font-bold">
            <span data-text={t("nav.settings")}>{t("nav.settings")}</span>
          </h1>
          <p className="text-bungie-muted mt-1 text-sm">
            {t("settings.subtitle")}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold tracking-[0.25em] text-white/50 uppercase"
          style={{
            background: "rgba(7,7,13,0.5)",
            border: "1px solid rgba(243,7,94,0.25)",
          }}
        >
          <span className="pulse-live h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {t("settings.version", { version: __APP_VERSION__ })}
        </div>
      </div>

      {/* ---------- Compte ---------- */}
      <div
        className="fade-in-up"
        style={{
          background:
            "linear-gradient(180deg, rgba(16,16,26,0.7), rgba(7,7,13,0.5))",
          border: "1px solid rgba(243,7,94,0.12)",
          borderRadius: 14,
          padding: "20px 22px",
        }}
      >
        <Section icon={IcUser} title={t("settings.section.account")}>
          <Row
            icon={IcUser}
            label={t("settings.session.label")}
            hint={
              manifest
                ? t("settings.session.hintAuthManifest")
                : t("settings.session.hintAuth")
            }
            control={
              <ActionButton
                onClick={() => setConfirmLogout(true)}
                variant="danger"
              >
                {t("auth.logout")}
              </ActionButton>
            }
          />
          <Row
            icon={IcData}
            label={t("settings.manifest.label")}
            hint={t("settings.manifest.hint")}
            control={
              <ActionButton onClick={doRefresh}>
                {t("settings.manifest.action")}
              </ActionButton>
            }
            shortcut="Ctrl R"
          />
          <Row
            icon={IcData}
            label={t("settings.cache.label")}
            hint={t("settings.cache.hint")}
            control={
              <ActionButton onClick={doClearCache} variant="ghost">
                {t("settings.cache.action")}
              </ActionButton>
            }
          />
        </Section>
      </div>

      {/* ---------- Affichage ---------- */}
      <div
        className="fade-in-up"
        style={{
          background:
            "linear-gradient(180deg, rgba(16,16,26,0.7), rgba(7,7,13,0.5))",
          border: "1px solid rgba(243,7,94,0.12)",
          borderRadius: 14,
          padding: "20px 22px",
          animationDelay: "0.1s",
        }}
      >
        <Section icon={IcDisplay} title={t("settings.section.display")}>
          <Row
            icon={IcDisplay}
            label={t("settings.language.label")}
            hint={t("settings.language.hint")}
            control={<LanguageSwitcher />}
          />
          <Row
            icon={IcShield}
            label={t("settings.alwaysOnTop.label")}
            hint={t("settings.alwaysOnTop.hint")}
            control={
              <Toggle
                value={alwaysOnTop}
                onChange={toggleAlwaysOnTop}
                ariaLabel={t("settings.alwaysOnTop.aria")}
              />
            }
            shortcut="F10"
          />
          <Row
            icon={IcDot}
            label={t("settings.compactMode.label")}
            hint={t("settings.compactMode.hint")}
            control={
              <Toggle
                value={s.compactMode}
                onChange={(v) => s.set("compactMode", v)}
              />
            }
          />
          <Row
            icon={IcDisplay}
            label={t("settings.theme.label")}
            hint={t("settings.theme.hint")}
            control={
              <Select
                value={s.theme}
                options={[
                  { value: "dark", label: t("settings.theme.dark") },
                  { value: "midnight", label: t("settings.theme.midnight") },
                  { value: "nebula", label: t("settings.theme.nebula") },
                ]}
                onChange={(v) => s.set("theme", v as ThemeMode)}
              />
            }
          />
          <Row
            icon={IcShield}
            label={t("settings.overlay.label")}
            hint={t("settings.overlay.hint")}
            control={
              <Toggle
                value={s.overlayEnabled}
                onChange={(v) => s.set("overlayEnabled", v)}
              />
            }
          />
        </Section>
      </div>

      {/* ---------- Notifications ---------- */}
      <div
        className="fade-in-up"
        style={{
          background:
            "linear-gradient(180deg, rgba(16,16,26,0.7), rgba(7,7,13,0.5))",
          border: "1px solid rgba(243,7,94,0.12)",
          borderRadius: 14,
          padding: "20px 22px",
          animationDelay: "0.2s",
        }}
      >
        <Section icon={IcBell} title={t("settings.section.notifications")}>
          <Row
            icon={IcBell}
            label={t("settings.notifWeekly.label")}
            hint={t("settings.notifWeekly.hint")}
            control={
              <Toggle
                value={s.notifWeeklyReset}
                onChange={(v) => s.set("notifWeeklyReset", v)}
              />
            }
          />
          <Row
            icon={IcBell}
            label={t("settings.notifDaily.label")}
            hint={t("settings.notifDaily.hint")}
            control={
              <Toggle
                value={s.notifDailyReset}
                onChange={(v) => s.set("notifDailyReset", v)}
              />
            }
          />
          <Row
            icon={IcBell}
            label={t("settings.notifXur.label")}
            hint={t("settings.notifXur.hint")}
            control={
              <Toggle
                value={s.notifXur}
                onChange={(v) => s.set("notifXur", v)}
              />
            }
          />
          <Row
            icon={IcBell}
            label={t("settings.soundAlerts.label")}
            hint={t("settings.soundAlerts.hint")}
            control={
              <Toggle
                value={s.soundAlerts}
                onChange={(v) => {
                  s.set("soundAlerts", v)
                  if (v) {
                    // Immediate feedback — play a beep so the user knows
                    // sound alerts are working without waiting for reset.
                    try {
                      const ctx = new (
                        window.AudioContext ||
                        (
                          window as unknown as {
                            webkitAudioContext: typeof AudioContext
                          }
                        ).webkitAudioContext
                      )()
                      const osc = ctx.createOscillator()
                      const gain = ctx.createGain()
                      osc.connect(gain)
                      gain.connect(ctx.destination)
                      osc.frequency.setValueAtTime(880, ctx.currentTime)
                      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
                      gain.gain.exponentialRampToValueAtTime(
                        0.2,
                        ctx.currentTime + 0.01
                      )
                      gain.gain.exponentialRampToValueAtTime(
                        0.0001,
                        ctx.currentTime + 0.3
                      )
                      osc.start()
                      osc.stop(ctx.currentTime + 0.32)
                    } catch {
                      /* ignore */
                    }
                  }
                }}
              />
            }
          />
        </Section>
      </div>

      {/* ---------- Raccourcis ---------- */}
      <div
        className="fade-in-up"
        style={{
          background:
            "linear-gradient(180deg, rgba(16,16,26,0.7), rgba(7,7,13,0.5))",
          border: "1px solid rgba(243,7,94,0.12)",
          borderRadius: 14,
          padding: "20px 22px",
          animationDelay: "0.3s",
        }}
      >
        <Section icon={IcKey} title={t("settings.section.shortcuts")}>
          <Row
            label={t("settings.shortcuts.inventory")}
            control={<span className="text-[11px] text-white/50">—</span>}
            shortcut="Ctrl I"
          />
          <Row
            label={t("settings.shortcuts.checklist")}
            control={<span className="text-[11px] text-white/50">—</span>}
            shortcut="Ctrl L"
          />
          <Row
            label={t("settings.shortcuts.refresh")}
            control={<span className="text-[11px] text-white/50">—</span>}
            shortcut="F5"
          />
          <Row
            label={t("settings.shortcuts.focusD2")}
            control={<span className="text-[11px] text-white/50">—</span>}
            shortcut="Ctrl G"
          />
          <Row
            label={t("settings.shortcuts.alwaysOnTop")}
            control={<span className="text-[11px] text-white/50">—</span>}
            shortcut="F10"
          />
          <Row
            label={t("settings.shortcuts.overlay", "Overlay en jeu")}
            control={<span className="text-[11px] text-white/50">—</span>}
            shortcut="F9"
          />
        </Section>
      </div>

      {/* ---------- Avancé ---------- */}
      <div
        className="fade-in-up"
        style={{
          background:
            "linear-gradient(180deg, rgba(16,16,26,0.7), rgba(7,7,13,0.5))",
          border: "1px solid rgba(243,7,94,0.12)",
          borderRadius: 14,
          padding: "20px 22px",
          animationDelay: "0.4s",
        }}
      >
        <Section icon={IcTool} title={t("settings.section.advanced")}>
          <Row
            icon={IcTool}
            label={t("settings.devLogs.label")}
            hint={t("settings.devLogs.hint")}
            control={
              <Toggle value={s.devLogs} onChange={(v) => s.set("devLogs", v)} />
            }
          />
          <Row
            icon={IcTool}
            label={t("settings.bungieDiag.label")}
            hint={t("settings.bungieDiag.hint")}
            control={
              <Toggle
                value={s.bungieDiagnostic}
                onChange={(v) => s.set("bungieDiagnostic", v)}
              />
            }
          />
          <Row
            icon={IcTool}
            label={t("settings.reset.label")}
            hint={t("settings.reset.hint")}
            control={
              <ActionButton
                onClick={() => {
                  s.reset()
                  toast.success(t("toasts.preferencesReset"))
                }}
                variant="ghost"
              >
                {t("settings.reset.action")}
              </ActionButton>
            }
          />
        </Section>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 text-[10px] font-bold tracking-[0.25em] text-white/30 uppercase">
        <span>
          {t("settings.footer.build", { year: new Date().getFullYear() })}
        </span>
        <span>
          {t("settings.footer.activeLang", { lang: lang.toUpperCase() })}
        </span>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title={t("confirm.logout.title")}
        message={t("confirm.logout.message")}
        confirmLabel={t("auth.logout")}
        cancelLabel={t("common.cancel")}
        variant="danger"
        onConfirm={confirmDoLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  )
}
