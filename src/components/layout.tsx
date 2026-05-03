import { useEffect, useState } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { useManifestStore } from "@/store/manifest";
import { LanguageSwitcher } from "./language-switcher";
import { CharacterSelector } from "./character-selector";
import { SearchBar } from "./search-bar";
import { RefreshButton } from "./refresh-button";
import { ToastHost } from "./toast-host";
import { MaintenanceBanner } from "./maintenance-banner";
import { UpdateBanner } from "./update-banner";
import { AppStatusBanner } from "./app-status-banner";
import { SeasonBadge } from "./season-badge";
import { LivePlayersBadge } from "./live-player-badge";
import { TitleBar } from "./title-bar";
import { ConfirmDialog } from "./confirm-dialog";
import { WhatsNewModal } from "./whats-new-modal";
import { useProfileItemPrefetch } from "../hooks/useProfileItemPrefetch";
import { useTokenKeepAlive } from "../hooks/useTokenKeepAlive";
// Note: catalog prefetch is intentionally NOT run at Layout boot anymore —
// it used to download ~40 MB before the user even opened /database, which
// made cold-start feel sluggish on low-spec machines. The Database page
// now kicks off its own fetch on navigation.
import { useAppSettings } from "@/hooks/useAppSettings";
import cruzerLogo from "@/assets/cruzer-logo.png";
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
} from "./icon";
import d2Icon from "@/assets/d2-icon-white.png";
import marathonIcon from "@/assets/marathon-icon-white.png";

