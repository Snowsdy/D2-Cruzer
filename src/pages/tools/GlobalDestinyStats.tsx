/**
 * Global Destiny 2 community stats — live Steam concurrent players + snapshot
 * totals from popularity.report.
 *
 *  - Live concurrent players come from Steam's public API via a Rust command.
 *    PC-only, but the only live number Bungie doesn't disclose directly.
 *  - Cumulative totals (players, hours, kills, etc.) are pulled as a manually
 *    maintained snapshot from popularity.report — those values grow slowly
 *    (monthly-ish) so we bump them when the site shows drift.
 */

import { useQuery } from "@tanstack/react-query";
import { trackedInvoke } from "@/lib/tauri";

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

interface Stat {
  label: string;
  value: string;
  hint?: string;
  color: string;
}

// popularity.report snapshot — refresh manually when the site drifts.
const GLOBAL_STATS: Stat[] = [
  {
    label: "Joueurs totaux",
    value: "72 157 243",
    hint: "comptes Destiny 2 créés",
    color: "#a78bfa",
  },
  {
    label: "Heures jouées",
    value: "10.61 Md",
    hint: "≈ 1 209 843 années",
    color: "#60a5fa",
  },
  {
    label: "Activités jouées",
    value: "16.82 Md",
    hint: "raids, strikes, PvP…",
    color: "#fbbf24",
  },
  {
    label: "Kills cumulés",
    value: "1 805.19 Md",
    hint: "toutes saisons confondues",
    color: "#f87171",
  },
  {
    label: "Morts cumulées",
    value: "130.64 Md",
    hint: "Gardiens tombés",
    color: "#9ca3af",
  },
];

// Steam is ~35 % of the active Destiny 2 player base (community estimate).
// Multiply by 1/0.35 ≈ 2.857 to extrapolate cross-platform.
const STEAM_SHARE = 0.35;

export function GlobalDestinyStats() {
  const q = useSteamPlayerCount();
  const live = q.data?.player_count ?? null;
  const total = live != null ? Math.round(live / STEAM_SHARE) : null;

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{
        background:
          "linear-gradient(135deg, rgba(243,7,94,0.08) 0%, rgba(7,7,13,0.85) 60%)",
        border: "1px solid rgba(243,7,94,0.25)",
      }}
    >
      <div
        className="absolute -top-16 -left-16 w-60 h-60 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(243,7,94,0.18), transparent 70%)",
        }}
      />

      <div className="relative flex items-center gap-4 px-5 py-4 flex-wrap">
        {/* Live players — emerald pulse, cross-platform estimate */}
        <div className="flex items-center gap-3 shrink-0 pr-4 border-r border-white/10">
          <div className="relative w-2.5 h-2.5 shrink-0">
            <span
              className={`block w-2.5 h-2.5 rounded-full ${
                total != null
                  ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]"
                  : "bg-white/20"
              }`}
            />
            {total != null && (
              <span className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-50" />
            )}
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-[0.28em] font-extrabold text-emerald-300 font-mono">
              Joueurs en ligne · Toutes plateformes
            </div>
            <div className="text-2xl font-extrabold tabular-nums leading-none text-white mt-0.5">
              {total != null
                ? total.toLocaleString("fr-FR")
                : q.isLoading
                  ? "…"
                  : "—"}
            </div>
            <div className="text-[9.5px] text-white/45 mt-1">
              {total != null
                ? `Steam ${live?.toLocaleString("fr-FR")} · estimation × 2.85 cross-plateforme`
                : "API Steam indisponible"}
            </div>
          </div>
        </div>

        {/* popularity.report totals */}
        <div className="flex items-stretch gap-2 flex-wrap flex-1 justify-end">
          {GLOBAL_STATS.map((s) => (
            <div
              key={s.label}
              className="px-3 py-2 rounded-md min-w-30"
              style={{
                background: "rgba(0,0,0,0.5)",
                border: `1px solid ${s.color}30`,
                backdropFilter: "blur(6px)",
              }}
            >
              <div className="text-[8.5px] uppercase tracking-[0.22em] text-white/45 font-extrabold font-mono leading-none">
                {s.label}
              </div>
              <div
                className="text-lg font-extrabold tabular-nums leading-none mt-1"
                style={{ color: s.color }}
              >
                {s.value}
              </div>
              {s.hint && (
                <div className="text-[9px] text-white/35 mt-1 leading-tight">
                  {s.hint}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="relative px-5 pb-2.5">
        <p className="text-[10px] text-white/35 italic">
          Joueurs en ligne · Steam live extrapolé cross-plateforme (Bungie ne
          publie pas le count direct ; Steam ≈ 35 % du player base). Totaux
          cumulés · snapshot popularity.report, agrégés depuis les PGCR.
        </p>
      </div>
    </div>
  );
}