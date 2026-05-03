import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MetaBuilds } from "@/pages/dashboard/MetaBuilds";
import { BuildCreator } from "./BuildCreator";

type Tab = "mine" | "meta";

export function Builds() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("mine");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("nav.builds")}</h1>
        <p className="text-bungie-muted text-sm mt-1">{t("builds.subtitle")}</p>
      </div>

      <div className="flex gap-1 p-1 bg-black/30 border border-bungie-border rounded-full w-fit">
        {[
          { key: "mine" as const, label: "Mes builds" },
          { key: "meta" as const, label: "Meta communauté" },
        ].map((it) => (
          <button
            key={it.key}
            onClick={() => setTab(it.key)}
            className={`px-4 h-8 rounded-full text-xs font-bold transition-all ${
              tab === it.key
                ? "bg-bungie-accent text-black shadow-glow"
                : "text-bungie-text/70 hover:text-white"
            }`}
          >
            {it.label}
          </button>
        ))}
      </div>

      {tab === "mine" ? <BuildCreator /> : <MetaBuilds />}
    </div>
  );
}