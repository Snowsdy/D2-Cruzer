import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import type { ReactElement } from "react"
import {
  IconInventory,
  IconScope,
  IconShield,
  IconChart,
  IconCheck,
  IconGlobe,
  IconStar,
  IconPackage,
  IconNewspaper,
  IconUser,
  IconList,
} from "@/components/icon"

interface Tool {
  name: string
  description: string
  to: string
  accent: string
  icon: ReactElement
  subtitle?: string
}

interface Category {
  id: string
  icon: ReactElement
  tools: Tool[]
}

const CATEGORIES: Category[] = [
  {
    id: "inventory",
    icon: <IconInventory size={18} />,
    tools: [
      {
        name: "Inventaire DIM",
        to: "/inventory",
        description:
          "Transfert, loadouts, doublons, max power — entièrement intégrés",
        accent: "cyan",
        icon: <IconInventory size={28} />,
        subtitle: "Destiny Item Manager",
      },
    ],
  },
  {
    id: "weapons",
    icon: <IconScope size={18} />,
    tools: [
      {
        name: "Rolls & armes",
        to: "/inventory/rolls",
        description: "Tes armes avec rolls + recherche par perks",
        accent: "cyan",
        icon: <IconScope size={28} />,
        subtitle: "Light.gg style — local",
      },
    ],
  },
  {
    id: "armor",
    icon: <IconShield size={18} />,
    tools: [
      {
        name: "Optimiseur d'armure",
        to: "/inventory/armor",
        description: "Optimisation stats cible par build — algorithme local",
        accent: "violet",
        icon: <IconShield size={28} />,
        subtitle: "D2ArmorPicker style",
      },
    ],
  },
  {
    id: "stats",
    icon: <IconChart size={18} />,
    tools: [
      {
        name: "Statistiques Destiny 2",
        to: "/tools/stats",
        description:
          "Épreuves d'Osiris · Bannière de fer · Nuit Noire · Épreuve · Gambit — toutes les stats au même endroit",
        accent: "violet",
        icon: <IconChart size={28} />,
        subtitle: "Stats unifiées · PvP + PvE",
      },
      {
        name: "Rapports raids & donjons",
        to: "/reports",
        description: "Tags Solo / Duo / Trio / Flawless calculés via PGCR",
        accent: "cyan",
        icon: <IconList size={28} />,
        subtitle: "Raid & Dungeon Report",
      },
      {
        name: "Meta · Popularity",
        to: "/tools/meta",
        description: "Usage armes, exotiques et activités — popularity.report",
        accent: "cyan",
        icon: <IconScope size={28} />,
        subtitle: "Community stats",
      },
    ],
  },
  {
    id: "checklist",
    icon: <IconCheck size={18} />,
    tools: [
      {
        name: "Xûr — Agent des Neuf",
        to: "/tools/xur",
        description: "Stock en direct vendredi → mardi (17:00 UTC)",
        accent: "amber",
        icon: <IconStar size={28} />,
        subtitle: "Where is Xûr",
      },
      {
        name: "Checklist hebdo",
        to: "/checklist",
        description: "Reset quotidien/hebdo, quêtes, triomphes",
        accent: "cyan",
        icon: <IconCheck size={28} />,
        subtitle: "Braytech style",
      },
      {
        name: "Commandants & bounties",
        to: "/tools/vendors",
        description:
          "Bounties Zavala, Shaxx, Drifter, Banshee — refresh quotidien",
        accent: "cyan",
        icon: <IconUser size={28} />,
        subtitle: "Vanguard · Épreuve · Gambit",
      },
    ],
  },
  {
    id: "community",
    icon: <IconGlobe size={18} />,
    tools: [
      {
        name: "Checkpoints",
        to: "/reports",
        description:
          "Bots D2Checkpoint intégrés avec auto-join en jeu via /rejoindre",
        accent: "cyan",
        icon: <IconPackage size={28} />,
        subtitle: "D2Checkpoint",
      },
      {
        name: "Actualités Bungie",
        to: "/news",
        description: "Annonces Bungie.net + flux Marathon intégrés",
        accent: "cyan",
        icon: <IconNewspaper size={28} />,
        subtitle: "Bungie News",
      },
    ],
  },
]

const ACCENT_CLASSES: Record<
  string,
  { text: string; border: string; shadow: string; glow: string }
