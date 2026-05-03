import { lazy, Suspense, type JSX } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout";
import { DeepLinkHandler } from "@/components/deep-link-handler";
import { Login } from "@/pages/auth/Login";
import { AuthCallback } from "@/pages/auth/AuthCallback";
import { Dashboard } from "@/pages/dashboard/Dashboard";
import { Inventory } from "@/pages/inventory/Inventory";
import { Checklist } from "@/pages/checklist/Checklist";
import { News } from "@/pages/news/News";
import { Settings } from "@/pages/settings/Settings";
import { Marathon } from "@/pages/marathon/Marathon";
import { BotDashboard } from "@/pages/bot/BotDashboard";
import { useAuthStore } from "@/store/auth";

// Code-split the heaviest views — loaded on demand when the user navigates
// to them. Database carries a 40 MB manifest catalog; Reports and Stats
// bundle several sub-views. Lazy-loading cuts the initial JS payload.
const Reports = lazy(() =>
  import("@/pages/reports/Reports").then((m) => ({ default: m.Reports }))
);
const Activities = lazy(() =>
  import("@/pages/activities/Activities").then((m) => ({ default: m.Activities }))
);
const Database = lazy(() =>
  import("@/pages/database/Database").then((m) => ({ default: m.Database }))
);
const VendorsView = lazy(() =>
  import("@/pages/tools/VendorsView").then((m) => ({ default: m.VendorsView }))
);
const StatsView = lazy(() =>
  import("@/pages/tools/StatsView").then((m) => ({ default: m.StatsView }))
);
const XurView = lazy(() =>
  import("@/pages/tools/XurView").then((m) => ({ default: m.XurView }))
);
const PlaytimeView = lazy(() =>
  import("@/pages/tools/PlaytimeView").then((m) => ({ default: m.PlaytimeView }))
);
const TrialsView = lazy(() =>
  import("@/pages/tools/TrialsView").then((m) => ({ default: m.TrialsView }))
);
const NightfallView = lazy(() =>
  import("@/pages/tools/NightfallView").then((m) => ({ default: m.NightfallView }))
);
const IronBannerView = lazy(() =>
  import("@/pages/tools/IronBannerView").then((m) => ({ default: m.IronBannerView }))
);

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-20 text-bungie-muted text-sm">
      Chargement…
    </div>
  );
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const token = useAuthStore((s) => s.accessToken);
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <>
      <DeepLinkHandler />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="inventory/:tab" element={<Inventory />} />
          {/* Redirect legacy /loadouts (now a tab inside Inventory) */}
          <Route path="loadouts" element={<Navigate to="/inventory/loadouts" replace />} />
          {/* Legacy: rolls + armor moved inside Inventory */}
          <Route path="rolls" element={<Navigate to="/inventory/rolls" replace />} />
          <Route path="armor" element={<Navigate to="/inventory/armor" replace />} />
          <Route path="checklist" element={<Checklist />} />
          <Route path="reports" element={<Lazy><Reports /></Lazy>} />
          <Route path="news" element={<News />} />
          <Route path="tools/xur" element={<Lazy><XurView /></Lazy>} />
          <Route path="tools/playtime" element={<Lazy><PlaytimeView /></Lazy>} />
          <Route path="tools/trials" element={<Lazy><TrialsView /></Lazy>} />
          <Route path="tools/nightfall" element={<Lazy><NightfallView /></Lazy>} />
          <Route path="tools/vendors" element={<Lazy><VendorsView /></Lazy>} />
          <Route path="tools/iron-banner" element={<Lazy><IronBannerView /></Lazy>} />
          <Route path="tools/stats" element={<Lazy><StatsView /></Lazy>} />
          {/* /tools/meta was an iframe of popularity.report — now redirects to
              the native meta section inside Statistiques. */}
          <Route
            path="tools/meta"
            element={<Navigate to="/tools/stats" replace />}
          />
          <Route path="activities" element={<Lazy><Activities /></Lazy>} />
          <Route path="database" element={<Lazy><Database /></Lazy>} />
          <Route path="settings" element={<Settings />} />
          <Route path="marathon" element={<Marathon />} />
          <Route path="bot" element={<BotDashboard />} />
          {/* Unknown path → dashboard. Keeps the webview from rendering
              a blank frame if some future navigation targets a route
              that no longer exists. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}