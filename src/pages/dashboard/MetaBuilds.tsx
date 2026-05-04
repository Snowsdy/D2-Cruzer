import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useItemDef } from "@/hooks/useItemDef"
import { useExoticForClass } from "@/hooks/useExoticForClass"
import { BungieIcon } from "@/components/bungie-icon"
import { ClassGlyph } from "./ClassGlyph"
import { DamageTypes } from "@/constants/bungieHashes"

type ClassName = "Warlock" | "Hunter" | "Titan"
type Element = "arc" | "solar" | "void" | "stasis" | "strand" | "prismatic"

interface Build {
  id: string
  title: string
  class: ClassName
  subclass: string
  element: Element
  tier: "S" | "A" | "B"
  tags: string[]
  exoticHash: number
  playstyle: string
  aspects: string[]
  fragments: string[]
  weapons: string[]
  mobalyticsUrl: string
  author?: string
}

// Mobalytics has no public API — manually curated current builds with direct links.
// These point to live Mobalytics build pages opened in the system browser.
const BUILDS: Build[] = [
  {
    id: "hunter-void-renegades",
    title: "INSANE Void Hunter DPS",
    class: "Hunter",
    subclass: "Void",
    element: "void",
    tier: "S",
    tags: ["PvE", "Endgame", "Boss DPS"],
    exoticHash: 814876684,
    author: "Renegades · Llama",
    playstyle:
      "Build Void Hunter avec invisibilité + Volatile Rounds pour DPS soutenu et survie en endgame Renegades.",
    aspects: ["Stylish Executioner", "Vanishing Step"],
    fragments: [
      "Echo of Persistence",
      "Echo of Obscurity",
      "Echo of Domineering",
    ],
    weapons: ["Graviton Lance", "Le Monarque", "Retrofit Escapade"],
    mobalyticsUrl:
      "https://mobalytics.gg/destiny-2/builds/hunter/void/llamad2-void-hunter-dps",
  },
  {
    id: "titan-prismatic-smg",
    title: "SMG x Peacekeepers META",
    class: "Titan",
    subclass: "Prismatic",
    element: "prismatic",
    tier: "S",
    tags: ["PvE", "Endgame", "Ad-clear"],
    exoticHash: 1661191197,
    author: "Renegades · Llama",
    playstyle:
      "Boucle SMG infinie avec Peacekeepers : reload auto + dégâts boostés. Spam consécration entre.",
    aspects: ["Consecration", "Knockout"],
    fragments: ["Facet of Courage", "Facet of Purpose", "Facet of Grace"],
    weapons: ["The Call", "SMG Légendaire au choix", "Edge of Action"],
    mobalyticsUrl:
      "https://mobalytics.gg/destiny-2/builds/titan/prismatic/llama-smg-x-peacekeeper",
  },
  {
    id: "hunter-strand-revolutionary",
    title: "REVOLUTIONARY Strand Hunter",
    class: "Hunter",
    subclass: "Strand",
    element: "strand",
    tier: "S",
    tags: ["PvE", "Survivability"],
    exoticHash: 4128163696,
    author: "Renegades · Llama",
    playstyle:
      "Strand Hunter avec Threaded Specter + Cyrtarachne pour Woven Mail constant. Boucle de damage et survie.",
    aspects: ["Threaded Specter", "Ensnaring Slam"],
    fragments: [
      "Thread of Warding",
      "Thread of Generation",
      "Thread of Continuity",
    ],
    weapons: ["Final Warning", "Wicked Implement", "Ex Diris"],
    mobalyticsUrl:
      "https://mobalytics.gg/destiny-2/builds/hunter/strand/llama-revolutionary-strand-hunter",
  },
  {
    id: "titan-solar-greatest",
    title: "The GREATEST Solar Titan",
    class: "Titan",
    subclass: "Solar",
    element: "solar",
    tier: "S",
    tags: ["PvE", "Boss DPS"],
    exoticHash: 1177021413,
    author: "Renegades · Llama",
    playstyle:
      "Solar Titan optimal pour le DPS boss et l'ad-clear. Combine Hammer of Sol + brûlure soutenue.",
    aspects: ["Sol Invictus", "Roaring Flames"],
    fragments: ["Ember of Torches", "Ember of Empyrean", "Ember of Char"],
    weapons: ["Still Hunt", "Izanagi's Burden", "The Lament"],
    mobalyticsUrl:
      "https://mobalytics.gg/destiny-2/builds/titan/solar/llama-greatest-solar-titan",
  },
  {
    id: "warlock-prismatic-winter",
    title: "Winter's Surge",
    class: "Warlock",
    subclass: "Prismatic",
    element: "prismatic",
    tier: "S",
    tags: ["PvE", "Endgame", "Crowd control"],
    exoticHash: 3371482540,
    author: "Rest",
    playstyle:
      "Build Prismatic Warlock avec Bleak Watcher + Dévoration. Glace + grenades infinies.",
    aspects: ["Bleak Watcher", "Hellion"],
    fragments: ["Facet of Balance", "Facet of Purpose", "Facet of Protection"],
    weapons: ["Graviton Lance", "Wicked Implement", "Divinity"],
    mobalyticsUrl:
      "https://mobalytics.gg/destiny-2/builds/warlock/prismatic/rest-winter-surge",
  },
  {
    id: "warlock-stasis-bleak",
    title: "Bleak Watcher Control",
    class: "Warlock",
    subclass: "Stasis",
    element: "stasis",
    tier: "A",
    tags: ["PvE", "Contrôle"],
    exoticHash: 3900842099,
    playstyle:
      "Tourelles Bleak Watcher pour gel constant. Pair avec Anarchy pour DPS multi-cibles.",
    aspects: ["Frostpulse", "Bleak Watcher"],
    fragments: ["Whisper of Shards", "Whisper of Torment", "Whisper of Chains"],
    weapons: ["Verglas Curve", "Anarchy", "Whisper of the Worm"],
    mobalyticsUrl: "https://mobalytics.gg/destiny-2/builds/warlock/stasis",
  },
]

