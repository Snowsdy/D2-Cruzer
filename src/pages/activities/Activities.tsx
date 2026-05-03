import { useMemo, useState } from "react";
import { useManifestStore } from "@/store/manifest";
import {
  RAIDS,
  DUNGEONS,
  isContestActive,
  isNewlyReleased,
  type ActivityGuide,
} from "@/constants/lootTables";
import { LootModal } from "./LootModal";
import { ActivityCrest } from "@/components/activity-crest";

function ActivityCard({
  act,
  pgcrImage,
  displayName,
  onOpen,
}: {
  act: ActivityGuide;
  pgcrImage?: string;
  displayName?: string;
  onOpen: () => void;
}) {
  const bg = pgcrImage
    ? `linear-gradient(180deg, rgba(7,7,13,0.25), rgba(7,7,13,0.88) 70%, rgba(7,7,13,0.98)), url(https://www.bungie.net${pgcrImage})`
    : undefined;

  return (
    <div
      className="relative rounded-xl overflow-hidden panel border-2 border-bungie-border/60 hover:border-bungie-accent/60 transition-all hover:-translate-y-0.5"
      style={
        bg
          ? { backgroundImage: bg, backgroundSize: "cover", backgroundPosition: "center" }
          : undefined
      }
    >
      {/* Contest / Nouveau / Featured badges */}
      <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
        {isContestActive(act) && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest animate-pulse"
            style={{
              background:
                "linear-gradient(90deg, rgba(239,68,68,0.95), rgba(168,85,247,0.9))",
              color: "#fff",
              boxShadow: "0 0 16px rgba(239,68,68,0.6)",
            }}
            title="Contest Mode · puissance verrouillée"
          >
            🔥 Contest en cours
          </div>
        )}
        {!isContestActive(act) && isNewlyReleased(act) && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest"
            style={{
              background:
                "linear-gradient(90deg, rgba(6,182,212,0.95), rgba(59,130,246,0.9))",
              color: "#0a0a12",
              boxShadow: "0 0 14px rgba(6,182,212,0.55)",
            }}
            title="Activité sortie récemment"
          >
            ✦ Nouveau
          </div>
        )}
        {act.featured && !isContestActive(act) && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest"
            style={{
              background:
                "linear-gradient(90deg, rgba(250,204,21,0.95), rgba(251,146,60,0.9))",
              color: "#0a0a12",
              boxShadow: "0 0 14px rgba(250,204,21,0.55)",
            }}
            title="Activité en vedette — bonus de loot"
          >
            ⭐ Vedette
          </div>
        )}
      </div>
      <div className="p-4 min-h-55 flex flex-col justify-between">
        <div>
          <div className="flex items-start gap-3">
            <ActivityCrest name={act.name} size={44} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-bungie-accent font-bold">
                <span>{act.type === "raid" ? "Raid" : "Donjon"}</span>
                <span className="text-white/40">·</span>
                <span>{act.year}</span>
                {act.expansion && (
                  <>
                    <span className="text-white/40">·</span>
                    <span className="text-white/50 normal-case tracking-wide truncate">
                      {act.expansion}
                    </span>
                  </>
                )}
              </div>
              <h3 className="font-extrabold text-lg leading-tight mt-1 drop-shadow">
                {displayName ?? act.name}
              </h3>
            </div>
          </div>
          {act.destination && (
            <div className="text-[11px] text-white/65 mt-1 flex items-center gap-1 drop-shadow">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <span className="truncate">{act.destination}</span>
            </div>
          )}

          {/* Quick stats row */}
          <div className="mt-2.5 flex items-center gap-3 text-[10px] text-white/70 font-semibold drop-shadow">
            {act.fireteamSize && (
              <div className="flex items-center gap-1" title="Taille du fireteam">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="8" r="3.5" />
                  <path d="M2 20c0-3 3-5 7-5s7 2 7 5" />
                  <circle cx="17" cy="7" r="2.5" />
                  <path d="M15 13c4 0 6 2 6 5" />
                </svg>
                {act.fireteamSize}
              </div>
            )}
            {act.duration && (
              <div className="flex items-center gap-1" title="Durée estimée">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                {act.duration}
              </div>
            )}
            {act.recommendedPower && (
              <div className="flex items-center gap-1 text-bungie-accent" title="Puissance recommandée">
                <span className="text-[10px]">◆</span>
                {act.recommendedPower}
              </div>
            )}
            {act.encounters.length > 0 && (
              <div className="flex items-center gap-1" title="Rencontres / étapes">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="4" />
                  <rect x="3" y="11" width="18" height="4" />
                  <rect x="3" y="17" width="12" height="4" />
                </svg>
                {act.encounters.length}
              </div>
            )}
            {act.matchmaking === false && (
              <div
                className="flex items-center gap-1 text-red-300"
                title="Pas de matchmaking — fireteam requis"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M5 5l14 14" />
                </svg>
                Pas de MM
              </div>
            )}
          </div>

          {/* Difficulty chips + seal */}
          <div className="flex flex-wrap items-center gap-1 mt-2.5">
            {act.difficulties?.map((d) => {
              const isMaster =
                d.toLowerCase().includes("maître") ||
                d.toLowerCase().includes("master");
              const cls = isMaster
                ? "border-purple-400/55 text-purple-300 bg-purple-400/10"
                : "border-bungie-border text-white/70 bg-black/40";
              return (
                <span
                  key={d}
                  className={`px-1.5 py-0.5 rounded-sm border text-[9px] font-bold uppercase tracking-widest ${cls}`}
                >
                  {d}
                </span>
              );
            })}
            {act.seal && (
              <span
                className="px-1.5 py-0.5 rounded-sm border border-amber-400/40 bg-amber-400/10 text-amber-300 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1"
                title="Sceau / titre"
              >
                🏅 {act.seal}
              </span>
            )}
          </div>

          {act.exotic && (
            <div className="text-xs text-amber-300 mt-2 drop-shadow truncate" title={act.exotic}>
              ★ {act.exotic}
            </div>
          )}
        </div>
        <button
          onClick={onOpen}
          className="mt-4 w-full h-10 rounded-md bg-bungie-accent text-black text-xs font-bold flex items-center justify-center gap-2 hover:brightness-110 transition"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          Guide & butin
        </button>
      </div>
    </div>
  );
}

