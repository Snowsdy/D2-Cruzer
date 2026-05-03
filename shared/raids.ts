/**
 * Raid rotation pool.
 *
 * Bungie doesn't expose a clean "list of raids" endpoint, so we keep the
 * canonical roster here. The bot's `/raid` command uses it as the
 * fallback when the live milestones API doesn't surface a featured raid;
 * the app's Marathon/Destiny hub lists it in the raid picker.
 *
 * Each entry includes hashes for milestone + record lookups so UI layers
 * can join against the manifest without redefining their own tables.
 */

export interface RaidMeta {
  /** Short slug used in URLs + keys. */
  key: string
  /** Display name (EN; localised via manifest when possible). */
  name: string
  destination: string
  /** Encounter list in order. */
  encounters: string[]
  /** Hash for the aggregate completion record
   *  (`DestinyRecordDefinition`). */
  completionRecordHash?: number
}

export const RAIDS: RaidMeta[] = [
  {
    key: "last-wish",
    name: "Last Wish",
    destination: "Dreaming City",
    encounters: ["Kalli", "Shuro Chi", "Morgeth", "Vault", "Riven"],
    completionRecordHash: 3899933775,
  },
  {
    key: "garden-of-salvation",
    name: "Garden of Salvation",
    destination: "Black Garden",
    encounters: [
      "Evade the Consecrated Mind",
      "Summit",
      "Consecrated Mind",
      "Sanctified Mind",
    ],
    completionRecordHash: 2065138144,
  },
  {
    key: "deep-stone-crypt",
    name: "Deep Stone Crypt",
    destination: "Europa · Crypt",
    encounters: ["Desolation", "Atraks-1", "Rapture", "Taniks"],
    completionRecordHash: 1528281896,
  },
  {
    key: "vault-of-glass",
    name: "Vault of Glass",
    destination: "Venus · Ishtar Sink",
    encounters: ["Opening", "Templar", "Gorgons", "Gatekeepers", "Atheon"],
    completionRecordHash: 1009016453,
  },
  {
    key: "vow-of-the-disciple",
    name: "Vow of the Disciple",
    destination: "Savathûn's Throne World",
    encounters: ["Acquisition", "Caretaker", "Exhibition", "Rhulk"],
    completionRecordHash: 3098333104,
  },
  {
    key: "kings-fall",
    name: "King's Fall",
    destination: "Dreadnaught",
    encounters: ["Totems", "Warpriest", "Golgoroth", "Daughters", "Oryx"],
    completionRecordHash: 2712317338,
  },
  {
    key: "root-of-nightmares",
    name: "Root of Nightmares",
    destination: "Neomuna · Essence",
    encounters: ["Cataclysm", "Scission", "Macrocosm", "Nezarec"],
    completionRecordHash: 2682590121,
  },
  {
    key: "crotas-end",
    name: "Crota's End",
    destination: "Moon · Hellmouth",
    encounters: ["Abyss", "Bridge", "Deathsinger", "Crota"],
    completionRecordHash: 2800817309,
  },
  {
    key: "salvations-edge",
    name: "Salvation's Edge",
    destination: "Pale Heart",
    encounters: ["Substratum", "Herald", "Verity", "Witness"],
    completionRecordHash: 4196566271,
  },
]

/** Bungie's DestinyActivityType hash for Raid activities. */
export const RAID_ACTIVITY_TYPE_HASH = 2043403989
