import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useParams, NavLink } from "react-router-dom";
import { useProfile } from "../../hooks/useProfile";
import { useUiStore } from "../../store/ui";
import { ItemDetailsModal } from "./ItemDetailsModal";
import { Loadouts } from "./Loadouts";
import { Dupes } from "./Dupes";
import { MaxPower } from "./MaxPower";
import { DimGrid } from "./DimGrid";
import { Organizer } from "./Organizer";
import { CharacterTab } from "./CharacterTab";
import {
  IconGrid,
  IconUser,
  IconLightning,
  IconList,
  IconDiamond,
  IconCopy,
} from "@/components/icon";
import type { ReactElement } from "react";
import type { DestinyItemComponent } from "bungie-api-ts/destiny2";

type TabId = "overview" | "character" | "loadouts" | "organizer" | "dupes" | "maxpower";

// Plain SVG glyphs — each one matches the tab purpose directly.
const TABS: { id: TabId; key: string; icon: ReactElement }[] = [
  { id: "overview", key: "inventory.tab.overview", icon: <IconGrid size={14} /> },
  { id: "character", key: "inventory.tab.character", icon: <IconUser size={14} /> },
  { id: "loadouts", key: "inventory.tab.loadouts", icon: <IconLightning size={14} /> },
  { id: "organizer", key: "inventory.tab.organizer", icon: <IconList size={14} /> },
  { id: "maxpower", key: "inventory.tab.maxpower", icon: <IconDiamond size={14} /> },
  { id: "dupes", key: "inventory.tab.dupes", icon: <IconCopy size={14} /> },
];

export function Inventory() {
  const { t } = useTranslation();
  const { tab } = useParams<{ tab?: TabId }>();
  const active: TabId = (tab as TabId) ?? "overview";

  const { profile, activeCharacterId } = useProfile();
  const selectedItem = useUiStore((s) => s.selectedItem);
  const clearSelection = useUiStore((s) => s.selectItem);

  const { character, equipped, stash } = useMemo(() => {
    const equipped = new Map<number, DestinyItemComponent>();
    const stash = new Map<number, DestinyItemComponent[]>();
    const character =
      activeCharacterId && profile.data?.characters?.data?.[activeCharacterId];

    if (activeCharacterId && profile.data) {
      for (const it of profile.data.characterEquipment?.data?.[activeCharacterId]?.items ?? []) {
        equipped.set(it.bucketHash, it);
      }
      for (const it of profile.data.characterInventories?.data?.[activeCharacterId]?.items ?? []) {
        const arr = stash.get(it.bucketHash) ?? [];
        arr.push(it);
        stash.set(it.bucketHash, arr);
      }
    }

    return { character, equipped, stash };
  }, [profile.data, activeCharacterId]);

  const itemStats = profile.data?.itemComponents?.stats?.data ?? {};
  const itemInstances = profile.data?.itemComponents?.instances?.data ?? {};

  const tabs = (
    <div className="flex flex-wrap gap-1 p-1 bg-bungie-panel/60 border border-bungie-border rounded-full w-fit">
      {TABS.map((tDef) => (
        <NavLink
          key={tDef.id}
          to={tDef.id === "overview" ? "/inventory" : `/inventory/${tDef.id}`}
          end={tDef.id === "overview"}
          className={({ isActive }) =>
            [
              "px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 transition-all",
              isActive || (tDef.id === active && active !== "overview")
                ? "bg-bungie-accent text-black font-semibold"
                : "text-bungie-text/70 hover:text-white hover:bg-white/5",
            ].join(" ")
          }
        >
          {tDef.icon} {t(tDef.key)}
        </NavLink>
      ))}
    </div>
  );

  if (profile.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-baseline justify-between">
          <h1 className="text-3xl font-bold">{t("nav.inventory")}</h1>
          {tabs}
        </div>
        <p className="text-bungie-muted">{t("common.loading")}</p>
      </div>
    );
  }
  if (profile.error) {
    return <p className="text-red-400">{(profile.error as Error).message}</p>;
  }
  if (!character && active !== "dupes" && active !== "maxpower" && active !== "overview" && active !== "organizer") {
    return <p className="text-bungie-muted">{t("inventory.noCharacter")}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">{t("nav.inventory")}</h1>
        {tabs}
      </div>

      {active === "overview" && <DimGrid />}

      {active === "character" && character && activeCharacterId && (
        <CharacterTab
          character={character}
          equipped={equipped}
          stash={stash}
          itemStats={itemStats}
          itemInstances={itemInstances}
          activeCharacterId={activeCharacterId}
        />
      )}

      {active === "loadouts" && <Loadouts />}

      {active === "organizer" && <Organizer />}

      {active === "dupes" && <Dupes />}

      {active === "maxpower" && <MaxPower />}


      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          instance={
            selectedItem.itemInstanceId
              ? itemInstances[selectedItem.itemInstanceId]
              : undefined
          }
          stats={
            selectedItem.itemInstanceId
              ? itemStats[selectedItem.itemInstanceId]?.stats
              : undefined
          }
          onClose={() => clearSelection(null)}
        />
      )}
    </div>
  );
}