import { useMemo, useState, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { RaidsView } from "./RaidsView";
import { DungeonsView } from "./DungeonsView";
import { CheckpointsView } from "./CheckpointsView";
import { useAggregateActivities } from "@/hooks/useAggregateActivities";
import { useAccountStats } from "@/hooks/useAccountStats";
import { useManifestStore } from "@/store/manifest";
import { readStat } from "@/api/stats";
import {
  IconSparkle,
  IconVault,
  IconPackage,
} from "@/components/icon";
import { fmtDurationHMS as fmtTime } from "@/utils/format";

type Tab = "raids" | "dungeons" | "checkpoints";

interface TabDef {
  id: Tab;
  label: string;
  icon: ReactElement;
  color: string;
}

function StatCard({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
  icon?: ReactElement;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl p-4 bg-bungie-panel/70 border border-bungie-border hover:border-bungie-accent/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[9px] uppercase tracking-widest text-bungie-muted font-semibold">
          {label}
        </div>
        {icon && <div className="text-bungie-muted/70">{icon}</div>}
      </div>
      <div
        className={`text-2xl font-extrabold tabular-nums mt-2 leading-none ${accent ?? "text-white"}`}
      >
        {value || "—"}
      </div>
      {hint && (
        <div className="text-[10px] text-bungie-muted mt-1.5 tabular-nums">
          {hint}
        </div>
      )}
    </div>
  );
}

function ReportsOverview() {
  const { merged } = useAggregateActivities();
  const accountStats = useAccountStats();
  const manifest = useManifestStore((s) => s.manifest);

  const summary = useMemo(() => {
    const actDefs = manifest?.DestinyActivityDefinition ?? {};
    let raidClears = 0;
    let dungeonClears = 0;
    let pveClears = 0;
    let fastestRaidMs = 0;
    let fastestDungeonMs = 0;
    let bestRaidKills = 0;
    let bestDungeonKills = 0;
    const raidsPlayed = new Set<string>();
    const dungeonsPlayed = new Set<string>();

    for (const a of merged) {
      const def = actDefs[a.activityHash];
      if (!def) continue;
      const mode = def.directActivityModeType;
      const name = def.displayProperties?.name ?? "";
      if (mode === 4) {
        raidClears += a.completions;
        if (a.completions > 0) raidsPlayed.add(name);
        if (a.fastestMs > 0 && (fastestRaidMs === 0 || a.fastestMs < fastestRaidMs)) {
          fastestRaidMs = a.fastestMs;
        }
        if (a.bestKills > bestRaidKills) bestRaidKills = a.bestKills;
      } else if (mode === 82) {
        dungeonClears += a.completions;
        if (a.completions > 0) dungeonsPlayed.add(name);
        if (a.fastestMs > 0 && (fastestDungeonMs === 0 || a.fastestMs < fastestDungeonMs)) {
          fastestDungeonMs = a.fastestMs;
        }
        if (a.bestKills > bestDungeonKills) bestDungeonKills = a.bestKills;
      } else {
        pveClears += a.completions;
      }
    }

    const r = accountStats.data?.mergedAllCharacters?.results;
    const pveKills = readStat(r?.allPvE?.allTime, "kills");
    const pveTime = readStat(r?.allPvE?.allTime, "secondsPlayed");

    return {
      raidClears,
      dungeonClears,
      pveClears,
      fastestRaidMs,
      fastestDungeonMs,
      bestRaidKills,
      bestDungeonKills,
      raidActivities: raidsPlayed.size,
      dungeonActivities: dungeonsPlayed.size,
      pveKills,
      pveTime,
    };
  }, [merged, manifest, accountStats.data]);

  return (
    <div className="stagger grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        label="Raids terminés"
        value={summary.raidClears.toLocaleString()}
        hint={`${summary.raidActivities} raid${summary.raidActivities > 1 ? "s" : ""} différent${summary.raidActivities > 1 ? "s" : ""}`}
        accent="text-red-300"
      />
      <StatCard
        label="Donjons terminés"
        value={summary.dungeonClears.toLocaleString()}
        hint={`${summary.dungeonActivities} donjon${summary.dungeonActivities > 1 ? "s" : ""} différent${summary.dungeonActivities > 1 ? "s" : ""}`}
        accent="text-pink-300"
      />
      <StatCard
        label="Raid le plus rapide"
        value={fmtTime(summary.fastestRaidMs)}
        hint={summary.bestRaidKills > 0 ? `${summary.bestRaidKills} kills record` : undefined}
        accent="text-amber-300"
      />
      <StatCard
        label="Donjon le plus rapide"
        value={fmtTime(summary.fastestDungeonMs)}
        hint={summary.bestDungeonKills > 0 ? `${summary.bestDungeonKills} kills record` : undefined}
        accent="text-emerald-300"
      />
    </div>
  );
}

export function Reports() {
  const { t } = useTranslation();
  const [active, setActive] = useState<Tab>("raids");

  const tabs: TabDef[] = [
    {
      id: "raids",
      label: "Raids",
      icon: <IconSparkle size={16} />,
      color: "text-red-300",
    },
    {
      id: "dungeons",
      label: "Donjons",
      icon: <IconVault size={16} />,
      color: "text-purple-300",
    },
    {
      id: "checkpoints",
      label: "Checkpoints",
      icon: <IconPackage size={16} />,
      color: "text-pink-300",
    },
  ];

  const view: Record<Tab, ReactElement> = {
    raids: <RaidsView />,
    dungeons: <DungeonsView />,
    checkpoints: <CheckpointsView />,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">{t("reports.title")}</h1>
          <p className="text-bungie-muted text-sm mt-1">{t("reports.subtitle")}</p>
        </div>
        <div className="flex gap-1 p-1 bg-bungie-panel/60 border border-bungie-border rounded-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`px-4 py-1.5 rounded-full text-sm flex items-center gap-2 transition-all ${
                active === tab.id
                  ? `bg-bungie-accent text-black font-semibold shadow-glow`
                  : `${tab.color} hover:text-white`
              }`}
            >
              <span className="inline-flex items-center">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <ReportsOverview />
      {view[active]}
    </div>
  );
}