const ELEMENT_GRADIENT: Record<Element, string> = {
  arc: "from-pink-500 via-pink-400 to-blue-600",
  solar: "from-orange-500 via-amber-400 to-red-600",
  void: "from-purple-500 via-violet-400 to-fuchsia-700",
  stasis: "from-pink-400 via-blue-300 to-indigo-500",
  strand: "from-emerald-500 via-green-400 to-teal-600",
  prismatic: "from-pink-500 via-fuchsia-400 via-amber-400 to-emerald-500",
}

const TIER_COLOR: Record<Build["tier"], string> = {
  S: "text-yellow-300 border-yellow-400 bg-yellow-400/20",
  A: "text-purple-300 border-purple-400 bg-purple-400/15",
  B: "text-blue-300 border-blue-400 bg-blue-400/15",
}

const DAMAGE_BY_ELEMENT: Record<Element, number | null> = {
  arc: DamageTypes.Arc,
  solar: DamageTypes.Solar,
  void: DamageTypes.Void,
  stasis: DamageTypes.Stasis,
  strand: DamageTypes.Strand,
  prismatic: null, // no single damage — use multi-color gradient
}

function BuildThumb({
  hash,
  className,
  element,
}: {
  hash: number
  className: ClassName
  element: Element
}) {
  const hardDef = useItemDef(hash)
  // Fallback: use an exotic the user actually owns for this class
  const userExotic = useExoticForClass(className)

  const def = hardDef.data ?? userExotic.def
  const icon = def?.displayProperties?.icon
  const watermark = def?.iconWatermark

  if (icon) {
    return (
      <div className="relative h-16 w-16 shrink-0">
        <img
          src={`https://www.bungie.net${icon}`}
          alt=""
          className="h-full w-full rounded border-2 border-yellow-400/70 shadow-[0_0_16px_rgba(250,204,21,0.35)]"
        />
        {watermark && (
          <img
            src={`https://www.bungie.net${watermark}`}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full"
          />
        )}
      </div>
    )
  }

  const damageHash = DAMAGE_BY_ELEMENT[element]

  return (
    <div
      className={`relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded border-2 border-yellow-400/70 bg-linear-to-br ${ELEMENT_GRADIENT[element]} shadow-[0_0_16px_rgba(250,204,21,0.35)]`}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
        <ClassGlyph className={className} size={44} />
      </div>
      {damageHash && (
        <div className="absolute top-0.5 right-0.5">
          <BungieIcon source="damage" hash={damageHash} size={14} />
        </div>
      )}
    </div>
  )
}