> = {
  amber: {
    text: "text-amber-300",
    border: "border-amber-500/40 hover:border-amber-400",
    shadow: "hover:shadow-[0_0_24px_rgba(251,191,36,0.25)]",
    glow: "bg-amber-400/10",
  },
  cyan: {
    text: "text-pink-300",
    border: "border-pink-500/40 hover:border-pink-400",
    shadow: "hover:shadow-[0_0_24px_rgba(255,61,130,0.25)]",
    glow: "bg-pink-400/10",
  },
  emerald: {
    text: "text-emerald-300",
    border: "border-emerald-500/40 hover:border-emerald-400",
    shadow: "hover:shadow-[0_0_24px_rgba(52,211,153,0.25)]",
    glow: "bg-emerald-400/10",
  },
  violet: {
    text: "text-pink-300",
    border: "border-pink-500/40 hover:border-pink-400",
    shadow: "hover:shadow-[0_0_24px_rgba(255,61,130,0.25)]",
    glow: "bg-pink-400/10",
  },
  orange: {
    text: "text-orange-300",
    border: "border-orange-500/40 hover:border-orange-400",
    shadow: "hover:shadow-[0_0_24px_rgba(251,146,60,0.25)]",
    glow: "bg-orange-400/10",
  },
}

function ToolCard({ tool, t }: { tool: Tool; t: (key: string) => string }) {
  const cls = ACCENT_CLASSES[tool.accent] ?? ACCENT_CLASSES.cyan
  return (
    <Link
      to={tool.to}
      className={`group bg-bungie-panel/80 relative overflow-hidden rounded-xl border-2 p-4 transition-all hover:-translate-y-0.5 ${cls.border} ${cls.shadow}`}
    >
      <div
        className={`absolute top-0 right-0 h-20 w-20 ${cls.glow} rounded-full blur-2xl`}
      />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-2">
          <div
            className={`h-12 w-12 rounded-lg border-2 ${cls.border.split(" ")[0]} flex items-center justify-center bg-black/70 ${cls.text}`}
          >
            {tool.icon}
          </div>
          <span className="bg-bungie-accent/20 text-bungie-accent border-bungie-accent/40 rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase">
            {t("tools.badgeNative")}
          </span>
        </div>
        <div className="mt-2 leading-tight font-bold text-white">
          {tool.name}
        </div>
        {tool.subtitle && (
          <div
            className={`mt-0.5 text-[10px] tracking-widest uppercase ${cls.text}/80`}
          >
            {tool.subtitle}
          </div>
        )}
        <div className="text-bungie-muted mt-2 line-clamp-2 flex-1 text-xs">
          {tool.description}
        </div>
        <div className={`text-[10px] ${cls.text} mt-3 font-semibold`}>
          {t("tools.openNative")} →
        </div>
      </div>
    </Link>
  )
}

export function Tools() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState("")

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return CATEGORIES.map((cat) => ({
      ...cat,
      tools: cat.tools.filter(
        (tool) =>
          !q ||
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          (tool.subtitle?.toLowerCase().includes(q) ?? false)
      ),
    })).filter((c) => c.tools.length > 0)
  }, [filter])

  const totalCount = CATEGORIES.reduce((acc, c) => acc + c.tools.length, 0)

  return (
    <div className="max-w-6xl space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("nav.tools")}</h1>
          <p className="text-bungie-muted mt-1 text-sm">
            {t("tools.subtitle")}
          </p>
        </div>
        <input
          type="search"
          placeholder={t("tools.search")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-bungie-panel/60 border-bungie-border focus:border-bungie-accent/60 w-64 rounded-full border px-4 py-2 text-sm focus:outline-none"
        />
      </div>

      <section className="border-bungie-accent/50 from-bungie-accent/10 relative rounded-2xl border-2 bg-linear-to-br via-pink-500/5 to-transparent p-6 shadow-[0_0_40px_rgba(245,166,35,0.08)]">
        <div className="bg-bungie-bg border-bungie-accent/60 absolute -top-3 left-6 rounded-full border px-3 py-1">
          <span className="text-bungie-accent text-[10px] font-bold tracking-widest uppercase">
            ★ {t("tools.nativeBadge")}
          </span>
        </div>

        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3 pt-1">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <span className="text-bungie-accent">✦</span>
              <span>{t("tools.native")}</span>
            </h2>
            <p className="text-bungie-muted mt-1 text-xs">
              {t("tools.nativeHint")}
            </p>
          </div>
          <span className="bg-bungie-accent/15 border-bungie-accent/40 text-bungie-accent rounded-full border px-2 py-1 text-xs font-semibold">
            {totalCount} {t("tools.nativeShort")}
          </span>
        </div>

        <div className="space-y-6">
          {filtered.map((cat) => (
            <section key={cat.id}>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <span className="text-bungie-accent/90">{cat.icon}</span>
                <span>{t(`tools.category.${cat.id}`)}</span>
                <span className="text-bungie-muted text-xs">
                  ({cat.tools.length})
                </span>
              </h3>
              <div className="stagger grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {cat.tools.map((tool) => (
                  <ToolCard key={tool.to} tool={tool} t={t} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  )
}
