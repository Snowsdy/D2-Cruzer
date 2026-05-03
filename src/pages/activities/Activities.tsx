import { useMemo, useState } from "react"
import { useManifestStore } from "@/store/manifest"
import {
  RAIDS,
  DUNGEONS,
  isContestActive,
  isNewlyReleased,
  type ActivityGuide,
} from "@/constants/lootTables"
import { LootModal } from "./LootModal"
import { ActivityCrest } from "@/components/activity-crest"

function ActivityCard({
  act,
  pgcrImage,
  displayName,
  onOpen,
}: {
  act: ActivityGuide
  pgcrImage?: string
  displayName?: string
  onOpen: () => void
}) {
  const bg = pgcrImage
    ? `linear-gradient(180deg, rgba(7,7,13,0.25), rgba(7,7,13,0.88) 70%, rgba(7,7,13,0.98)), url(https://www.bungie.net${pgcrImage})`
    : undefined

  return (
    <div
      className="panel border-bungie-border/60 hover:border-bungie-accent/60 relative overflow-hidden rounded-xl border-2 transition-all hover:-translate-y-0.5"
      style={
        bg
          ? {
              backgroundImage: bg,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {/* Contest / Nouveau / Featured badges */}
      <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1">
        {isContestActive(act) && (
          <div
            className="flex animate-pulse items-center gap-1 rounded-full px-2 py-1 text-[9px] font-extrabold tracking-widest uppercase"
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
            className="flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-extrabold tracking-widest uppercase"
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
            className="flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-extrabold tracking-widest uppercase"
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
      <div className="flex min-h-55 flex-col justify-between p-4">
        <div>
          <div className="flex items-start gap-3">
            <ActivityCrest name={act.name} size={44} />
            <div className="min-w-0 flex-1">
              <div className="text-bungie-accent flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase">
                <span>{act.type === "raid" ? "Raid" : "Donjon"}</span>
                <span className="text-white/40">·</span>
                <span>{act.year}</span>
                {act.expansion && (
                  <>
                    <span className="text-white/40">·</span>
                    <span className="truncate tracking-wide text-white/50 normal-case">
                      {act.expansion}
                    </span>
                  </>
                )}
              </div>
              <h3 className="mt-1 text-lg leading-tight font-extrabold drop-shadow">
                {displayName ?? act.name}
              </h3>
            </div>
          </div>
          {act.destination && (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-white/65 drop-shadow">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              <span className="truncate">{act.destination}</span>
            </div>
          )}

          {/* Quick stats row */}
          <div className="mt-2.5 flex items-center gap-3 text-[10px] font-semibold text-white/70 drop-shadow">
            {act.fireteamSize && (
              <div
                className="flex items-center gap-1"
                title="Taille du fireteam"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" />
                </svg>
                {act.duration}
              </div>
            )}
            {act.recommendedPower && (
              <div
                className="text-bungie-accent flex items-center gap-1"
                title="Puissance recommandée"
              >
                <span className="text-[10px]">◆</span>
                {act.recommendedPower}
              </div>
            )}
            {act.encounters.length > 0 && (
              <div
                className="flex items-center gap-1"
                title="Rencontres / étapes"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M5 5l14 14" />
                </svg>
                Pas de MM
              </div>
            )}
          </div>

          {/* Difficulty chips + seal */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1">
            {act.difficulties?.map((d) => {
              const isMaster =
                d.toLowerCase().includes("maître") ||
                d.toLowerCase().includes("master")
              const cls = isMaster
                ? "border-purple-400/55 text-purple-300 bg-purple-400/10"
                : "border-bungie-border text-white/70 bg-black/40"
              return (
                <span
                  key={d}
                  className={`rounded-sm border px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase ${cls}`}
                >
                  {d}
                </span>
              )
            })}
            {act.seal && (
              <span
                className="flex items-center gap-1 rounded-sm border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-amber-300 uppercase"
                title="Sceau / titre"
              >
                🏅 {act.seal}
              </span>
            )}
          </div>

          {act.exotic && (
            <div
              className="mt-2 truncate text-xs text-amber-300 drop-shadow"
              title={act.exotic}
            >
              ★ {act.exotic}
            </div>
          )}
        </div>
        <button
          onClick={onOpen}
          className="bg-bungie-accent mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md text-xs font-bold text-black transition hover:brightness-110"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          Guide & butin
        </button>
      </div>
    </div>
  )
}

export function Activities() {
  const manifest = useManifestStore((s) => s.manifest)
  const [active, setActive] = useState<"raids" | "dungeons">("raids")
  const [guide, setGuide] = useState<ActivityGuide | null>(null)

  const getImage = (hash: number): string | undefined => {
    const def = manifest?.DestinyActivityDefinition?.[hash]
    return def?.pgcrImage ?? undefined
  }
  const getName = (hash: number): string | undefined => {
    const def = manifest?.DestinyActivityDefinition?.[hash]
    return def?.displayProperties?.name
  }

  const raids = useMemo(() => RAIDS, [])
  const dungeons = useMemo(() => DUNGEONS, [])

  return (
    <div className="mx-auto max-w-400 space-y-6">
      <div className="fade-in-up">
        <h1 className="glitch text-3xl font-bold">
          <span data-text="Activités">Activités</span>
        </h1>
        <p className="text-bungie-muted mt-1 text-sm">
          Raids et donjons — guides et tables de butin.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-bungie-border flex w-fit gap-1 rounded-full border bg-black/30 p-1">
        {[
          { key: "raids", label: `Raids (${raids.length})` },
          { key: "dungeons", label: `Donjons (${dungeons.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key as typeof active)}
            className={`h-8 rounded-full px-4 text-xs font-bold transition-all ${
              active === t.key
                ? "bg-bungie-accent shadow-glow text-black"
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
  )
}