function BuildCard({ build, onOpen }: { build: Build; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="panel group relative overflow-hidden rounded-xl text-left transition-all hover:-translate-y-0.5"
    >
      {/* Gradient backdrop */}
      <div
        className={`absolute inset-0 bg-linear-to-br ${ELEMENT_GRADIENT[build.element]} opacity-30 transition-opacity group-hover:opacity-40`}
      />
      {/* Giant class glyph decoration */}
      <div className="pointer-events-none absolute -right-6 -bottom-10 text-white/15 transition-colors group-hover:text-white/25">
        <ClassGlyph className={build.class} size={180} />
      </div>
      <div className="absolute inset-0 bg-linear-to-tr from-black/85 via-black/30 to-transparent" />

      <div className="relative flex min-h-37.5 flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <div
            className={`rounded-full border px-2 py-0.5 text-xs font-bold ${TIER_COLOR[build.tier]}`}
          >
            {build.tier}-TIER
          </div>
          <div className="text-[10px] tracking-widest text-white/60 uppercase">
            {build.class}
          </div>
        </div>

        <div className="mt-3 flex items-end gap-3">
          <BuildThumb
            hash={build.exoticHash}
            className={build.class}
            element={build.element}
          />
          <div className="min-w-0 flex-1">
            <div className="leading-tight font-bold text-white">
              {build.title}
            </div>
            <div className="text-bungie-accent mt-1 text-[11px] tracking-widest uppercase">
              {build.subclass}
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {build.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white/80"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}

function BuildModal({ build, onClose }: { build: Build; onClose: () => void }) {
  const def = useItemDef(build.exoticHash)
  const screenshot = def.data?.screenshot

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="panel relative max-h-[85vh] w-full max-w-3xl overflow-hidden overflow-y-auto rounded-xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage: screenshot
            ? `linear-gradient(180deg, rgba(7,7,13,0.5), rgba(7,7,13,0.95) 70%), url(https://www.bungie.net${screenshot})`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className={`absolute inset-0 bg-linear-to-br ${ELEMENT_GRADIENT[build.element]} pointer-events-none opacity-20`}
        />
        <div className="pointer-events-none absolute -right-20 -bottom-20 text-white/10">
          <ClassGlyph className={build.class} size={400} />
        </div>

        <div className="relative space-y-5 p-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-bold ${TIER_COLOR[build.tier]}`}
                >
                  {build.tier}-TIER
                </span>
                <span className="text-[10px] tracking-widest text-white/60 uppercase">
                  {build.class} · {build.subclass}
                </span>
              </div>
              <h2 className="text-3xl font-extrabold text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                {build.title}
              </h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {build.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-2 text-xl leading-none text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Exotic */}
          <div className="panel flex items-center gap-4 bg-black/40 p-3">
            <BuildThumb
              hash={build.exoticHash}
              className={build.class}
              element={build.element}
            />
            <div className="min-w-0">
              <div className="text-[10px] tracking-widest text-yellow-300/80 uppercase">
                Exotique clé
              </div>
              <div className="font-bold text-yellow-300">
                {def.data?.displayProperties?.name ?? "…"}
              </div>
              {def.data?.itemTypeDisplayName && (
                <div className="text-xs text-white/60">
                  {def.data.itemTypeDisplayName}
                </div>
              )}
            </div>
          </div>

          {/* Playstyle */}
          <div>
            <div className="text-bungie-accent mb-2 text-[10px] tracking-widest uppercase">
              Gameplay
            </div>
            <p className="text-sm leading-relaxed text-white/85">
              {build.playstyle}
            </p>
          </div>

          {/* Aspects / Fragments */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="text-bungie-accent mb-2 text-[10px] tracking-widest uppercase">
                Aspects
              </div>
              <div className="flex flex-wrap gap-1.5">
                {build.aspects.map((a) => (
                  <span
                    key={a}
                    className="border-bungie-border rounded border bg-black/40 px-2.5 py-1 text-xs text-white/85"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-bungie-accent mb-2 text-[10px] tracking-widest uppercase">
                Fragments
              </div>
              <div className="flex flex-wrap gap-1.5">
                {build.fragments.map((f) => (
                  <span
                    key={f}
                    className="border-bungie-border rounded border bg-black/40 px-2.5 py-1 text-xs text-white/85"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Weapons */}
          <div>
            <div className="text-bungie-accent mb-2 text-[10px] tracking-widest uppercase">
              Armes recommandées
            </div>
            <div className="flex flex-wrap gap-1.5">
              {build.weapons.map((w) => (
                <span
                  key={w}
                  className="bg-bungie-accent/15 border-bungie-accent/40 text-bungie-accent rounded border px-2.5 py-1 text-xs"
                >
                  {w}
                </span>
              ))}
            </div>
          </div>

          {/* Author + Mobalytics link */}
          <div className="border-bungie-border flex flex-wrap items-center justify-between gap-3 border-t pt-3">
            {build.author && (
              <div className="text-bungie-muted text-[10px] tracking-widest uppercase">
                Source : <span className="text-white/80">{build.author}</span> ·
                Mobalytics
              </div>
            )}
            <button
              onClick={async () => {
                try {
                  const { openUrl } = await import("@tauri-apps/plugin-opener")
                  await openUrl(build.mobalyticsUrl)
                } catch {
                  window.open(build.mobalyticsUrl, "_blank")
                }
              }}
              className="btn-primary px-4 py-1.5 text-xs"
            >
              Voir le build complet sur Mobalytics →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function MetaBuilds() {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<Build | null>(null)

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="section-title">{t("dashboard.metaBuilds")}</h3>
        <span className="text-bungie-muted text-[10px] tracking-widest uppercase">
          {t("dashboard.metaBuildsHint")}
        </span>
      </div>
      <div className="stagger grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {BUILDS.map((b) => (
          <BuildCard key={b.id} build={b} onOpen={() => setSelected(b)} />
        ))}
      </div>

      {selected && (
        <BuildModal build={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  )
}
