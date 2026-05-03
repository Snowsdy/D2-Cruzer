import { useEffect, useState } from "react"
import { NavLink, Link, Outlet, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "@/store/auth"
import { useManifestStore } from "@/store/manifest"
import { LanguageSwitcher } from "./language-switcher"
import { CharacterSelector } from "./character-selector"
import { SearchBar } from "./search-bar"
import { RefreshButton } from "./refresh-button"
import { ToastHost } from "./toast-host"
import { MaintenanceBanner } from "./maintenance-banner"
import { UpdateBanner } from "./update-banner"
import { AppStatusBanner } from "./app-status-banner"
import { SeasonBadge } from "./season-badge"
import { LivePlayersBadge } from "./live-player-badge"
import { TitleBar } from "./title-bar"
import { ConfirmDialog } from "./confirm-dialog"
import { WhatsNewModal } from "./whats-new-modal"
import { useProfileItemPrefetch } from "../hooks/useProfileItemPrefetch"
import { useTokenKeepAlive } from "../hooks/useTokenKeepAlive"
// Note: catalog prefetch is intentionally NOT run at Layout boot anymore —
// it used to download ~40 MB before the user even opened /database, which
// made cold-start feel sluggish on low-spec machines. The Database page
// now kicks off its own fetch on navigation.
import { useAppSettings } from "@/hooks/useAppSettings"
import cruzerLogo from "@/assets/cruzer-logo.png"
import {
  IconHome,
  IconInventory,
  IconCheck,
  IconNewspaper,
  IconLogout,
  IconChart,
  IconUser,
  IconList,
  IconSword,
  IconBook,
  IconBot,
  IconGear,
} from "./icon"
import d2Icon from "@/assets/d2-icon-white.png"
import marathonIcon from "@/assets/marathon-icon-white.png"

function NavItem({
  to,
  end,
  icon,
  children,
}: {
  to: string
  end?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <NavLink to={to} end={end}>
      {({ isActive }) => (
        <span
          className={[
            "group relative inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12.5px] whitespace-nowrap transition-all",
            isActive
              ? "bg-white/4 font-semibold text-white"
              : "text-bungie-text/60 hover:bg-white/2 hover:text-white",
          ].join(" ")}
        >
          {icon && (
            <span
              className={`inline-flex h-3.5 w-3.5 items-center justify-center transition-colors ${
                isActive
                  ? "text-bungie-accent"
                  : "text-bungie-text/55 group-hover:text-white"
              }`}
            >
              {icon}
            </span>
          )}
          <span>{children}</span>
          {isActive && (
            <span className="bg-bungie-accent absolute right-2.5 -bottom-2.25 left-2.5 h-0.5 rounded-full shadow-[0_0_10px_rgba(243,7,94,0.9)]" />
          )}
        </span>
      )}
    </NavLink>
  )
}

export function Layout() {
  const { t, i18n } = useTranslation()
  const clearAuth = useAuthStore((s) => s.clear)
  const qc = useQueryClient()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const doLogout = () => {
    clearAuth()
    // Clear React Query cache completely — no stale data from the old account
    // bleeds into the next login.
    qc.clear()
    setConfirmLogout(false)
  }
  const loadManifest = useManifestStore((s) => s.load)
  const location = useLocation()
  const isMarathon = location.pathname.startsWith("/marathon")

  // Prefetch every item def visible on the profile so Dashboard, Inventory,
  // Vendors, LootModal etc. all render instantly with cached icons/names.
  // (Internally short-circuits in the overlay window to avoid duplicate fetches.)
  useProfileItemPrefetch()

  // Keep the Bungie OAuth access token fresh in the background so idle
  // sessions never hit "error 99 — please sign in to continue".
  useTokenKeepAlive()

  // Apply persisted user settings app-wide: compact mode CSS class, global
  // keyboard shortcuts (Ctrl+I / Ctrl+L / F5 / F10), reset-time notifications.
  useAppSettings()

  useEffect(() => {
    loadManifest(i18n.resolvedLanguage)
  }, [i18n.resolvedLanguage, loadManifest])

  return (
    <div className="bg-bungie-bg flex h-full flex-col">
      {/* -------------------------------------------------------------- */}
      {/* Top bar — 2 compact rows                                        */}
      {/* -------------------------------------------------------------- */}
      <TitleBar />
      <UpdateBanner />
      <AppStatusBanner />
      <MaintenanceBanner />
      <header className="bg-bungie-bg/85 sticky top-0 z-30 backdrop-blur-xl">
        {/* Thin accent gradient line at the very top for premium feel */}
        <div className="via-bungie-accent/50 h-px bg-linear-to-r from-transparent to-transparent" />

        {/* ========== ROW 1 — Brand + nav + status + actions ========== */}
        <div className="border-bungie-border/30 flex h-13 items-center gap-4 border-b px-5">
          {/* Brand */}
          <Link
            to="/"
            className="group flex shrink-0 items-center gap-2.5 pr-1"
            title="Cruzer Compagnon"
          >
            <img
              src={cruzerLogo}
              alt="Cruzer"
              className="h-7 w-7 drop-shadow-[0_0_12px_rgba(243,7,94,0.6)] transition-transform group-hover:scale-110"
            />
            <span className="hidden text-[11px] font-bold tracking-[0.28em] text-white/90 uppercase lg:inline">
              Cruzer
            </span>
          </Link>

          {/* D2 ↔ Marathon game switch — prominent, pill-shaped */}
          <div className="bg-bungie-panel/50 border-bungie-border/50 hidden shrink-0 items-center rounded-full border p-0.5 md:flex">
            <NavLink
              to="/"
              end
              title="Destiny 2"
              className={`flex h-7 items-center justify-center rounded-full px-2 transition-all ${
                !isMarathon
                  ? "bg-bungie-accent/15 shadow-[inset_0_0_0_1px_rgba(243,7,94,0.35)]"
                  : "opacity-50 hover:opacity-100"
              }`}
            >
              <img src={d2Icon} alt="Destiny 2" className="h-3.5 w-3.5" />
            </NavLink>
            <NavLink
              to="/marathon"
              title="Marathon"
              className={`relative flex h-7 items-center justify-center rounded-full px-2 transition-all ${
                isMarathon
                  ? "bg-[#c7ff00]/15 shadow-[inset_0_0_0_1px_rgba(199,255,0,0.35)]"
                  : "opacity-50 hover:opacity-100"
              }`}
            >
              <img src={marathonIcon} alt="Marathon" className="h-3.5 w-3.5" />
              {!isMarathon && (
                <span
                  className="absolute top-0.5 right-0.5 h-1 w-1 animate-pulse rounded-full bg-[#c7ff00]"
                  title={t("nav.soon")}
                />
              )}
            </NavLink>
          </div>

          {/* Primary nav — inline, single row */}
          {!isMarathon ? (
            <nav className="no-scrollbar flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
              <NavItem to="/" end icon={<IconHome size={13} />}>
                {t("nav.dashboard")}
              </NavItem>
              <NavItem to="/inventory" icon={<IconInventory size={13} />}>
                {t("nav.inventory")}
              </NavItem>
              <NavItem to="/checklist" icon={<IconCheck size={13} />}>
                {t("nav.checklist")}
              </NavItem>
              <NavItem to="/activities" icon={<IconSword size={13} />}>
                {t("nav.activities")}
              </NavItem>
              <NavItem to="/reports" icon={<IconList size={13} />}>
                {t("nav.reports")}
              </NavItem>
              <NavItem to="/tools/stats" icon={<IconChart size={13} />}>
                {t("nav.stats")}
              </NavItem>
              <NavItem to="/tools/vendors" icon={<IconUser size={13} />}>
                {t("nav.vendors")}
              </NavItem>
              <NavItem to="/database" icon={<IconBook size={13} />}>
                {t("nav.database", "Database")}
              </NavItem>
              <div className="flex-1" />
              <div className="bg-bungie-border/60 mx-1.5 h-4 w-px" />
              <NavItem to="/bot" icon={<IconBot size={13} />}>
                {t("nav.bot", "Bot")}
              </NavItem>
              <NavItem to="/news" icon={<IconNewspaper size={13} />}>
                {t("nav.news")}
              </NavItem>
            </nav>
          ) : (
            <nav className="flex min-w-0 flex-1 items-center gap-2">
              <span className="rounded-full border border-[#c7ff00]/40 bg-[#c7ff00]/5 px-3 py-1 text-[10px] font-bold tracking-[0.25em] text-[#c7ff00] uppercase">
                ◉ API · En attente
              </span>
              <NavItem to="/news" icon={<IconNewspaper size={13} />}>
                {t("nav.news")}
              </NavItem>
            </nav>
          )}

          {/* Right cluster — status pills + utilities */}
          <div className="flex shrink-0 items-center gap-2">
            {!isMarathon && (
              <div className="hidden items-center gap-1.5 xl:flex">
                <LivePlayersBadge />
                <SeasonBadge />
              </div>
            )}

            {/* Utility cluster */}
            <div className="bg-bungie-panel/50 border-bungie-border/50 flex items-center gap-0.5 rounded-full border p-0.5">
              <RefreshButton />
              <LanguageSwitcher />
              <NavLink
                to="/settings"
                title={t("nav.settings")}
                className={({ isActive }) =>
                  `flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                    isActive
                      ? "bg-bungie-accent/15 text-bungie-accent"
                      : "text-bungie-muted hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <IconGear size={14} />
              </NavLink>
              <button
                onClick={() => setConfirmLogout(true)}
                title={t("auth.logout")}
                className="text-bungie-muted flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <IconLogout size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ========== ROW 2 — Characters + status (narrow) + search (D2) ========== */}
        {!isMarathon && (
          <div className="border-bungie-border/40 from-bungie-panel/10 via-bungie-panel/20 to-bungie-panel/10 flex h-11 items-center gap-4 border-b bg-linear-to-r px-5">
            <div className="text-bungie-muted flex shrink-0 items-center gap-1.5 text-[9px] font-extrabold tracking-[0.3em] uppercase">
              <span className="bg-bungie-accent h-1 w-1 rounded-full shadow-[0_0_6px_rgba(243,7,94,0.8)]" />
              {t("layout.guardians")}
            </div>
            <div className="no-scrollbar min-w-0 flex-1 overflow-x-auto">
              <CharacterSelector horizontal />
            </div>
            {/* Compact status pills on smaller viewports (shown when hidden above) */}
            <div className="flex shrink-0 items-center gap-1.5 xl:hidden">
              <LivePlayersBadge />
              <SeasonBadge />
            </div>
            <SearchBar />
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-400 px-5 py-6">
          <Outlet />
        </div>
      </main>

      <ToastHost />
      <WhatsNewModal />
      <ConfirmDialog
        open={confirmLogout}
        title={t("confirm.logout.title")}
        message={t("confirm.logout.message")}
        confirmLabel={t("auth.logout")}
        cancelLabel={t("common.cancel")}
        variant="danger"
        onConfirm={doLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </div>
  )
}
