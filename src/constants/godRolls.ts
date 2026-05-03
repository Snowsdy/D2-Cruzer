/**
 * Curated god-roll database. Hand-picked from current community meta (Light.gg / D2Gunsmith).
 * Each perk references a real DestinyInventoryItemDefinition hash so we can render the
 * official Bungie icon + localized name via the manifest.
 *
 * When `hash` is missing, the `name` field is shown as a plain-text fallback.
 */

export interface PerkRef {
  /** DestinyInventoryItemDefinition hash — used to pull the real perk icon. */
  hash?: number;
  /** Fallback display name (shown if the manifest can't resolve the hash). */
  name: string;
}

export interface RollRow {
  column: string; // "Canon", "Chargeur", "Perk 1", "Perk 2", "Masterwork"
  perks: PerkRef[];
}

export interface GodRoll {
  hash: number; // DestinyInventoryItemDefinition hash (weapon itself)
  nameHint: string;
  type: string;
  element: string;
  pve?: RollRow[];
  pvp?: RollRow[];
  notes?: string;
}

// ---------------------------------------------------------------------------
// Well-known perk / mag / barrel hashes — centralized so each roll stays
// readable. All hashes are DestinyInventoryItemDefinition entries.
// Source: Bungie manifest (hashes are stable across seasons).
// ---------------------------------------------------------------------------

const P = {
  // ===== Barrels =====
  FlutedBarrel: 1482024992,
  HammerForgedRifling: 3275167100,
  CorkscrewRifling: 2535939336,
  ChamberedCompensator: 2806668544,
  Smallbore: 3250034553,
  ArrowheadBrake: 1594489813,
  PolygonalRifling: 1757351242,
  ExtendedBarrel: 2091787181,
  FullBore: 1047830412,

  // ===== Magazines =====
  AlloyMagazine: 1431678320,
  AppendedMag: 1687452232,
  AccurizedRounds: 1885496402,
  RicochetRounds: 1776362904,
  HighCaliberRounds: 1561002382,
  FlaredMagwell: 2822263062,
  TacticalMag: 1171266242,
  LightMag: 2219638550,
  ExtendedMag: 3047969693,

  // ===== Damage & framing perks =====
  ExplosivePayload: 3038247973,
  TimedPayload: 1954620775,
  FullAutoTrigger: 3300816228,

  // ===== PvE staple perks =====
  Outlaw: 1168162263, // "Hors-la-loi" / FR "Seul au monde" in some games
  KillClip: 1015611457,
  Firefly: 2000295559,
  Rampage: 3425386926,
  TripleTap: 3400784728,
  Demolitionist: 3523296417,
  Frenzy: 4104185692,
  OneForAll: 4049631843,
  Subsistence: 1820235745,
  RapidHit: 247725512,
  ExplosiveLight: 3194351027,
  ClusterBomb: 1275731761,
  ChainReaction: 2031180479,
  VorpalWeapon: 1546637391,
  Incandescent: 4048029317,
  Voltshot: 2173046394,
  HealClip: 2600095587,
  DestabilizingRounds: 47981717,
  Onslaught: 4008116374,
  HeadSeeker: 460017080,
  Dragonfly: 2272927194,
  FeedingFrenzy: 2946784966,
  Slice: 3796465595,
  PerpetualMotion: 1428297954,
  AmbitiousAssassin: 2010801679,
  ThreadofAscent: 2388784544,
  EnlightenedAction: 910483022,
  EnvolveDevouring: 3738144033, // unstable

  // ===== PvP staple perks =====
  Rangefinder: 2846385770,
  ZenMoment: 2387244414,
  OpeningShot: 47698751,
  MovingTarget: 588594999,
  SnapshotSights: 957782887,
  BoxBreathing: 2551157718,
  ElementalCapacitor: 3511092054,
  Unrelenting: 3108830275,
  TunnelVision: 2946553118,
  HipFireGrip: 1866048759,

  // ===== Masterworks =====
  MW_Range: 3938774421,
  MW_Handling: 3928770367,
  MW_Reload: 1119087317,
  MW_Stability: 2452480335,
  MW_ImpactInducer: 3751912585,
};

// ---------------------------------------------------------------------------
// FR-display → hash shortcut so the roll rows stay terse.
// Any name not listed here renders as plain text (safe fallback).
// ---------------------------------------------------------------------------

const byName = (name: string, hash?: number): PerkRef => ({ name, hash });

// ---------------------------------------------------------------------------
// Curated god rolls (current meta snapshot)
// ---------------------------------------------------------------------------

