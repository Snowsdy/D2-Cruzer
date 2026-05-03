import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQueries } from "@tanstack/react-query";
import { getItemDef } from "../api/itemDef";
import { useProfile } from "../hooks/useProfile";
import { useCharacterStore } from "../store/character";
import { useManifestStore } from "../store/manifest";
import type { SeasonInfo, SeasonRewardItem } from "../hooks/useSeason";
import { Dropdown } from "./dropdown";

function tierBorder(tier: number): string {
  if (tier === 6) return "border-yellow-400/90 shadow-[0_0_10px_rgba(251,191,36,0.25)]";
  if (tier === 5) return "border-purple-400/80 shadow-[0_0_8px_rgba(168,85,247,0.2)]";
  if (tier === 4) return "border-blue-400/80";
  return "border-white/15";
}

function RewardTile({
  reward,
  locale,
  isNext,
}: {
  reward: SeasonRewardItem;
  locale: string;
  isNext: boolean;
}) {
  const q = useQueries({
    queries: [
      {
        queryKey: ["itemDef", reward.itemHash, locale],
        queryFn: () => getItemDef(reward.itemHash, locale),
        staleTime: Infinity,
        gcTime: Infinity,
      },
    ],
  })[0];
  const def = q.data;

  const icon = def?.displayProperties?.icon;
  const name = def?.displayProperties?.name ?? `#${reward.itemHash}`;
  const tier = def?.inventory?.tierType ?? 0;
  const border = tierBorder(tier);

  return (
    <div
      className={`relative w-19.5 h-19.5 rounded-md border-2 ${border} overflow-hidden transition-all ${
        reward.claimed
          ? ""
          : isNext
            ? "ring-2 ring-bungie-accent/70 ring-offset-1 ring-offset-black"
            : "opacity-50 saturate-75"
      }`}
      title={`${name} · Rang ${reward.rank}${reward.isPremium ? " · Premium" : ""}`}
    >
      {icon ? (
        <img
          src={`https://www.bungie.net${icon}`}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-bungie-panel" />
      )}

      {reward.quantity > 1 && (
        <span className="absolute bottom-0 right-0.5 text-[11px] font-mono font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] tabular-nums">
          {reward.quantity}
        </span>
      )}

      {reward.claimed && (
        <span
          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-sm bg-teal-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow-[0_0_4px_rgba(20,184,166,0.8)]"
          aria-label="Réclamé"
        >
          ✓
        </span>
      )}
    </div>
  );
}

