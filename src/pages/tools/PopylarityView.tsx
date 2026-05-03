import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconScope, IconList, IconChart } from "@/components/icon";

type Section = "weapons" | "pve" | "exotics";

const SECTIONS: { key: Section; label: string; url: string; icon: React.ReactNode; desc: string }[] = [
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
];

async function openExternal(url: string) {
  try {
    const { open } = await import("@tauri-apps/plugin-shell");
    await open(url);
  } catch {
    window.open(url, "_blank");
  }
}

export function PopularityView() {
  const { t } = useTranslation();
  const [active, setActive] = useState<Section>("weapons");
  const current = SECTIONS.find((s) => s.key === active)!;
  const [frameKey, setFrameKey] = useState(0);
  const [frameBlocked, setFrameBlocked] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs">
        <Link to="/tools" className="text-bungie-muted hover:text-white">
          ← {t("nav.tools")}
        </Link>
      </div>

      {/* Hero */}
      <div className="panel p-5 border border-bungie-accent/40 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-bungie-accent">
            Popularity Report
          </div>
          <h1 className="text-3xl font-bold leading-tight mt-1">Meta Destiny 2</h1>
          <p className="text-sm text-bungie-muted mt-2 max-w-xl">
            Statistiques d'usage des armes, activités et exotiques — données
            agrégées par popularity.report.
          </p>
        </div>
        <button
          onClick={() => openExternal(current.url)}
          className="h-9 px-4 rounded-full bg-bungie-accent text-black font-bold text-xs hover:brightness-110 transition flex items-center gap-2"
        >
          Ouvrir dans le navigateur ↗
        </button>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 p-1 bg-black/30 border border-bungie-border rounded-full w-fit">
        {SECTIONS.map((s) => {
          const a = active === s.key;
          return (
            <button
              key={s.key}
              onClick={() => {
                setActive(s.key);
                setFrameKey((k) => k + 1);
                setFrameBlocked(false);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                a
                  ? "bg-white/10 text-white border border-white/10"
                  : "text-bungie-text/70 hover:text-white"
              }`}
            >
              {s.icon}
              {s.label}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-bungie-muted">{current.desc}</p>

      {/* Embedded iframe — fallback to external button if site blocks framing. */}
      {!frameBlocked ? (
        <div className="panel p-0 overflow-hidden border border-bungie-border/80">
          <iframe
            key={frameKey}
            src={current.url}
            title="Popularity Report"
            className="w-full"
            style={{ height: "calc(100vh - 260px)", minHeight: "600px", border: 0 }}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            referrerPolicy="no-referrer"
            onError={() => setFrameBlocked(true)}
          />
        </div>
      ) : (
        <div className="panel p-10 text-center space-y-3">
          <p className="text-bungie-muted text-sm">
            Le site bloque l'intégration iframe. Ouvre-le dans le navigateur.
          </p>
          <button
            onClick={() => openExternal(current.url)}
            className="h-9 px-4 rounded-full bg-bungie-accent text-black font-bold text-xs"
          >
            Ouvrir popularity.report ↗
          </button>
        </div>
      )}
    </div>
  );
}