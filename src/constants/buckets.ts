// Known Destiny 2 bucket hashes — https://bungie-net.github.io/multi/schema_Destiny-Entities-Inventory-DestinyInventoryComponent.html
// Grouped for DIM-like layout (weapons / armor / general).

export const Buckets = {
  // Weapons
  Kinetic: 1498876634,
  Energy: 2465295065,
  Power: 953998645,
  // Armor
  Helmet: 3448274439,
  Arms: 3551918588,
  Chest: 14239492,
  Legs: 20886954,
  ClassItem: 1585787867,
  // General equippables
  Subclass: 3284755031,
  Ghost: 4023194814,
  Sparrow: 2025709351,
  Ship: 284967655,
  Emblem: 4274335291,
  SeasonalArtifact: 1506418338,
  Finisher: 3683254069,
  // Misc / consumables (shown under "Général" in the Vault)
  Consumables: 1469714392,
  Modifications: 3313201758,
  Materials: 3865314626,
  Quests: 1345459588,
  // Vault bags
  GeneralVault: 138197802,
  // Postmaster (lost items)
  LostItems: 215593132,
} as const;

export type BucketHash = (typeof Buckets)[keyof typeof Buckets];

export const WEAPON_BUCKETS: BucketHash[] = [
  Buckets.Kinetic,
  Buckets.Energy,
  Buckets.Power,
];

export const ARMOR_BUCKETS: BucketHash[] = [
  Buckets.Helmet,
  Buckets.Arms,
  Buckets.Chest,
  Buckets.Legs,
  Buckets.ClassItem,
];

// Equippable general slots (used in character equipment views — DimGrid, CharacterTab).
export const GENERAL_BUCKETS: BucketHash[] = [
  Buckets.Subclass,
  Buckets.Ghost,
  Buckets.Sparrow,
  Buckets.Ship,
];

// Extended list used only in the Vault view — adds non-equippable stash buckets
// like consumables and materials so they appear under the "Général" filter.
export const VAULT_GENERAL_BUCKETS: BucketHash[] = [
  ...GENERAL_BUCKETS,
  Buckets.Consumables,
  Buckets.Materials,
];

export const EQUIPPED_BUCKETS: BucketHash[] = [
  ...WEAPON_BUCKETS,
  ...ARMOR_BUCKETS,
  ...GENERAL_BUCKETS,
];