function NavItem({
  to,
  end,
  icon,
  children,
}: {
  to: string;
  end?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <NavLink to={to} end={end}>
      {({ isActive }) => (
        <span
          className={[
            "relative group px-3 h-8 inline-flex items-center gap-1.5 text-[12.5px] rounded-md transition-all whitespace-nowrap",
            isActive
              ? "text-white font-semibold bg-white/4"
              : "text-bungie-text/60 hover:text-white hover:bg-white/2",
          ].join(" ")}
        >
          {icon && (
            <span
              className={`inline-flex items-center justify-center w-3.5 h-3.5 transition-colors ${
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
            <span className="absolute left-2.5 right-2.5 -bottom-2.25 h-0.5 rounded-full bg-bungie-accent shadow-[0_0_10px_rgba(243,7,94,0.9)]" />
          )}
        </span>
      )}
    </NavLink>
  );
}

export function Layout() {
  const { t, i18n } = useTranslation();
  const clearAuth = useAuthStore((s) => s.clear);
  const qc = useQueryClient();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const doLogout = () => {
    clearAuth();
    // Clear React Query cache completely — no stale data from the old account
    // bleeds into the next login.
    qc.clear();
    setConfirmLogout(false);
  };
  const loadManifest = useManifestStore((s) => s.load);
  const location = useLocation();
  const isMarathon = location.pathname.startsWith("/marathon");

  // Prefetch every item def visible on the profile so Dashboard, Inventory,
  // Vendors, LootModal etc. all render instantly with cached icons/names.
  // (Internally short-circuits in the overlay window to avoid duplicate fetches.)
  useProfileItemPrefetch();

  // Keep the Bungie OAuth access token fresh in the background so idle
  // sessions never hit "error 99 — please sign in to continue".
  useTokenKeepAlive();

  // Apply persisted user settings app-wide: compact mode CSS class, global
  // keyboard shortcuts (Ctrl+I / Ctrl+L / F5 / F10), reset-time notifications.
  useAppSettings();

  useEffect(() => {
    loadManifest(i18n.resolvedLanguage);
  }, [i18n.resolvedLanguage, loadManifest]);

  return (
    <div className="h-full flex flex-col bg-bungie-bg">
      {/* -------------------------------------------------------------- */}
      {/* Top bar — 2 compact rows                                        */}
      {/* -------------------------------------------------------------- */}
      <TitleBar />
      <UpdateBanner />
      <AppStatusBanner />
      <MaintenanceBanner />
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-bungie-bg/85">
        {/* Thin accent gradient line at the very top for premium feel */}
        <div className="h-px bg-linear-to-r from-transparent via-bungie-accent/50 to-transparent" />

        {/* ========== ROW 1 — Brand + nav + status + actions ========== */}
        <div className="flex items-center gap-4 px-5 h-13 border-b border-bungie-border/30">
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 group pr-1"
            title="Cruzer Compagnon"
          >
            <img
              src={cruzerLogo}
              alt="Cruzer"
              className="w-7 h-7 drop-shadow-[0_0_12px_rgba(243,7,94,0.6)] transition-transform group-hover:scale-110"
            />
            <span className="hidden lg:inline text-[11px] font-bold tracking-[0.28em] text-white/90 uppercase">
              Cruzer
            </span>
          </Link>

          {/* D2 ↔ Marathon game switch — prominent, pill-shaped */}
          <div className="hidden md:flex items-center bg-bungie-panel/50 border border-bungie-border/50 rounded-full p-0.5 shrink-0">
            <NavLink
              to="/"
              end
              title="Destiny 2"
              className={`h-7 px-2 rounded-full flex items-center justify-center transition-all ${
                !isMarathon
                  ? "bg-bungie-accent/15 shadow-[inset_0_0_0_1px_rgba(243,7,94,0.35)]"
                  : "opacity-50 hover:opacity-100"
              }`}
            >
              <img src={d2Icon} alt="Destiny 2" className="w-3.5 h-3.5" />
            </NavLink>
            <NavLink
              to="/marathon"
              title="Marathon"
              className={`relative h-7 px-2 rounded-full flex items-center justify-center transition-all ${
                isMarathon
                  ? "bg-[#c7ff00]/15 shadow-[inset_0_0_0_1px_rgba(199,255,0,0.35)]"
                  : "opacity-50 hover:opacity-100"
              }`}
            >
              <img src={marathonIcon} alt="Marathon" className="w-3.5 h-3.5" />
              {!isMarathon && (
                <span
                  className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-[#c7ff00] animate-pulse"
                  title={t("nav.soon")}
                />
              )}
            </NavLink>
          </div>

          {/* Primary nav — inline, single row */}
          {!isMarathon ? (
            <nav className="flex items-center flex-1 min-w-0 overflow-x-auto no-scrollbar gap-0.5">
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
              <div className="w-px h-4 bg-bungie-border/60 mx-1.5" />
              <NavItem to="/bot" icon={<IconBot size={13} />}>
                {t("nav.bot", "Bot")}
              </NavItem>
              <NavItem to="/news" icon={<IconNewspaper size={13} />}>
                {t("nav.news")}
              </NavItem>
            </nav>
          ) : (
            <nav className="flex items-center flex-1 min-w-0 gap-2">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#c7ff00] font-bold px-3 py-1 rounded-full border border-[#c7ff00]/40 bg-[#c7ff00]/5">
                ◉ API · En attente
              </span>
              <NavItem to="/news" icon={<IconNewspaper size={13} />}>
                {t("nav.news")}
              </NavItem>
            </nav>
          )}

          {/* Right cluster — status pills + utilities */}
          <div className="flex items-center gap-2 shrink-0">
            {!isMarathon && (
              <div className="hidden xl:flex items-center gap-1.5">
                <LivePlayersBadge />
                <SeasonBadge />
              </div>
            )}

            {/* Utility cluster */}
            <div className="flex items-center gap-0.5 bg-bungie-panel/50 border border-bungie-border/50 rounded-full p-0.5">
              <RefreshButton />
              <LanguageSwitcher />
              <NavLink
                to="/settings"
                title={t("nav.settings")}
                className={({ isActive }) =>
                  `w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    isActive
                      ? "bg-bungie-accent/15 text-bungie-accent"
                      : "text-bungie-muted hover:text-white hover:bg-white/5"
                  }`
                }
              >
                <IconGear size={14} />
              </NavLink>
              <button
                onClick={() => setConfirmLogout(true)}
                title={t("auth.logout")}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-500/10 text-bungie-muted hover:text-red-400 transition-colors"
              >
                <IconLogout size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ========== ROW 2 — Characters + status (narrow) + search (D2) ========== */}
        {!isMarathon && (
          <div className="flex items-center gap-4 px-5 h-11 border-b border-bungie-border/40 bg-linear-to-r from-bungie-panel/10 via-bungie-panel/20 to-bungie-panel/10">
            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.3em] text-bungie-muted font-extrabold shrink-0">
              <span className="w-1 h-1 rounded-full bg-bungie-accent shadow-[0_0_6px_rgba(243,7,94,0.8)]" />
              {t("layout.guardians")}
            </div>
            <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
              <CharacterSelector horizontal />
            </div>
            {/* Compact status pills on smaller viewports (shown when hidden above) */}
            <div className="flex xl:hidden items-center gap-1.5 shrink-0">
              <LivePlayersBadge />
              <SeasonBadge />
            </div>
            <SearchBar />
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-400 mx-auto px-5 py-6">
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
  );
}