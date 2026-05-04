import { useCallback, useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useProfile } from "@/hooks/useProfile"
import { useItemDef } from "@/hooks/useItemDef"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { SK_BUILDS } from "@/constants/storageKeys"
import type { DestinyItemComponent } from "bungie-api-ts/destiny2"

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const STORAGE_KEY = SK_BUILDS
const BUILD_SCHEMA_VERSION = 2

type ClassType = "Titan" | "Chasseur" | "Arcaniste"
type Subclass = "Solaire" | "Arc" | "Vide" | "Stasis" | "Toile" | "Prismatique"

export interface Build {
  v: 2
  id: string
  name: string
  description: string
  className: ClassType
  subclass: Subclass
  tags: string[]
  weapons: { kinetic?: number; energy?: number; power?: number }
  armor: {
    helmet?: number
    arms?: number
    chest?: number
    legs?: number
    class?: number
  }
  subclassHash?: number
  subclassPlugs: number[]
  createdAt: number
  updatedAt: number
}

function loadBuilds(): Build[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((b: { v?: number }) => b.v === BUILD_SCHEMA_VERSION)
  } catch {
    return []
  }
}

function saveBuilds(builds: Build[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(builds))
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Bungie bucket hashes + class / subclass mapping
// ---------------------------------------------------------------------------

const Buckets = {
  Kinetic: 1498876634,
  Energy: 2465295065,
  Power: 953998645,
  Helmet: 3448274439,
  Arms: 3551918588,
  Chest: 14239492,
  Legs: 20886954,
  ClassItem: 1585787867,
  Subclass: 3284755031,
} as const

const CLASS_ICON: Record<ClassType, string> = {
  Titan: "🛡️",
  Chasseur: "🗡️",
  Arcaniste: "✨",
}

const SUBCLASS_COLOR: Record<Subclass, string> = {
  Solaire: "#f97316",
  Arc: "#60a5fa",
  Vide: "#a78bfa",
  Stasis: "#38bdf8",
  Toile: "#34d399",
  Prismatique: "#f472b6",
}

// Bungie classType → label
const CLASS_BY_INT: Record<number, ClassType> = {
  0: "Titan",
  1: "Chasseur",
  2: "Arcaniste",
}

// Bungie damageType → Subclass label
const SUBCLASS_BY_DAMAGE: Record<number, Subclass> = {
  2: "Arc",
  3: "Solaire", // note: Bungie sometimes swaps 3/4 — handle via name fallback
  4: "Vide",
  6: "Stasis",
  7: "Toile",
}

function newBuildId() {
  return `b_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ---------------------------------------------------------------------------
// ItemChip — a clickable item slot that opens a picker modal
// ---------------------------------------------------------------------------

function ItemChip({
  label,
  hash,
  onPick,
  items,
  bucketLabel,
}: {
  label: string
  hash?: number
  onPick: (hash: number | undefined) => void
  items: DestinyItemComponent[]
  bucketLabel: string
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const def = useItemDef(hash)
  const icon = def.data?.displayProperties?.icon
  const name = def.data?.displayProperties?.name
  const type = def.data?.itemTypeDisplayName
  const tier = def.data?.inventory?.tierType ?? 5
  const isExotic = tier === 6

  return (
    <>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-white/5"
        style={{
          background: "rgba(0,0,0,0.3)",
          border: `1px solid ${isExotic ? "rgba(206,165,46,0.5)" : "rgba(255,255,255,0.08)"}`,
        }}
      >
        <div
          className="h-11 w-11 shrink-0 overflow-hidden"
          style={{
            background: "rgba(7,7,13,0.6)",
            border: `1px solid ${isExotic ? "rgba(206,165,46,0.7)" : "rgba(255,255,255,0.12)"}`,
          }}
        >
          {icon ? (
            <img
              src={`https://www.bungie.net${icon}`}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg text-white/20">
              +
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[9px] leading-none font-extrabold tracking-[0.22em] text-white/40 uppercase">
            {label}
          </div>
          <div
            className={`mt-0.5 truncate text-[13px] font-bold ${
              isExotic
                ? "text-amber-300"
                : hash
                  ? "text-white"
                  : "text-white/40"
            }`}
          >
            {hash ? (name ?? "…") : "Aucun"}
          </div>
          {type && (
            <div className="truncate text-[10px] text-white/45">{type}</div>
          )}
        </div>
        {hash && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onPick(undefined)
            }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-white/40 hover:bg-red-500/10 hover:text-red-300"
            aria-label="Retirer"
          >
            ✕
          </button>
        )}
      </button>

      {pickerOpen && (
        <ItemPickerModal
          title={`Choisir : ${bucketLabel}`}
          items={items}
          currentHash={hash}
          onClose={() => setPickerOpen(false)}
          onPick={(h) => {
            onPick(h)
            setPickerOpen(false)
          }}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// ItemPickerModal — searchable grid of items
// ---------------------------------------------------------------------------

function ItemPickerModal({
  title,
  items,
  currentHash,
  onClose,
  onPick,
}: {
  title: string
  items: DestinyItemComponent[]
  currentHash?: number
  onClose: () => void
  onPick: (hash: number | undefined) => void
}) {
  const [query, setQuery] = useState("")
  // Dedupe by hash so multiple instances of the same roll collapse to one option.
  const uniq = useMemo(() => {
    const seen = new Set<number>()
    return items.filter((it) => {
      if (seen.has(it.itemHash)) return false
      seen.add(it.itemHash)
      return true
    })
  }, [items])

  if (typeof document === "undefined") return null
  return createPortal(
    <div
      className="fade-in-fast fixed inset-0 z-9998 flex items-center justify-center p-6"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="panel flex max-h-[82vh] w-full max-w-3xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-bungie-border flex items-center gap-3 border-b px-4 py-3">
          <div className="flex-1">
            <div className="text-[10px] font-extrabold tracking-[0.25em] text-white/40 uppercase">
              Sélection
            </div>
            <div className="text-lg font-extrabold text-white">{title}</div>
          </div>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            className="border-bungie-border focus:border-bungie-accent h-9 w-60 rounded-md border bg-black/30 px-3 text-sm text-white focus:outline-none"
          />
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-md text-white/70 hover:bg-white/5 hover:text-white"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
            <button
              onClick={() => onPick(undefined)}
              className="flex h-17 items-center justify-center rounded-md border border-dashed border-white/15 text-xs font-bold tracking-widest text-white/50 uppercase hover:border-white/40 hover:text-white"
            >
              — Aucun —
            </button>
            {uniq.map((it) => (
              <PickerTile
                key={it.itemInstanceId ?? it.itemHash}
                hash={it.itemHash}
                selected={it.itemHash === currentHash}
                query={query}
                onPick={() => onPick(it.itemHash)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function PickerTile({
  hash,
  selected,
  query,
  onPick,
}: {
  hash: number
  selected: boolean
  query: string
  onPick: () => void
}) {
  const def = useItemDef(hash)
  const name = def.data?.displayProperties?.name ?? ""
  const icon = def.data?.displayProperties?.icon
  const watermark = def.data?.iconWatermark
  const type = def.data?.itemTypeDisplayName
  const tier = def.data?.inventory?.tierType ?? 5
  const isExotic = tier === 6

  // Client-side filter — hide items whose name doesn't match the search
  if (query && !name.toLowerCase().includes(query.toLowerCase())) return null

  return (
    <button
      onClick={onPick}
      className={`flex items-center gap-2 rounded-md p-1.5 text-left transition-all ${
        selected
          ? "bg-bungie-accent/15 border-bungie-accent border"
          : "hover:border-bungie-accent/50 border border-white/8 bg-white/3 hover:bg-white/6"
      }`}
    >
      <div
        className="relative h-12 w-12 shrink-0 overflow-hidden"
        style={{
          border: `1px solid ${isExotic ? "rgba(206,165,46,0.7)" : "rgba(255,255,255,0.14)"}`,
        }}
      >
        {icon && (
          <img
            src={`https://www.bungie.net${icon}`}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
        {watermark && (
          <img
            src={`https://www.bungie.net${watermark}`}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={`truncate text-[12px] font-bold ${
            isExotic ? "text-amber-300" : "text-white"
          }`}
        >
          {name || "…"}
        </div>
        {type && (
          <div className="truncate text-[10px] text-white/45">{type}</div>
        )}
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Chip — free-form tag input (used for aspects/fragments/mods/tags)
// ---------------------------------------------------------------------------

function Chip({
  value,
  onRemove,
  color,
}: {
  value: string
  onRemove: () => void
  color?: string
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold"
      style={{
        background: color ?? "rgba(243,7,94,0.12)",
        borderColor: `${color ?? "rgba(243,7,94,0.4)"}80`,
        color: color ? "#fff" : "#fbcfe8",
      }}
    >
      {value}
      <button
        onClick={onRemove}
        className="text-[10px] text-white/55 hover:text-white"
      >
        ✕
      </button>
    </span>
  )
}

// ---------------------------------------------------------------------------
// BuildRow — list sidebar entry
// ---------------------------------------------------------------------------

function BuildRow({
  build,
  selected,
  onSelect,
}: {
  build: Build
  selected: boolean
  onSelect: () => void
}) {
  const col = SUBCLASS_COLOR[build.subclass]
  const exoticDef = useItemDef(
    build.weapons.kinetic ?? build.weapons.energy ?? build.weapons.power
  )
  const icon = exoticDef.data?.displayProperties?.icon

  return (
    <button
      onClick={onSelect}
      className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all hover:-translate-y-0.5"
      style={{
        background: selected
          ? `linear-gradient(135deg, ${col}22, ${col}05)`
          : "rgba(20,12,30,0.5)",
        border: `1px solid ${selected ? `${col}80` : "rgba(255,255,255,0.08)"}`,
      }}
    >
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md text-lg"
        style={{
          background: `${col}22`,
          border: `1px solid ${col}50`,
        }}
      >
        {icon ? (
          <img
            src={`https://www.bungie.net${icon}`}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          CLASS_ICON[build.className]
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-white">
          {build.name}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] tracking-widest text-white/50 uppercase">
          <span>{build.className}</span>
          <span className="text-white/30">·</span>
          <span style={{ color: col }}>{build.subclass}</span>
        </div>
        {build.tags.length > 0 && (
          <div className="mt-1 flex items-center gap-1">
            {build.tags.slice(0, 3).map((t, i) => (
              <span
                key={i}
                className="rounded-sm bg-white/5 px-1 text-[9px] font-bold text-white/50 uppercase"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function BuildCreator() {
  const { profile, activeCharacterId } = useProfile()
  const [builds, setBuilds] = useState<Build[]>(() => loadBuilds())
  const [editing, setEditing] = useState<Build | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    saveBuilds(builds)
  }, [builds])

  // Every item the user could pick from — character inventory + equipment + vault.
  const allItems = useMemo(() => {
    const out: DestinyItemComponent[] = []
    if (!profile.data) return out
    const p = profile.data
    out.push(...(p.profileInventory?.data?.items ?? []))
    for (const c of Object.values(p.characterInventories?.data ?? {})) {
      out.push(...c.items)
    }
    for (const c of Object.values(p.characterEquipment?.data ?? {})) {
      out.push(...c.items)
    }
    return out
  }, [profile.data])

  const byBucket = useCallback(
    (bucketHash: number) =>
      allItems.filter((it) => it.bucketHash === bucketHash),
    [allItems]
  )

  const kineticItems = useMemo(() => byBucket(Buckets.Kinetic), [byBucket])
  const energyItems = useMemo(() => byBucket(Buckets.Energy), [byBucket])
  const powerItems = useMemo(() => byBucket(Buckets.Power), [byBucket])
  const helmetItems = useMemo(() => byBucket(Buckets.Helmet), [byBucket])
  const armsItems = useMemo(() => byBucket(Buckets.Arms), [byBucket])
  const chestItems = useMemo(() => byBucket(Buckets.Chest), [byBucket])
  const legsItems = useMemo(() => byBucket(Buckets.Legs), [byBucket])
  const classItems = useMemo(() => byBucket(Buckets.ClassItem), [byBucket])

  // Instance-id → itemHash map so we can resolve the subclass item equipped.
  const instanceMap = useMemo(() => {
    const map = new Map<string, { itemHash: number; bucketHash?: number }>()
    if (!profile.data) return map
    const push = (
      items?: {
        itemHash: number
        itemInstanceId?: string
        bucketHash?: number
      }[]
    ) => {
      for (const it of items ?? []) {
        if (it.itemInstanceId) {
          map.set(it.itemInstanceId, {
            itemHash: it.itemHash,
            bucketHash: it.bucketHash,
          })
        }
      }
    }
    push(profile.data.profileInventory?.data?.items)
    for (const c of Object.values(
      profile.data.characterInventories?.data ?? {}
    ))
      push(c.items)
    for (const c of Object.values(profile.data.characterEquipment?.data ?? {}))
      push(c.items)
    return map
  }, [profile.data])

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const newBlank = () => {
    const now = Date.now()
    const b: Build = {
      v: 2,
      id: newBuildId(),
      name: "Nouveau build",
      description: "",
      className: "Titan",
      subclass: "Solaire",
      tags: [],
      weapons: {},
      armor: {},
      subclassPlugs: [],
      createdAt: now,
      updatedAt: now,
    }
    setBuilds((bs) => [b, ...bs])
    setEditing(b)
    toast.success("Nouveau build créé")
  }

  const captureCurrent = () => {
    if (!activeCharacterId) {
      toast.error("Aucun personnage actif")
      return
    }
    const equip =
      profile.data?.characterEquipment?.data?.[activeCharacterId]?.items ?? []
    const getEquipped = (bucket: number) =>
      equip.find((it) => it.bucketHash === bucket)
    const char = profile.data?.characters?.data?.[activeCharacterId]
    const className: ClassType =
      char?.classType != null
        ? (CLASS_BY_INT[char.classType] ?? "Titan")
        : "Titan"

    const subclassItem = getEquipped(Buckets.Subclass)
    const subclassHash = subclassItem?.itemHash

    // Resolve equipped loadout to pull subclass plugs if available.
    const loadouts =
      profile.data?.characterLoadouts?.data?.[activeCharacterId]?.loadouts ?? []
    let subclassPlugs: number[] = []
    if (subclassItem?.itemInstanceId) {
      // Use the current subclass's plugs from itemComponents.sockets if available
      const sockets =
        profile.data?.itemComponents?.sockets?.data?.[
          subclassItem.itemInstanceId
        ]?.sockets ?? []
      subclassPlugs = sockets
        .map((s) => s.plugHash)
        .filter((h): h is number => typeof h === "number")
    }
    // Fallback: check if any loadout has the same subclass item and read its plugs
    if (subclassPlugs.length === 0 && subclassItem?.itemInstanceId) {
      for (const l of loadouts) {
        const sc = l.items?.[8]
        if (sc?.itemInstanceId === subclassItem.itemInstanceId) {
          subclassPlugs = sc.plugItemHashes ?? []
          break
        }
      }
    }

    const now = Date.now()
    const b: Build = {
      v: 2,
      id: newBuildId(),
      name: `Capture · ${new Date(now).toLocaleDateString()}`,
      description: "Construit à partir de l'équipement actuel.",
      className,
      subclass: "Solaire", // TODO: derive from subclassItem damageType (needs def lookup)
      tags: ["capture"],
      weapons: {
        kinetic: getEquipped(Buckets.Kinetic)?.itemHash,
        energy: getEquipped(Buckets.Energy)?.itemHash,
        power: getEquipped(Buckets.Power)?.itemHash,
      },
      armor: {
        helmet: getEquipped(Buckets.Helmet)?.itemHash,
        arms: getEquipped(Buckets.Arms)?.itemHash,
        chest: getEquipped(Buckets.Chest)?.itemHash,
        legs: getEquipped(Buckets.Legs)?.itemHash,
        class: getEquipped(Buckets.ClassItem)?.itemHash,
      },
      subclassHash,
      subclassPlugs,
      createdAt: now,
      updatedAt: now,
    }
    setBuilds((bs) => [b, ...bs])
    setEditing(b)
    toast.success("Équipement capturé")
    // Mark variables as intentionally used (instanceMap enrichment reserved for future).
    void instanceMap
    void SUBCLASS_BY_DAMAGE
  }

  const update = (patch: Partial<Build>) => {
    if (!editing) return
    const next = { ...editing, ...patch, updatedAt: Date.now() }
    setEditing(next)
    setBuilds((bs) => bs.map((b) => (b.id === next.id ? next : b)))
  }

  const remove = (id: string) => {
    setBuilds((bs) => bs.filter((b) => b.id !== id))
    if (editing?.id === id) setEditing(null)
    setDeleteConfirm(null)
    toast.info("Build supprimé")
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(builds, null, 2)], {
      type: "application/json",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "cruzer-builds.json"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Builds exportés")
  }

  const importJson = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "application/json"
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const parsed = JSON.parse(text) as Build[]
        if (!Array.isArray(parsed)) throw new Error("Format invalide")
        const valid = parsed.filter((b) => b.v === BUILD_SCHEMA_VERSION)
        setBuilds((bs) => [...valid, ...bs])
        toast.success(`${valid.length} build(s) importés`)
      } catch (e) {
        toast.error(`Import échoué : ${(e as Error).message}`)
      }
    }
    input.click()
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">🛠️ Mes builds</h2>
          <p className="text-bungie-muted mt-1 text-sm">
            Crée, sauvegarde et compare tes builds · stockés sur cette clé.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={importJson}
            className="border-bungie-border h-9 rounded-md border bg-white/5 px-3 text-xs font-bold tracking-wider text-white/85 uppercase transition-colors hover:bg-white/10"
          >
            ↓ Importer
          </button>
          <button
            onClick={exportJson}
            disabled={!builds.length}
            className="border-bungie-border h-9 rounded-md border bg-white/5 px-3 text-xs font-bold tracking-wider text-white/85 uppercase transition-colors hover:bg-white/10 disabled:opacity-40"
          >
            ↑ Exporter
          </button>
          <button
            onClick={captureCurrent}
            disabled={!activeCharacterId}
            className="bg-bungie-accent/15 hover:bg-bungie-accent/25 border-bungie-accent/40 text-bungie-accent h-9 rounded-md border px-3 text-xs font-extrabold tracking-wider uppercase transition-colors disabled:opacity-40"
            title="Créer un build depuis mon équipement actuel"
          >
            📸 Capturer
          </button>
          <button
            onClick={newBlank}
            className="bg-bungie-accent h-9 rounded-md px-3 text-xs font-extrabold tracking-wider text-black uppercase transition hover:brightness-110"
          >
            + Nouveau build
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid gap-5 lg:grid-cols-[minmax(260px,340px)_1fr]">
        {/* Sidebar */}
        <div className="space-y-2">
          {builds.length === 0 ? (
            <div className="panel text-bungie-muted p-4 text-center text-sm">
              Aucun build. Clique « + Nouveau build » ou « 📸 Capturer » pour
              démarrer.
            </div>
          ) : (
            builds.map((b) => (
              <BuildRow
                key={b.id}
                build={b}
                selected={editing?.id === b.id}
                onSelect={() => setEditing(b)}
              />
            ))
          )}
        </div>

        {/* Editor */}
        {editing ? (
          <BuildEditor
            build={editing}
            onUpdate={update}
            onDelete={() => setDeleteConfirm(editing.id)}
            pickers={{
              kinetic: kineticItems,
              energy: energyItems,
              power: powerItems,
              helmet: helmetItems,
              arms: armsItems,
              chest: chestItems,
              legs: legsItems,
              classItem: classItems,
            }}
          />
        ) : (
          <div
            className="flex flex-col items-center gap-3 rounded-lg p-10 text-center text-white/45"
            style={{
              background: "rgba(7,7,13,0.4)",
              border: "1px dashed rgba(255,255,255,0.1)",
            }}
          >
            <div className="text-4xl opacity-30">🛠️</div>
            <div className="text-sm">
              Sélectionne un build dans la liste ou crée-en un nouveau.
            </div>
          </div>
        )}
      </div>

      {deleteConfirm && (
        <ConfirmDialog
          open
          title="Supprimer ce build ?"
          message="Cette action est irréversible."
          confirmLabel="Supprimer"
          cancelLabel="Annuler"
          variant="danger"
          onConfirm={() => remove(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// BuildEditor — right-side form
// ---------------------------------------------------------------------------

interface PickerSets {
  kinetic: DestinyItemComponent[]
  energy: DestinyItemComponent[]
  power: DestinyItemComponent[]
  helmet: DestinyItemComponent[]
  arms: DestinyItemComponent[]
  chest: DestinyItemComponent[]
  legs: DestinyItemComponent[]
  classItem: DestinyItemComponent[]
}

function BuildEditor({
  build,
  onUpdate,
  onDelete,
  pickers,
}: {
  build: Build
  onUpdate: (patch: Partial<Build>) => void
  onDelete: () => void
  pickers: PickerSets
}) {
  const col = SUBCLASS_COLOR[build.subclass]

  return (
    <div
      className="space-y-5 rounded-lg p-5"
      style={{
        background:
          "linear-gradient(160deg, rgba(20,12,30,0.7), rgba(7,7,13,0.5))",
        border: "1px solid rgba(243,7,94,0.2)",
      }}
    >
      {/* Identity */}
      <div className="flex items-center gap-3">
        <input
          value={build.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="border-bungie-border focus:border-bungie-accent h-10 flex-1 rounded-md border bg-black/30 px-3 text-lg font-bold text-white focus:outline-none"
          placeholder="Nom du build"
        />
        <button
          onClick={onDelete}
          className="h-10 rounded-md border border-red-500/40 bg-red-500/10 px-3 text-xs font-bold text-red-300 hover:bg-red-500/20"
        >
          Supprimer
        </button>
      </div>

      {/* Class + Subclass */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-extrabold tracking-widest text-white/55 uppercase">
            Classe
          </label>
          <div className="mt-1 grid grid-cols-3 gap-1">
            {(["Titan", "Chasseur", "Arcaniste"] as ClassType[]).map((c) => (
              <button
                key={c}
                onClick={() => onUpdate({ className: c })}
                className={`h-9 rounded-md border text-xs font-bold tracking-wider uppercase transition-colors ${
                  build.className === c
                    ? "bg-bungie-accent/20 border-bungie-accent text-white"
                    : "border-bungie-border bg-white/5 text-white/70 hover:border-white/30"
                }`}
              >
                {CLASS_ICON[c]} {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-extrabold tracking-widest text-white/55 uppercase">
            Sous-classe
          </label>
          <div className="mt-1 grid grid-cols-3 gap-1">
            {(Object.keys(SUBCLASS_COLOR) as Subclass[]).map((s) => (
              <button
                key={s}
                onClick={() => onUpdate({ subclass: s })}
                className="h-9 rounded-md border text-xs font-bold tracking-wider uppercase transition-colors"
                style={{
                  background:
                    build.subclass === s
                      ? `${SUBCLASS_COLOR[s]}25`
                      : "rgba(255,255,255,0.04)",
                  borderColor:
                    build.subclass === s
                      ? SUBCLASS_COLOR[s]
                      : "rgba(255,255,255,0.15)",
                  color:
                    build.subclass === s ? "#fff" : "rgba(255,255,255,0.7)",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-[10px] font-extrabold tracking-widest text-white/55 uppercase">
          Description / synergies
        </label>
        <textarea
          value={build.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          rows={3}
          className="border-bungie-border focus:border-bungie-accent mt-1 w-full resize-none rounded-md border bg-black/30 px-3 py-2 text-[13px] text-white focus:outline-none"
          placeholder="Comment ce build fonctionne, boucle de gameplay, situations idéales…"
        />
      </div>

      {/* Weapons */}
      <Panel title="Armes" accent={col}>
        <div className="grid gap-2 md:grid-cols-3">
          <ItemChip
            label="Cinétique"
            bucketLabel="Cinétique"
            hash={build.weapons.kinetic}
            onPick={(h) =>
              onUpdate({ weapons: { ...build.weapons, kinetic: h } })
            }
            items={pickers.kinetic}
          />
          <ItemChip
            label="Énergie"
            bucketLabel="Énergie"
            hash={build.weapons.energy}
            onPick={(h) =>
              onUpdate({ weapons: { ...build.weapons, energy: h } })
            }
            items={pickers.energy}
          />
          <ItemChip
            label="Lourde"
            bucketLabel="Lourde"
            hash={build.weapons.power}
            onPick={(h) =>
              onUpdate({ weapons: { ...build.weapons, power: h } })
            }
            items={pickers.power}
          />
        </div>
      </Panel>

      {/* Armor */}
      <Panel title="Armure" accent={col}>
        <div className="grid gap-2 md:grid-cols-5">
          <ItemChip
            label="Casque"
            bucketLabel="Casque"
            hash={build.armor.helmet}
            onPick={(h) => onUpdate({ armor: { ...build.armor, helmet: h } })}
            items={pickers.helmet}
          />
          <ItemChip
            label="Bras"
            bucketLabel="Bras"
            hash={build.armor.arms}
            onPick={(h) => onUpdate({ armor: { ...build.armor, arms: h } })}
            items={pickers.arms}
          />
          <ItemChip
            label="Torse"
            bucketLabel="Torse"
            hash={build.armor.chest}
            onPick={(h) => onUpdate({ armor: { ...build.armor, chest: h } })}
            items={pickers.chest}
          />
          <ItemChip
            label="Jambes"
            bucketLabel="Jambes"
            hash={build.armor.legs}
            onPick={(h) => onUpdate({ armor: { ...build.armor, legs: h } })}
            items={pickers.legs}
          />
          <ItemChip
            label="Classe"
            bucketLabel="Objet de classe"
            hash={build.armor.class}
            onPick={(h) => onUpdate({ armor: { ...build.armor, class: h } })}
            items={pickers.classItem}
          />
        </div>
      </Panel>

      {/* Tags */}
      <Panel title="Tags" accent={col}>
        <div className="flex flex-wrap items-center gap-1.5">
          {build.tags.map((v, i) => (
            <Chip
              key={i}
              value={v}
              onRemove={() =>
                onUpdate({ tags: build.tags.filter((_, j) => j !== i) })
              }
            />
          ))}
          <input
            placeholder="+ PvE, Raid, GM, Contest…"
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.currentTarget.value.trim()) {
                const v = e.currentTarget.value.trim()
                onUpdate({ tags: [...build.tags, v] })
                e.currentTarget.value = ""
              }
            }}
            className="border-bungie-border focus:border-bungie-accent h-7 min-w-45 rounded-md border bg-black/30 px-2 text-[11px] text-white focus:outline-none"
          />
        </div>
      </Panel>

      {/* Footer meta */}
      <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[10px] font-bold tracking-widest text-white/30 uppercase">
        <span>ID · {build.id}</span>
        <span>Maj · {new Date(build.updatedAt).toLocaleString()}</span>
      </div>
    </div>
  )
}

function Panel({
  title,
  accent,
  children,
}: {
  title: string
  accent: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <div className="h-4 w-1 rounded-sm" style={{ background: accent }} />
        <label className="text-[10px] font-extrabold tracking-widest text-white/55 uppercase">
          {title}
        </label>
      </div>
      {children}
    </div>
  )
}
