import { useState } from "react"
import { useTranslation } from "react-i18next"
import { MetaBuilds } from "@/pages/dashboard/MetaBuilds"
import { BuildCreator } from "./BuildCreator"

type Tab = "mine" | "meta"

export function Builds() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>("mine")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("nav.builds")}</h1>
        <p className="text-bungie-muted mt-1 text-sm">{t("builds.subtitle")}</p>
      </div>

      <div className="border-bungie-border flex w-fit gap-1 rounded-full border bg-black/30 p-1">
        {[
          { key: "mine" as const, label: "Mes builds" },
          { key: "meta" as const, label: "Meta communauté" },
        ].map((it) => (
          <button
            key={it.key}
            onClick={() => setTab(it.key)}
            className={`h-8 rounded-full px-4 text-xs font-bold transition-all ${
              tab === it.key
                ? "bg-bungie-accent shadow-glow text-black"
                : "text-bungie-text/70 hover:text-white"
            }`}
          >
            {it.label}
          </button>
        ))}
      </div>

      {tab === "mine" ? <BuildCreator /> : <MetaBuilds />}
    </div>
  )
}