export function Activities() {
  const manifest = useManifestStore((s) => s.manifest);
  const [active, setActive] = useState<"raids" | "dungeons">("raids");
  const [guide, setGuide] = useState<ActivityGuide | null>(null);

  const getImage = (hash: number): string | undefined => {
    const def = manifest?.DestinyActivityDefinition?.[hash];
    return def?.pgcrImage ?? undefined;
  };
  const getName = (hash: number): string | undefined => {
    const def = manifest?.DestinyActivityDefinition?.[hash];
    return def?.displayProperties?.name;
  };

  const raids = useMemo(() => RAIDS, []);
  const dungeons = useMemo(() => DUNGEONS, []);

  return (
    <div className="space-y-6 max-w-400 mx-auto">
      <div className="fade-in-up">
        <h1 className="text-3xl font-bold glitch">
          <span data-text="Activités">Activités</span>
        </h1>
        <p className="text-sm text-bungie-muted mt-1">
          Raids et donjons — guides et tables de butin.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-black/30 border border-bungie-border rounded-full w-fit">
        {[
          { key: "raids", label: `Raids (${raids.length})` },
          { key: "dungeons", label: `Donjons (${dungeons.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key as typeof active)}
            className={`px-4 h-8 rounded-full text-xs font-bold transition-all ${
              active === t.key
                ? "bg-bungie-accent text-black shadow-glow"
                : "text-bungie-text/70 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === "raids" && (
        <div className="stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {raids.map((r) => (
            <ActivityCard
              key={r.activityHash}
              act={r}
              pgcrImage={getImage(r.activityHash)}
              displayName={getName(r.activityHash)}
              onOpen={() => setGuide(r)}
            />
          ))}
        </div>
      )}

      {active === "dungeons" && (
        <div className="stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dungeons.map((d) => (
            <ActivityCard
              key={d.activityHash + d.shortName}
              act={d}
              pgcrImage={getImage(d.activityHash)}
              displayName={getName(d.activityHash)}
              onOpen={() => setGuide(d)}
            />
          ))}
        </div>
      )}

      {guide && <LootModal guide={guide} onClose={() => setGuide(null)} />}
    </div>
  );
}