export const GOD_ROLLS: GodRoll[] = [
  {
    hash: 47772649, // Fatebringer (Timelost)
    nameHint: "Fatebringer (Intemporel)",
    type: "Revolver",
    element: "Kinétique",
    pve: [
      {
        column: "Canon",
        perks: [
          byName("Moletée", P.FlutedBarrel),
          byName("Alésée", P.PolygonalRifling),
        ],
      },
      {
        column: "Chargeur",
        perks: [
          byName("Balles à effet", P.RicochetRounds),
          byName("Balles puissantes", P.HighCaliberRounds),
        ],
      },
      {
        column: "Perk 1",
        perks: [
          byName("Hors-la-loi", P.Outlaw),
          byName("Cadence rapide", P.RapidHit),
        ],
      },
      {
        column: "Perk 2",
        perks: [
          byName("Feu follet", P.Firefly),
          byName("Kill Clip", P.KillClip),
        ],
      },
      {
        column: "Masterwork",
        perks: [
          byName("Maniement", P.MW_Handling),
          byName("Rechargement", P.MW_Reload),
        ],
      },
    ],
    pvp: [
      {
        column: "Perk 1",
        perks: [
          byName("Hors-la-loi", P.Outlaw),
          byName("Télémètre", P.Rangefinder),
        ],
      },
      {
        column: "Perk 2",
        perks: [
          byName("Tir d'ouverture", P.OpeningShot),
          byName("Kill Clip", P.KillClip),
        ],
      },
    ],
  },
  {
    hash: 1294026524, // The Immortal
    nameHint: "L'Immortel",
    type: "Pistolet-mitrailleur",
    element: "Arc",
    pvp: [
      { column: "Canon", perks: [byName("Alésage", P.ChamberedCompensator)] },
      { column: "Chargeur", perks: [byName("Alésé", P.AlloyMagazine)] },
      {
        column: "Perk 1",
        perks: [
          byName("Cadence rapide", P.RapidHit),
          byName("Cible mouvante", P.MovingTarget),
        ],
      },
      {
        column: "Perk 2",
        perks: [
          byName("Fringale", P.Onslaught),
          byName("Vision tunnel", P.TunnelVision),
        ],
      },
    ],
  },
  {
    hash: 2603335652, // IKELOS SMG v1.0.3
    nameHint: "IKELOS_SMG_v1.0.3",
    type: "Pistolet-mitrailleur",
    element: "Solaire",
    pve: [
      {
        column: "Perk 1",
        perks: [
          byName("Frénésie d'abattage", P.FeedingFrenzy),
          byName("Subsistance", P.Subsistence),
        ],
      },
      {
        column: "Perk 2",
        perks: [
          byName("Harmonie", P.OneForAll),
          byName("Incandescence", P.Incandescent),
        ],
      },
    ],
  },
  {
    hash: 2126436175, // Hung Jury SR4
    nameHint: "Jury en sursis SR4",
    type: "Fusil à visée",
    element: "Kinétique",
    pve: [
      {
        column: "Canon",
        perks: [
          byName("Canon forgé", P.HammerForgedRifling),
          byName("Tire-bouchon", P.CorkscrewRifling),
        ],
      },
      {
        column: "Perk 1",
        perks: [
          byName("Triple frappe", P.TripleTap),
          byName("Hors-la-loi", P.Outlaw),
        ],
      },
      {
        column: "Perk 2",
        perks: [
          byName("Kill Clip", P.KillClip),
          byName("Feu follet", P.Firefly),
        ],
      },
    ],
  },
  {
    hash: 2907129556, // Sunshot
    nameHint: "Tir du soleil",
    type: "Revolver exotique",
    element: "Solaire",
    notes: "Exotique — perks fixes, pas de rolls aléatoires.",
  },
  {
    hash: 3549153978, // The Hothead
    nameHint: "Soupe au lait",
    type: "Lance-roquettes",
    element: "Solaire",
    pve: [
      {
        column: "Canon",
        perks: [
          byName("Frein de bouche", P.ArrowheadBrake),
          byName("Alésage", P.ChamberedCompensator),
        ],
      },
      {
        column: "Perk 1",
        perks: [
          byName("Bombes cluster", P.ClusterBomb),
          byName("Charge tressée", P.AmbitiousAssassin),
        ],
      },
      {
        column: "Perk 2",
        perks: [
          byName("Réaction en chaîne", P.ChainReaction),
          byName("Vorpal", P.VorpalWeapon),
        ],
      },
    ],
  },
  {
    hash: 3844694310, // Cataphract GL3
    nameHint: "Cataphract GL3",
    type: "Lance-grenades lourd",
    element: "Toile",
    pve: [
      {
        column: "Perk 1",
        perks: [
          byName("Envolée", P.EnlightenedAction),
          byName("Cadence rapide", P.RapidHit),
        ],
      },
      {
        column: "Perk 2",
        perks: [
          byName("Réaction en chaîne", P.ChainReaction),
          byName("Vorpal", P.VorpalWeapon),
        ],
      },
    ],
    pvp: [
      { column: "Perk 1", perks: [byName("Envolée", P.EnlightenedAction)] },
      { column: "Perk 2", perks: [byName("Vorpal", P.VorpalWeapon)] },
    ],
  },
  {
    hash: 3193598749, // Forbearance
    nameHint: "Patience",
    type: "Lance-grenades",
    element: "Arc",
    pve: [
      {
        column: "Perk 1",
        perks: [
          byName("Frénésie d'abattage", P.FeedingFrenzy),
          byName("Munitions ambitieuses", P.AmbitiousAssassin),
        ],
      },
      {
        column: "Perk 2",
        perks: [
          byName("Réaction en chaîne", P.ChainReaction),
          byName("Frénésie", P.Frenzy),
        ],
      },
    ],
  },
  {
    hash: 2288406633, // The Recluse
    nameHint: "La Recluse",
    type: "Pistolet-mitrailleur",
    element: "Vide",
    pve: [
      {
        column: "Perk 1",
        perks: [
          byName("Mouvement perpétuel", P.PerpetualMotion),
          byName("Frénésie d'abattage", P.FeedingFrenzy),
        ],
      },
      {
        column: "Perk 2",
        perks: [
          byName("Balles déstabilisantes", P.DestabilizingRounds),
          byName("Frénésie", P.Frenzy),
        ],
      },
    ],
  },
  {
    hash: 2022294213, // Whisper of the Worm
    nameHint: "Murmure du ver",
    type: "Fusil à fusion linéaire exotique",
    element: "Solaire",
    notes: "Exotique — perks fixes, munitions lourdes.",
  },
  {
    hash: 821154603, // Chattering Bone
    nameHint: "Os qui parle",
    type: "Fusil à impulsion",
    element: "Kinétique",
    pvp: [
      {
        column: "Perk 1",
        perks: [
          byName("Cadence rapide", P.RapidHit),
          byName("Mouvement perpétuel", P.PerpetualMotion),
        ],
      },
      {
        column: "Perk 2",
        perks: [
          byName("Tir d'ouverture", P.OpeningShot),
          byName("Kill Clip", P.KillClip),
        ],
      },
    ],
  },
  {
    hash: 3217480009, // Krait
    nameHint: "Krait",
    type: "Fusil automatique",
    element: "Arc",
    pve: [
      {
        column: "Perk 1",
        perks: [
          byName("Subsistance", P.Subsistence),
          byName("Mouvement perpétuel", P.PerpetualMotion),
        ],
      },
      {
        column: "Perk 2",
        perks: [
          byName("Déflagration statique", P.Voltshot),
          byName("Frénésie", P.Frenzy),
        ],
      },
    ],
  },
  {
    hash: 1363886209,
    nameHint: "Faim dévorante",
    type: "Fusil automatique",
    element: "Vide",
    pve: [
      {
        column: "Perk 1",
        perks: [
          byName("Subsistance", P.Subsistence),
          byName("Hors-la-loi", P.Outlaw),
        ],
      },
      {
        column: "Perk 2",
        perks: [
          byName("Kill Clip", P.KillClip),
          byName("Frénésie", P.Frenzy),
        ],
      },
    ],
  },
  {
    hash: 3413860062,
    nameHint: "Invocatrice",
    type: "Fusil automatique",
    element: "Solaire",
    pvp: [
      {
        column: "Perk 1",
        perks: [
          byName("Cadence rapide", P.RapidHit),
          byName("Fringale", P.Onslaught),
        ],
      },
      {
        column: "Perk 2",
        perks: [
          byName("Tir d'ouverture", P.OpeningShot),
          byName("Kill Clip", P.KillClip),
        ],
      },
    ],
  },
  {
    hash: 2742417066,
    nameHint: "Chose qui va dans la nuit",
    type: "Lance-roquettes",
    element: "Stasis",
    pve: [
      {
        column: "Perk 1",
        perks: [byName("Bombes cluster", P.ClusterBomb)],
      },
      {
        column: "Perk 2",
        perks: [
          byName("Réaction en chaîne", P.ChainReaction),
          byName("Vorpal", P.VorpalWeapon),
        ],
      },
    ],
  },
];

export const ELEMENT_COLORS: Record<string, string> = {
  Kinétique: "#cccccc",
  Solaire: "#f57a22",
  Arc: "#79bbe8",
  Vide: "#b185df",
  Stasis: "#4d88ff",
  Toile: "#35c19f",
  Prismatique: "#f0e668",
};