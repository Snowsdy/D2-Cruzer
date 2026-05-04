import { useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { IconScope, IconList, IconChart } from "@/components/icon"

type Section = "weapons" | "pve" | "exotics"

const SECTIONS: {
  key: Section
  label: string
  url: string
  icon: React.ReactNode
  desc: string
}[] = [
  {
    key: "weapons",
    label: "Armes Épreuve",
    url: "https://popularity.report/",
    icon: <IconScope size={18} />,
    desc: "Top 100 armes Épreuve par usage, taux de victoire, K/D",
  },
  {
    key: "pve",
    label: "Activités PvE",
    url: "https://popularity.report/pve",
    icon: <IconList size={18} />,
    desc: "Raids, donjons, Grandmasters : runs par semaine",
  },
  {
    key: "exotics",
    label: "Exotiques",
    url: "https://popularity.report/exotics",
    icon: <IconChart size={18} />,
    desc: "Usage des exotiques par classe et mode",
  },
]

async function openExternal(url: string) {
  try {
    const { openUrl } = await import("@tauri-apps/plugin-opener")
    await openUrl(url)
  } catch {
    window.open(url, "_blank")
  }
}

export function PopularityView() {
  const { t } = useTranslation()
  const [active, setActive] = useState<Section>("weapons")
  const current = SECTIONS.find((s) => s.key === active)!
  const [frameKey, setFrameKey] = useState(0)
  const [frameBlocked, setFrameBlocked] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs">
        <Link to="/tools" className="text-bungie-muted hover:text-white">
          ← {t("nav.tools")}
        </Link>
      </div>

      {/* Hero */}
      <div className="panel border-bungie-accent/40 flex flex-wrap items-start justify-between gap-4 border p-5">
        <div>
          <div className="text-bungie-accent text-[10px] tracking-widest uppercase">
            Popularity Report
          </div>
          <h1 className="mt-1 text-3xl leading-tight font-bold">
            Meta Destiny 2
          </h1>
          <p className="text-bungie-muted mt-2 max-w-xl text-sm">
            Statistiques d'usage des armes, activités et exotiques — données
            agrégées par popularity.report.
          </p>
        </div>
        <button
          onClick={() => openExternal(current.url)}
          className="bg-bungie-accent flex h-9 items-center gap-2 rounded-full px-4 text-xs font-bold text-black transition hover:brightness-110"
        >
          Ouvrir dans le navigateur ↗
        </button>
      </div>

      {/* Section tabs */}
      <div className="border-bungie-border flex w-fit gap-1 rounded-full border bg-black/30 p-1">
        {SECTIONS.map((s) => {
          const a = active === s.key
          return (
            <button
              key={s.key}
              onClick={() => {
                setActive(s.key)
                setFrameKey((k) => k + 1)
                setFrameBlocked(false)
              }}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                a
                  ? "border border-white/10 bg-white/10 text-white"
                  : "text-bungie-text/70 hover:text-white"
              }`}
            >
              {s.icon}
              {s.label}
            </button>
          )
        })}
      </div>

      <p className="text-bungie-muted text-xs">{current.desc}</p>

      {/* Embedded iframe — fallback to external button if site blocks framing. */}
      {!frameBlocked ? (
        <div className="panel border-bungie-border/80 overflow-hidden border p-0">
          <iframe
            key={frameKey}
            src={current.url}
            title="Popularity Report"
            className="w-full"
            style={{
              height: "calc(100vh - 260px)",
              minHeight: "600px",
              border: 0,
            }}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            referrerPolicy="no-referrer"
            onError={() => setFrameBlocked(true)}
          />
        </div>
      ) : (
        <div className="panel space-y-3 p-10 text-center">
          <p className="text-bungie-muted text-sm">
            Le site bloque l'intégration iframe. Ouvre-le dans le navigateur.
          </p>
          <button
            onClick={() => openExternal(current.url)}
            className="bg-bungie-accent h-9 rounded-full px-4 text-xs font-bold text-black"
          >
            Ouvrir popularity.report ↗
          </button>
        </div>
      )}
    </div>
  )
}
