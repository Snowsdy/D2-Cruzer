/**
 * Dungeon rotation pool — shared by the app's dungeon picker and the
 * bot's `/dungeon` command fallback.
 */

export interface DungeonMeta {
  key: string;
  name: string;
  destination: string;
}

export const DUNGEONS: DungeonMeta[] = [
  { key: "shattered-throne", name: "Shattered Throne", destination: "Dreaming City · Ascendant" },
  { key: "pit-of-heresy", name: "Pit of Heresy", destination: "Moon · Hellmouth" },
  { key: "prophecy", name: "Prophecy", destination: "Realm of the Nine" },
  { key: "grasp-of-avarice", name: "Grasp of Avarice", destination: "Cosmodrome · Loot Cave" },
  { key: "duality", name: "Duality", destination: "Nightmare of Calus" },
  { key: "spire-of-the-watcher", name: "Spire of the Watcher", destination: "Mars · Seraph Station" },
  { key: "ghosts-of-the-deep", name: "Ghosts of the Deep", destination: "Titan · Flooded" },
  { key: "warlords-ruin", name: "Warlord's Ruin", destination: "Scorn Fortress" },
  { key: "vespers-host", name: "Vesper's Host", destination: "Icebreaker Station" },
];

/** Bungie's DestinyActivityType hash for Dungeon activities. */
export const DUNGEON_ACTIVITY_TYPE_HASH = 608898761;