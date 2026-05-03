/**
 * Compact live Destiny 2 concurrent-players chip for the app header.
 *
 * Bungie doesn't publish cross-platform online counts, so we extrapolate
 * from Steam's live figure using the community-accepted split where Steam
 * is roughly 35 % of the active D2 player base. The estimate is clearly
 * labelled and tapping shows the full breakdown in the tooltip.
 */

import { useQuery } from "@tanstack/react-query";
import { trackedInvoke } from "@/lib/tauri";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

// Community-accepted Steam share of the Destiny 2 player base. Multiply the
// Steam concurrent count by this inverse to approximate cross-platform.
const STEAM_SHARE = 0.35;

interface SteamPlayerCount {
  player_count: number;
}

function useSteamPlayerCount() {
  return useQuery<SteamPlayerCount | null>({
    queryKey: ["steamPlayerCount"],
    queryFn: async () => {
      try {
        return await trackedInvoke<SteamPlayerCount | null>(
          "steam_destiny2_player_count"
        );
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
    refetchInterval: 2 * 60_000,
  });
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)} k`;
  return n.toLocaleString("fr-FR");
}

export function LivePlayersBadge() {
  const { t } = useTranslation();
  const q = useSteamPlayerCount();
  const steam = q.data?.player_count ?? null;
  const total = steam != null ? Math.round(steam / STEAM_SHARE) : null;

  const title = steam != null
    ? `${t("livePlayers.tooltip")}\n` +
      `Steam: ${steam.toLocaleString()}\n` +
      `Cross-platform ≈ ${total?.toLocaleString()} (Steam ≈ 35 %)`
    : "—";

  return (
    <Link
      to="/tools/stats"
      title={title}
      className="flex items-center gap-1.5 h-7 px-2 rounded-full bg-bungie-panel/50 border border-emerald-400/25 hover:border-emerald-400/60 transition-colors"
    >
      <span className="relative w-1.5 h-1.5 shrink-0">
        <span
          className={`block w-1.5 h-1.5 rounded-full ${
            total != null
              ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]"
              : "bg-white/20"
          }`}
        />
        {total != null && (
          <span className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-50" />
        )}
      </span>
      <span className="text-[11.5px] font-bold tabular-nums text-white leading-none">
        {total != null
          ? formatCompact(total)
          : q.isLoading
            ? "…"
            : "—"}
      </span>
    </Link>
  );
}