export function SeasonModal({
  season,
  onClose,
}: {
  season: SeasonInfo;
  onClose: () => void;
}) {
  const { profile, activeCharacterId } = useProfile();
  const manifest = useManifestStore((s) => s.manifest);
  const setActiveCharacter = useCharacterStore((s) => s.setActiveCharacter);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Group rewards by rank — free on top, premium on bottom.
  const byRank = useMemo(() => {
    const map = new Map<number, { free: SeasonRewardItem[]; prem: SeasonRewardItem[] }>();
    for (const r of season.rewards) {
      const e = map.get(r.rank) ?? { free: [], prem: [] };
      if (r.isPremium) e.prem.push(r);
      else e.free.push(r);
      map.set(r.rank, e);
    }
    return [...map.entries()].sort(([a], [b]) => a - b);
  }, [season.rewards]);

  const nextRank = season.rank + 1;

  // Auto-center current rank in the scroll view on open.
  useEffect(() => {
    if (scrolled || !scrollRef.current) return;
    const COL_WIDTH = 90; // px per rank column
    const target = Math.max(0, (season.rank - 4) * COL_WIDTH);
    scrollRef.current.scrollLeft = target;
    setScrolled(true);
  }, [scrolled, season.rank]);

  const chars = profile.data?.characters?.data ?? {};
  const charList = Object.values(chars).sort(
    (a, b) =>
      new Date(b.dateLastPlayed).getTime() -
      new Date(a.dateLastPlayed).getTime()
  );
  const char =
    activeCharacterId != null
      ? chars[activeCharacterId]
      : charList[0] ?? null;

  // Build the character dropdown options — class name + power, class icon
  // shown as the option suffix so identification is glance-fast.
  const charOptions = useMemo(
    () =>
      charList.map((c) => {
        const name =
          manifest?.DestinyClassDefinition?.[c.classHash]?.displayProperties?.name ??
          "…";
        return {
          value: c.characterId,
          label: name,
          suffix: (
            <span className="text-bungie-accent tabular-nums">◆ {c.light}</span>
          ),
        };
      }),
    [charList, manifest]
  );

  const monthsLeft =
    season.daysLeft != null ? (season.daysLeft / 30).toFixed(1) : null;

  const scroll = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 540, behavior: "smooth" });
  };

  const locale = "fr";

  const node = (
    <div
      className="fixed inset-0 z-100 bg-black/85 backdrop-blur-sm flex items-stretch overflow-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full min-h-full bg-bungie-bg flex flex-col"
      >
        {/* =============== HERO =============== */}
        <div
          className="relative flex items-center justify-center min-h-130 pt-20 pb-14 overflow-hidden"
          style={
            season.backgroundImage
              ? {
                  backgroundImage: `
                    linear-gradient(180deg, rgba(7,7,13,0.3) 0%, rgba(7,7,13,0.55) 60%, rgba(7,7,13,0.98) 100%),
                    url(${season.backgroundImage})
                  `,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : {
                  background:
                    "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(243,7,94,0.2), transparent 70%), #07070d",
                }
          }
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-black/60 border border-white/15 flex items-center justify-center hover:border-bungie-accent/60 text-white/80 hover:text-white text-lg transition-colors z-10"
            aria-label="Fermer"
          >
            ✕
          </button>

          <div className="relative text-center">
            {/* Ornate rank medallion — circular double-ring */}
            <div className="relative mx-auto w-65 h-65 flex items-center justify-center">
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-full border-2 border-amber-400/50" />
              <div
                className="absolute inset-2 rounded-full border border-amber-300/30"
                style={{
                  background:
                    "conic-gradient(from 0deg, rgba(251,191,36,0.3), rgba(251,191,36,0) 15%, rgba(251,191,36,0.3) 45%, rgba(251,191,36,0) 60%, rgba(251,191,36,0.3) 85%, rgba(251,191,36,0) 100%)",
                }}
              />
              {/* Inner dashed ring */}
              <div
                className="absolute inset-5 rounded-full border-[2.5px] border-amber-200/70"
                style={{
                  borderStyle: "dashed",
                  borderWidth: "1px 2.5px 1px 2.5px",
                }}
              />
              {/* Rank badge center */}
              <div className="relative w-45 h-45 rounded-full bg-[rgba(7,7,13,0.55)] backdrop-blur flex flex-col items-center justify-center border border-white/10">
                <span className="text-[10px] uppercase tracking-[0.35em] text-amber-200/90 font-semibold">
                  Rang
                </span>
                <span className="text-7xl font-extrabold tabular-nums leading-none mt-1 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                  {season.rank}
                </span>
              </div>
            </div>

            {/* Season name */}
            <h1 className="mt-8 text-5xl md:text-7xl font-extrabold tracking-tight uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              {season.name}
            </h1>

            {/* Pass ends */}
            {monthsLeft && (
              <div className="mt-6 text-base md:text-lg text-white/80 font-medium">
                Le pass se termine dans :{" "}
                <span className="font-bold text-white">
                  {season.daysLeft! < 30
                    ? `${season.daysLeft} jour${season.daysLeft! > 1 ? "s" : ""}`
                    : `${monthsLeft} mois`}
                </span>
              </div>
            )}

            {/* Selectors row */}
            <div className="flex items-center justify-center gap-3 mt-7 flex-wrap">
              {/* Pass label — static for now; we only track the active pass. */}
              <div className="h-10 px-4 rounded-md bg-black/50 border border-white/15 flex items-center gap-2 text-sm font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-bungie-accent shadow-[0_0_6px_rgba(243,7,94,0.8)]" />
                Pass actuel
              </div>
              {/* Real character switcher — uses the shared Dropdown so it
                  matches the rest of the app and actually changes the
                  active character when picked. */}
              {char && charOptions.length > 0 && (
                <Dropdown
                  value={char.characterId}
                  onChange={(id) => setActiveCharacter(id)}
                  options={charOptions}
                  variant="md"
                  size="md"
                  className="h-10 px-4 text-sm"
                />
              )}
            </div>

            {/* Progress bar */}
            <div className="mt-6 mx-auto max-w-xl">
              <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/60 font-semibold mb-1.5">
                <span>
                  XP rang {season.rank + 1} ·{" "}
                  <span className="text-white tabular-nums">
                    {season.xpProgress.toLocaleString()} /{" "}
                    {season.xpNeeded.toLocaleString()}
                  </span>
                </span>
                <span>
                  Saison écoulée · {(season.progress * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-bungie-accent to-bungie-accentHover rounded-full"
                  style={{
                    width: `${Math.min(100, (season.xpProgress / Math.max(1, season.xpNeeded)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* =============== REWARDS CAROUSEL =============== */}
        <div className="relative bg-bungie-bg pb-16">
          {/* Arrows */}
          <button
            onClick={() => scroll(-1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-24 bg-black/70 border border-white/10 rounded-r-md flex items-center justify-center text-2xl text-white/80 hover:text-white hover:bg-black/90 transition-colors"
            aria-label="Précédent"
          >
            ‹
          </button>
          <button
            onClick={() => scroll(1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-24 bg-black/70 border border-white/10 rounded-l-md flex items-center justify-center text-2xl text-white/80 hover:text-white hover:bg-black/90 transition-colors"
            aria-label="Suivant"
          >
            ›
          </button>

          {/* Ranks ribbon */}
          <div className="px-16 pt-8">
            <div
              ref={scrollRef}
              className="flex gap-1 overflow-x-auto no-scrollbar snap-x"
              style={{ scrollbarWidth: "none" }}
            >
              {byRank.map(([rank, { free, prem }]) => {
                const active = rank === nextRank;
                const reached = rank <= season.rank;
                return (
                  <div
                    key={rank}
                    className={`shrink-0 w-20.5 snap-start ${
                      active ? "relative" : ""
                    }`}
                  >
                    {/* Rank number */}
                    <div
                      className={`text-center font-bold mb-2 tabular-nums ${
                        reached
                          ? "text-white"
                          : active
                            ? "text-bungie-accent"
                            : "text-white/50"
                      }`}
                    >
                      {rank}
                    </div>

                    {/* Progress line at top */}
                    <div className="h-1 mb-2 rounded-full overflow-hidden bg-black/60">
                      <div
                        className={`h-full ${
                          reached
                            ? "bg-amber-400"
                            : active
                              ? "bg-bungie-accent"
                              : "bg-transparent"
                        }`}
                      />
                    </div>

                    {/* Free row */}
                    <div className="mb-1 flex justify-center">
                      {free.length > 0 ? (
                        free.map((r, i) => (
                          <RewardTile
                            key={i}
                            reward={r}
                            locale={locale}
                            isNext={active}
                          />
                        ))
                      ) : (
                        <div className="w-19.5 h-19.5 rounded-md border border-dashed border-white/10" />
                      )}
                    </div>

                    {/* Premium row (highlighted band like bungie.net teal) */}
                    <div
                      className={`flex justify-center p-0.75 rounded-md ${
                        reached
                          ? "bg-teal-700/50"
                          : active
                            ? "bg-bungie-accent/30"
                            : "bg-teal-900/30"
                      }`}
                    >
                      {prem.length > 0 ? (
                        prem.map((r, i) => (
                          <RewardTile
                            key={i}
                            reward={r}
                            locale={locale}
                            isNext={active}
                          />
                        ))
                      ) : (
                        <div className="w-19.5 h-19.5 rounded-md border border-dashed border-white/10" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination dots (decorative — visual only) */}
            <div className="flex justify-center gap-1.5 mt-6">
              {[0, 1, 2, 3, 4].map((i) => {
                const pct = season.rewards.length
                  ? (season.rank / Math.max(1, byRank.length)) * 5
                  : 0;
                const activeDot = Math.floor(pct) === i;
                return (
                  <span
                    key={i}
                    className={`h-0.5 rounded-full transition-all ${
                      activeDot ? "w-8 bg-white" : "w-5 bg-white/25"
                    }`}
                  />
                );
              })}
            </div>

            {/* Footer note */}
            <div className="mt-10 text-center text-xs text-bungie-muted">
              Les récompenses réclamables sont signalées par le{" "}
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-teal-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                  ✓
                </span>
                vert
              </span>
              . Pour les récupérer, va dans l'écran Saison de Destiny 2.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  return createPortal(node, document.body);
}