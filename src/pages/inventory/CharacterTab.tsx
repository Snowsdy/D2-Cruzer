import { useState, type ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { CharacterView } from "./CharacterView";
import { BagSection } from "./BagSection";
import { Rolls } from "../rolls/Rolls";
import { ArmorOptimizer } from "../armor-optimizer/ArmorOptimizer";
import { IconScope, IconShield, IconUser } from "@/components/icon";
import type {
  DestinyCharacterComponent,
  DestinyItemComponent,
  DestinyItemInstanceComponent,
} from "bungie-api-ts/destiny2";
import type { StatValues } from "@/constants/stats";

interface Props {
  character: DestinyCharacterComponent;
  equipped: Map<number, DestinyItemComponent>;
  stash: Map<number, DestinyItemComponent[]>;
  itemStats: Record<string, { stats: StatValues }>;
  itemInstances: Record<string, DestinyItemInstanceComponent>;
  activeCharacterId: string;
}

type SubTab = "view" | "rolls" | "armor";

export function CharacterTab({
  character,
  equipped,
  stash,
  itemStats,
  itemInstances,
  activeCharacterId,
}: Props) {
  const { t } = useTranslation();
  const [sub, setSub] = useState<SubTab>("view");

  const subTabs: { id: SubTab; label: string; icon: ReactElement }[] = [
    { id: "view", label: t("inventory.subtab.view"), icon: <IconUser size={12} /> },
    { id: "rolls", label: t("nav.rolls"), icon: <IconScope size={12} /> },
    { id: "armor", label: t("nav.armor"), icon: <IconShield size={12} /> },
  ];

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-bungie-panel/60 border border-bungie-border rounded-full w-fit">
        {subTabs.map((s) => (
          <button
            key={s.id}
            onClick={() => setSub(s.id)}
            className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition-all ${
              sub === s.id
                ? "bg-bungie-accent text-black font-semibold"
                : "text-bungie-text/70 hover:text-white hover:bg-white/5"
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {sub === "view" && (
        <>
          <CharacterView
            character={character}
            equipped={equipped}
            itemStats={itemStats}
            itemInstances={itemInstances}
          />
          <BagSection
            title={t("inventory.bag")}
            items={stash}
            ownerCharacterId={activeCharacterId}
          />
        </>
      )}

      {sub === "rolls" && <Rolls />}

      {sub === "armor" && <ArmorOptimizer />}
    </div>
  );
}