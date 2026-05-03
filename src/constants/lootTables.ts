// Curated loot tables for D2 raids + dungeons. Community-maintained data.
// Weapons are stored as { name, type, element? } so rendering works even
// without a manifest lookup. Hash is optional — used only to pull an icon
// from Bungie's CDN when available.

export type Element =
  | "Cinétique"
  | "Solaire"
  | "Arc"
  | "Vide"
  | "Stasis"
  | "Strand"
  | "Prismatique";

export interface WeaponDrop {
  name: string;
  type: string;
  element?: Element;
  hash?: number;
  exotic?: boolean;
}

export interface EncounterLoot {
  encounter: string;
  summary?: string;
  weapons: WeaponDrop[];
  armor?: ("helmet" | "arms" | "chest" | "legs" | "class")[];
  extras?: string[];
}

export interface ActivityGuide {
  activityHash: number;
  type: "raid" | "dungeon";
  name: string;
  shortName: string;
  year: number;
  image?: string;
  recommendedPower?: number;
  difficulties?: string[];
  featured?: boolean;
  destination?: string;
  expansion?: string;
  fireteamSize?: number;
  duration?: string;
  matchmaking?: boolean;
  seal?: string;
  secretChests?: number;
  encounters: EncounterLoot[];
  armorSet?: string;
  armorSetHashes?: Partial<
    Record<"helmet" | "arms" | "chest" | "legs" | "class", number>
  >;
  exotic?: string;
  /** ISO date (inclusive end). Activity is in "Contest Mode" until this date. */
  contestUntil?: string;
  /** ISO date of initial release — used to auto-flag "new" activities. */
  releasedAt?: string;
}

/**
 * Returns true if the activity is currently in its Contest Mode window
 * (first ~48h after release for raids, similar for dungeons).
 */
export function isContestActive(guide: ActivityGuide, now = new Date()): boolean {
  if (!guide.contestUntil) return false;
  const until = new Date(guide.contestUntil).getTime();
  return now.getTime() < until;
}

/**
 * Returns true if the activity released within the last 30 days — used to
 * display a "Nouveau" / fresh badge on recently-shipped content.
 */
export function isNewlyReleased(
  guide: ActivityGuide,
  now = new Date()
): boolean {
  if (!guide.releasedAt) return false;
  const released = new Date(guide.releasedAt).getTime();
  const diffMs = now.getTime() - released;
  return diffMs < 30 * 24 * 3600 * 1000 && diffMs >= 0;
}

// ---------------------------------------------------------------------------
// RAIDS
// ---------------------------------------------------------------------------

export const RAIDS: ActivityGuide[] = [
  {
    activityHash: 2192826039,
    type: "raid",
    name: "Salvation's Edge",
    shortName: "Salvation",
    year: 2024,
    recommendedPower: 1985,
    difficulties: ["Normal", "Maître"],
    featured: true,
    releasedAt: "2024-06-07",
    destination: "Le Témoin — Noyau prismatique",
    expansion: "The Final Shape",
    fireteamSize: 6,
    duration: "90-120 min",
    matchmaking: false,
    seal: "Intemporel",
    secretChests: 2,
    encounters: [
      {
        encounter: "Substrat",
        summary: "Préparation des piliers d'énergie Prismatique.",
        weapons: [
          { name: "Nullify", type: "Fusil à impulsion", element: "Solaire", hash: 859869931 },
          { name: "Critical Anomaly", type: "Fusil de précision", element: "Stasis", hash: 445197843 },
        ],
        armor: ["arms"],
      },
      {
        encounter: "Résidu",
        summary: "Survie face à la Forme Finale émergente.",
        weapons: [
          { name: "Summum Bonum", type: "Épée", element: "Strand", hash: 3569407878 },
          { name: "Non-Denouement", type: "Arc", element: "Stasis", hash: 1770490683 },
        ],
        armor: ["legs"],
      },
      {
        encounter: "Résonance",
        summary: "Puzzle d'alignement + DPS sur les Tormentors.",
        weapons: [
          { name: "Nullify", type: "Fusil à impulsion", element: "Solaire", hash: 859869931 },
          { name: "Imminence", type: "Pistolet-mitrailleur", element: "Arc", hash: 1258168956 },
        ],
        armor: ["class"],
      },
      {
        encounter: "Itération répétée",
        summary: "Traversée temporelle + DPS boss de phase.",
        weapons: [
          { name: "Summum Bonum", type: "Épée", element: "Strand", hash: 3569407878 },
          { name: "Forthcoming Deviance", type: "Glaive", element: "Vide", hash: 535198113 },
        ],
        armor: ["chest"],
      },
      {
        encounter: "Le Témoin",
        summary: "Combat final — drop exotique possible.",
        weapons: [
          { name: "Critical Anomaly", type: "Fusil de précision", element: "Stasis", hash: 445197843 },
          { name: "Non-Denouement", type: "Arc", element: "Stasis", hash: 1770490683 },
          { name: "Euphony", type: "Fusil à fusion linéaire", element: "Stasis", exotic: true, hash: 3284383335 },
        ],
        armor: ["helmet"],
        extras: ["Arme exotique (drop aléatoire) : Euphony"],
      },
    ],
    armorSet: "Armure Rebelle du Voyageur",
    armorSetHashes: {
      helmet: 1942311415,
      arms: 3629884836,
      chest: 3725435036,
      legs: 1265563470,
      class: 1140861969,
    },
    exotic: "Euphony — Fusion linéaire stasis",
  },
  {
    activityHash: 2381413764,
    type: "raid",
    name: "Root of Nightmares",
    shortName: "RoN",
    year: 2023,
    recommendedPower: 1780,
    difficulties: ["Normal", "Maître"],
    destination: "Neomuna — Vaisseau-pyramide",
    expansion: "Lightfall",
    fireteamSize: 6,
    duration: "30-60 min",
    matchmaking: false,
    seal: "Rêveur",
    secretChests: 2,
    encounters: [
      {
        encounter: "Cataclysme",
        summary: "Puzzle de connexions Terre/Ombre, DPS sur Scission.",
        weapons: [
          { name: "Nessa's Oblation", type: "Fusil à pompe", element: "Vide", hash: 135029084 },
          { name: "Rufus's Fury", type: "Fusil automatique", element: "Strand", hash: 484515708 },
        ],
        armor: ["legs"],
      },
      {
        encounter: "Scission",
        summary: "Élimination des acolytes refugiés.",
        weapons: [
          { name: "Koraxis's Distress", type: "Lance-grenades", element: "Solaire", hash: 2972949637 },
          { name: "Acasia's Dejection", type: "Fusil traceur", element: "Solaire", hash: 1471212226 },
        ],
        armor: ["arms"],
      },
      {
        encounter: "Macrocosme",
        summary: "Vague d'ennemis + 3 plateformes à synchroniser.",
        weapons: [
          { name: "Mykel's Reverence", type: "Arme de poing", element: "Strand", hash: 231031173 },
          { name: "Briar's Contempt", type: "Fusil à fusion linéaire", element: "Vide", hash: 1491665733 },
        ],
        armor: ["helmet"],
      },
      {
        encounter: "Nezarec, le Disciple Final",
        summary: "Boss final. Arme exotique (drop aléatoire).",
        weapons: [
          { name: "Acasia's Dejection", type: "Fusil traceur", element: "Solaire", hash: 1471212226 },
          { name: "Nessa's Oblation", type: "Fusil à pompe", element: "Vide", hash: 135029084 },
          { name: "Conditional Finality", type: "Fusil à pompe", element: "Stasis", exotic: true, hash: 3371017761 },
        ],
        armor: ["chest"],
        extras: ["Arme exotique (drop aléatoire) : Conditional Finality"],
      },
    ],
    armorSet: "Armure du Jardin des Rêves",
    armorSetHashes: {
      helmet: 4123705451,
      arms: 2445962586,
      chest: 2597227950,
      legs: 3702434452,
      class: 2915322487,
    },
    exotic: "Conditional Finality — Fusil à pompe stasis/solaire",
  },
  {
    activityHash: 4179289725,
    type: "raid",
    name: "King's Fall",
    shortName: "KF",
    year: 2022,
    recommendedPower: 1580,
    difficulties: ["Normal", "Maître"],
    destination: "Anneaux de Saturne — Dreadnaught",
    expansion: "The Witch Queen (reissue)",
    fireteamSize: 6,
    duration: "75-105 min",
    matchmaking: false,
    seal: "Régicide",
    secretChests: 2,
    encounters: [
      {
        encounter: "Régicide",
        summary: "Saut + portails + relais.",
        weapons: [
          { name: "Doom of Chelchis", type: "Fusil de reconnaissance", element: "Vide", hash: 1937552980 },
          { name: "Zaouli's Bane", type: "Revolver", element: "Solaire", hash: 431721920 },
        ],
        armor: ["arms"],
      },
      {
        encounter: "Coffret de navire",
        summary: "Secret : relic + plaques.",
        weapons: [
          { name: "Zaouli's Bane", type: "Revolver", element: "Solaire", hash: 431721920 },
        ],
        armor: ["class"],
      },
      {
        encounter: "Warpriest",
        summary: "Rotation des 3 plaques de lumière.",
        weapons: [
          { name: "Doom of Chelchis", type: "Fusil de reconnaissance", element: "Vide", hash: 1937552980 },
          { name: "Qullim's Terminus", type: "Mitrailleuse", element: "Vide", hash: 1321506184 },
        ],
        armor: ["legs"],
      },
      {
        encounter: "Totems de Golgoroth",
        summary: "Soutien par orbes de vide.",
        weapons: [
          { name: "Defiance of Yasmin", type: "Fusil de précision", element: "Solaire", hash: 3228096719 },
        ],
        armor: ["chest"],
      },
      {
        encounter: "Golgoroth",
        summary: "Rotation gaze + DPS.",
        weapons: [
          { name: "Qullim's Terminus", type: "Mitrailleuse", element: "Vide", hash: 1321506184 },
          { name: "Defiance of Yasmin", type: "Fusil de précision", element: "Solaire", hash: 3228096719 },
        ],
        armor: ["helmet"],
      },
      {
        encounter: "Daughters",
        summary: "Purification aux plaques.",
        weapons: [
          { name: "Doom of Chelchis", type: "Fusil de reconnaissance", element: "Vide", hash: 1937552980 },
          { name: "Defiance of Yasmin", type: "Fusil de précision", element: "Solaire", hash: 3228096719 },
        ],
        armor: ["class"],
      },
      {
        encounter: "Oryx, le Roi Pris",
        summary: "Totems + portal + stagger final.",
        weapons: [
          { name: "Qullim's Terminus", type: "Mitrailleuse", element: "Vide", hash: 1321506184 },
          { name: "Zaouli's Bane", type: "Revolver", element: "Solaire", hash: 431721920 },
          { name: "Doom of Chelchis", type: "Fusil de reconnaissance", element: "Vide", hash: 1937552980 },
          { name: "Touch of Malice", type: "Fusil de reconnaissance", element: "Cinétique", exotic: true, hash: 1802135586 },
        ],
        armor: ["chest"],
        extras: ["Challenge Master : Touch of Malice (reissue)"],
      },
    ],
    armorSet: "Armure des Hive Priests",
    armorSetHashes: {
      helmet: 2324998093,
      arms: 1664757090,
      chest: 2978918436,
      legs: 3708902812,
      class: 956827695,
    },
    exotic: "Touch of Malice — Fusil de reconnaissance",
  },
  {
    activityHash: 1441982566,
    type: "raid",
    name: "Vow of the Disciple",
    shortName: "Vow",
    year: 2022,
    recommendedPower: 1550,
    difficulties: ["Normal", "Maître"],
    destination: "Monde du Trône de Savathûn",
    expansion: "The Witch Queen",
    fireteamSize: 6,
    duration: "60-90 min",
    matchmaking: false,
    seal: "Disciple",
    secretChests: 2,
    encounters: [
      {
        encounter: "Acquisition",
        summary: "Puzzle de symboles + course.",
        weapons: [
          { name: "Submission", type: "Pistolet-mitrailleur", element: "Cinétique", hash: 3886416794 },
          { name: "Insidious", type: "Fusil à impulsion", element: "Cinétique", hash: 3428521585 },
        ],
        armor: ["legs"],
      },
      {
        encounter: "Caretaker",
        summary: "Boss de couloir + DPS orbes.",
        weapons: [
          { name: "Forbearance", type: "Lance-grenades", element: "Arc", hash: 613334176 },
          { name: "Cataclysmic", type: "Fusil à fusion linéaire", element: "Vide", hash: 999767358 },
        ],
        armor: ["arms"],
      },
      {
        encounter: "Exhibition",
        summary: "Obélisques + symboles à purifier.",
        weapons: [
          { name: "Deliverance", type: "Fusil à fusion", element: "Stasis", hash: 768621510 },
          { name: "Submission", type: "Pistolet-mitrailleur", element: "Cinétique", hash: 3886416794 },
        ],
        armor: ["chest"],
      },
      {
        encounter: "Rhulk, Disciple du Témoin",
        summary: "Pyramides + lasers + DPS final.",
        weapons: [
          { name: "Cataclysmic", type: "Fusil à fusion linéaire", element: "Vide", hash: 999767358 },
          { name: "Forbearance", type: "Lance-grenades", element: "Arc", hash: 613334176 },
          { name: "Collective Obligation", type: "Fusil à impulsion", element: "Vide", exotic: true, hash: 3505113722 },
        ],
        armor: ["helmet"],
        extras: ["Arme exotique (drop aléatoire) : Collective Obligation"],
      },
    ],
    armorSet: "Armure du Disciple",
    armorSetHashes: {
      helmet: 362541459,
      arms: 2150515362,
      chest: 1627640710,
      legs: 365727964,
      class: 2370089583,
    },
    exotic: "Collective Obligation — Fusil à impulsion vide",
  },
  {
    activityHash: 910380154,
    type: "raid",
    name: "Deep Stone Crypt",
    shortName: "DSC",
    year: 2020,
    recommendedPower: 1530,
    difficulties: ["Normal", "Maître"],
    destination: "Europa — Bunker Braytech",
    expansion: "Beyond Light",
    fireteamSize: 6,
    duration: "45-75 min",
    matchmaking: false,
    seal: "Crypte profonde",
    secretChests: 2,
    encounters: [
      {
        encounter: "Point de chute",
        summary: "Exterminateur Fallen + plaques de chaleur.",
        weapons: [
          { name: "Posterity", type: "Revolver", element: "Cinétique", hash: 3281285075 },
          { name: "Trustee", type: "Fusil de reconnaissance", element: "Solaire", hash: 1392919471 },
        ],
        armor: ["arms"],
      },
      {
        encounter: "Sécurité",
        summary: "Réplicateurs + scan de rétines.",
        weapons: [
          { name: "Succession", type: "Fusil de précision", element: "Vide", hash: 2990047042 },
          { name: "Bequest", type: "Épée", element: "Solaire", hash: 3366545721 },
        ],
        armor: ["legs"],
      },
      {
        encounter: "Atraks-1",
        summary: "Combat en zéro-G + stations d'extraction.",
        weapons: [
          { name: "Trustee", type: "Fusil de reconnaissance", element: "Solaire", hash: 1392919471 },
          { name: "Heritage", type: "Fusil à pompe", element: "Cinétique", hash: 4248569242 },
        ],
        armor: ["chest"],
      },
      {
        encounter: "Taniks, le Mort-Abominable",
        summary: "Boss final. Eyes of Tomorrow possible.",
        weapons: [
          { name: "Posterity", type: "Revolver", element: "Cinétique", hash: 3281285075 },
          { name: "Commemoration", type: "Mitrailleuse", element: "Vide", hash: 4230965989 },
          { name: "Eyes of Tomorrow", type: "Lance-roquettes", element: "Solaire", exotic: true, hash: 2399110176 },
        ],
        armor: ["helmet"],
        extras: ["Drop aléatoire : Eyes of Tomorrow (taux bas)"],
      },
    ],
    armorSet: "Armure Braytech de la Crypte",
    armorSetHashes: {
      helmet: 3015085684,
      arms: 1887490701,
      class: 2956588906,
    },
    exotic: "Eyes of Tomorrow — Lance-roquettes solaire",
  },
  {
    activityHash: 2122313384,
    type: "raid",
    name: "Last Wish",
    shortName: "LW",
    year: 2018,
    recommendedPower: 1610,
    difficulties: ["Normal"],
    destination: "Cité Onirique",
    expansion: "Forsaken",
    fireteamSize: 6,
    duration: "90-180 min",
    matchmaking: false,
    seal: "Rêveur",
    secretChests: 3,
    encounters: [
      {
        encounter: "Kalli, Corrompue",
        summary: "Cercles + DPS rotation.",
        weapons: [
          { name: "Age-Old Bond", type: "Fusil automatique", element: "Cinétique", hash: 601592879 },
          { name: "Techeun Force", type: "Fusil à fusion", element: "Arc", hash: 4094657108 },
        ],
        armor: ["arms"],
      },
      {
        encounter: "Shuro Chi",
        summary: "Plateformes + mots rouges.",
        weapons: [
          { name: "Techeun Force", type: "Fusil à fusion", element: "Arc", hash: 4094657108 },
          { name: "Age-Old Bond", type: "Fusil automatique", element: "Cinétique", hash: 601592879 },
        ],
        armor: ["chest"],
      },
      {
        encounter: "Morgeth",
        summary: "Orbes de Taken + DPS.",
        weapons: [
          { name: "Apex Predator", type: "Lance-roquettes", element: "Solaire", hash: 1851777734 },
          { name: "Nation of Beasts", type: "Revolver", element: "Arc", hash: 654370424 },
        ],
        armor: ["legs"],
      },
      {
        encounter: "Miroirs dorés",
        summary: "Secret labyrinthe. 1 offering requis.",
        weapons: [
          { name: "Techeun Force", type: "Fusil à fusion", element: "Arc", hash: 4094657108 },
        ],
        armor: ["class"],
      },
      {
        encounter: "Riven des Mille Voix",
        summary: "Combat le plus complexe du D2.",
        weapons: [
          { name: "Apex Predator", type: "Lance-roquettes", element: "Solaire", hash: 1851777734 },
          { name: "Nation of Beasts", type: "Revolver", element: "Arc", hash: 654370424 },
        ],
        armor: ["helmet"],
      },
      {
        encounter: "Queenswalk",
        summary: "Transport du cœur de Riven.",
        weapons: [
          { name: "One Thousand Voices", type: "Fusil à fusion linéaire", element: "Solaire", exotic: true, hash: 2069224589 },
        ],
        extras: ["Arme exotique (drop aléatoire) : One Thousand Voices"],
      },
    ],
    armorSet: "Armure des Rêveurs",
    armorSetHashes: {
      helmet: 4097166900,
      arms: 2503434573,
      chest: 4070309619,
      legs: 3174233615,
      class: 1980768298,
    },
    exotic: "One Thousand Voices — Fusion linéaire solaire",
  },
  {
    activityHash: 3881495763,
    type: "raid",
    name: "Vault of Glass",
    shortName: "VoG",
    year: 2021,
    recommendedPower: 1310,
    difficulties: ["Normal", "Maître"],
    destination: "Vénus — Chambre Forte de Verre",
    expansion: "Season of the Splicer (reissue)",
    fireteamSize: 6,
    duration: "60-90 min",
    matchmaking: false,
    seal: "Fatalité",
    secretChests: 2,
    encounters: [
      {
        encounter: "Ouvrir le coffre (Vitraux)",
        summary: "3 plaques de conflux à maintenir.",
        weapons: [
          { name: "Fatebringer", type: "Revolver", element: "Arc" },
          { name: "Found Verdict", type: "Fusil à pompe", element: "Arc" },
        ],
        armor: ["arms"],
      },
      {
        encounter: "Confluxes",
        summary: "3 vagues d'ennemis Vex, ne laisser aucun conflux être absorbé.",
        weapons: [
          { name: "Vision of Confluence", type: "Fusil de reconnaissance", element: "Solaire" },
          { name: "Praedyth's Revenge", type: "Fusil de précision", element: "Vide" },
        ],
        armor: ["legs"],
      },
      {
        encounter: "Oracles",
        summary: "Oracles en rotation, DPS rapide.",
        weapons: [
          { name: "Praedyth's Revenge", type: "Fusil de précision", element: "Vide" },
          { name: "Hezen Vengeance", type: "Lance-roquettes", element: "Solaire" },
        ],
        armor: ["chest"],
      },
      {
        encounter: "Templier",
        summary: "Bannir le bouclier + DPS Templier.",
        weapons: [
          { name: "Fatebringer", type: "Revolver", element: "Arc" },
          { name: "Hezen Vengeance", type: "Lance-roquettes", element: "Solaire" },
        ],
        armor: ["class"],
      },
      {
        encounter: "Gorgones",
        summary: "Labyrinthe furtif, éviter le regard des Gorgones.",
        weapons: [],
      },
      {
        encounter: "Atheon, Temps Déchaîné",
        summary: "Boss final. Split temporel passé/futur.",
        weapons: [
          { name: "Vex Mythoclast", type: "Fusil à fusion", element: "Solaire", exotic: true },
          { name: "Vision of Confluence", type: "Fusil de reconnaissance", element: "Solaire" },
          { name: "Fatebringer", type: "Revolver", element: "Arc" },
        ],
        armor: ["helmet"],
        extras: ["Arme exotique (drop aléatoire) : Vex Mythoclast"],
      },
    ],
    armorSet: "Armure Kabr / Prime Zealot / Hezen Lords",
    exotic: "Vex Mythoclast — Fusil à fusion solaire",
  },
  {
    activityHash: 1042180643,
    type: "raid",
    name: "Garden of Salvation",
    shortName: "GoS",
    year: 2019,
    recommendedPower: 920,
    difficulties: ["Normal"],
    destination: "Jardin noir",
    expansion: "Shadowkeep",
    fireteamSize: 6,
    duration: "45-75 min",
    matchmaking: false,
    seal: "Enchanteur",
    secretChests: 2,
    encounters: [
      {
        encounter: "Ouverture",
        summary: "Exploration du Jardin Noir.",
        weapons: [
          { name: "Accrued Redemption", type: "Arc", element: "Cinétique" },
          { name: "Age-Old Bond", type: "Fusil automatique", element: "Cinétique" },
        ],
        armor: ["arms"],
      },
      {
        encounter: "Évocation",
        summary: "Les runes + relais Vex.",
        weapons: [
          { name: "Prophet of Doom", type: "Fusil à pompe", element: "Solaire" },
          { name: "Zealot's Reward", type: "Fusil à fusion linéaire", element: "Vide" },
        ],
        armor: ["legs"],
      },
      {
        encounter: "Consécration",
        summary: "Consacrer les 3 orbes tout en survivant aux Vex.",
        weapons: [
          { name: "Reckless Oracle", type: "Fusil à impulsion", element: "Cinétique" },
          { name: "Sacred Provenance", type: "Fusil de reconnaissance", element: "Cinétique" },
        ],
        armor: ["chest"],
      },
      {
        encounter: "Sanctifié, le Cœur",
        summary: "Boss final. Relais chained + DPS.",
        weapons: [
          { name: "Divinity", type: "Fusil traceur", element: "Arc", exotic: true },
          { name: "Zealot's Reward", type: "Fusil à fusion linéaire", element: "Vide" },
        ],
        armor: ["helmet"],
        extras: ["Exotique via quête : Divinity"],
      },
    ],
    armorSet: "Armure du Jardin salvateur",
    exotic: "Divinity — Fusil traceur arc (quête exotique)",
  },
];

// ---------------------------------------------------------------------------
// DUNGEONS
// ---------------------------------------------------------------------------

export const DUNGEONS: ActivityGuide[] = [
  {
    activityHash: 3492566689,
    type: "dungeon",
    name: "Vesper's Host",
    shortName: "Vesper",
    year: 2024,
    recommendedPower: 1985,
    difficulties: ["Normal", "Maître"],
    featured: true,
    destination: "Station spatiale Vesper",
    expansion: "Episode: Revenant",
    fireteamSize: 3,
    duration: "40-60 min",
    matchmaking: false,
    seal: "Scénariste",
    secretChests: 2,
    encounters: [
      {
        encounter: "Activation",
        summary: "Séquence de démarrage de la station — générateurs à réactiver.",
        weapons: [
          { name: "VS Chill Inhibitor", type: "Lance-grenades", element: "Stasis", hash: 1762785662 },
          { name: "VS Gravitic Arrest", type: "Fusil à fusion", element: "Vide", hash: 93061497 },
          { name: "VS Velocity Baton", type: "Lance-grenades", element: "Cinétique", hash: 1762785663 },
        ],
        armor: ["arms"],
      },
      {
        encounter: "Raneiks Unifié",
        summary: "Diviser l'araignée Fallen en 4 puis DPS synchronisé.",
        weapons: [
          { name: "VS Chill Inhibitor", type: "Lance-grenades", element: "Stasis", hash: 1762785662 },
          { name: "VS Gravitic Arrest", type: "Fusil à fusion", element: "Vide", hash: 93061497 },
          { name: "VS Pyroelectric Propellant", type: "Fusil automatique", element: "Solaire", hash: 4232480042 },
        ],
        armor: ["legs"],
      },
      {
        encounter: "Le Marionnettiste Corrompu",
        summary: "Boss final. Plateformes zéro-G + DPS ciblé.",
        weapons: [
          { name: "Ice Breaker", type: "Fusil de précision", element: "Solaire", exotic: true },
          { name: "VS Gravitic Arrest", type: "Fusil à fusion", element: "Vide", hash: 93061497 },
          { name: "VS Pyroelectric Propellant", type: "Fusil automatique", element: "Solaire", hash: 4232480042 },
          { name: "Slayer's Fang", type: "Fusil à pompe", element: "Vide", exotic: true, hash: 1047932517 },
        ],
        armor: ["helmet", "chest"],
        extras: [
          "Arme exotique (drop aléatoire) : Slayer's Fang",
          "Quête exotique possible : Ice Breaker (via le donjon)",
        ],
      },
    ],
    armorSet: "Armure Vesper-tech",
    armorSetHashes: {
      helmet: 2244013188,
      arms: 1808327005,
      chest: 1615763427,
      legs: 4132376063,
      class: 514586330,
    },
    exotic: "Slayer's Fang — Fusil à pompe vide",
  },
  {
    activityHash: 2032534090,
    type: "dungeon",
    name: "The Shattered Throne",
    shortName: "Throne",
    year: 2018,
    recommendedPower: 1530,
    difficulties: ["Normal"],
    destination: "Cité Onirique — Royaume Ascendant",
    expansion: "Forsaken",
    fireteamSize: 3,
    duration: "30-45 min",
    matchmaking: false,
    seal: "Cauchemar",
    secretChests: 1,
    encounters: [
      {
        encounter: "Labyrinthe d'Érèbe",
        summary: "Navigation ascendante + orbes de lumière.",
        weapons: [
          { name: "Retold Tale", type: "Fusil à pompe", element: "Vide", hash: 346136302 },
        ],
        armor: ["arms"],
      },
      {
        encounter: "Vorgeth, la Faim Sans Limite",
        summary: "Plateformes + DPS orbes d'ogre.",
        weapons: [
          { name: "Retold Tale", type: "Fusil à pompe", element: "Vide", hash: 346136302 },
        ],
        armor: ["chest"],
      },
      {
        encounter: "Dûl Incaru, l'Éternel Retour",
        summary: "3 Wizards à tuer + DPS final sur Dûl Incaru.",
        weapons: [
          { name: "Retold Tale", type: "Fusil à pompe", element: "Vide", hash: 346136302 },
          { name: "Wish-Ender", type: "Arc", element: "Cinétique", exotic: true, hash: 814876684 },
        ],
        armor: ["helmet"],
        extras: ["Quête exotique : Wish-Ender (arc)"],
      },
    ],
    armorSet: "Armure Dreaming City",
    armorSetHashes: {
      helmet: 4097166900,
      arms: 2503434573,
      chest: 4070309619,
      legs: 3174233615,
      class: 1980768298,
    },
    exotic: "Wish-Ender — Arc exotique (quête)",
  },
  {
    activityHash: 4078656646,
    type: "dungeon",
    name: "Grasp of Avarice",
    shortName: "Avarice",
    year: 2021,
    recommendedPower: 1550,
    difficulties: ["Normal", "Maître"],
    destination: "Cosmodrome — Caverne au loot",
    expansion: "30th Anniversary",
    fireteamSize: 3,
    duration: "25-40 min",
    matchmaking: false,
    seal: "Splendeur",
    secretChests: 2,
    encounters: [
      {
        encounter: "Caverne au loot",
        summary: "Descente dans la caverne + ramassage des engrammes d'or.",
        weapons: [
          { name: "Matador 64", type: "Fusil à pompe", element: "Cinétique", hash: 2563012876 },
          { name: "Eyasluna", type: "Revolver", element: "Stasis", hash: 235827225 },
        ],
        armor: ["arms"],
      },
      {
        encounter: "Capitaine Avarokk",
        summary: "Plateformes + DPS sur le Capitaine Déchu.",
        weapons: [
          { name: "1000-Yard Stare", type: "Fusil de précision", element: "Vide" },
          { name: "Hero of Ages", type: "Fusil à fusion", element: "Stasis" },
          { name: "Eyasluna", type: "Revolver", element: "Stasis", hash: 235827225 },
        ],
        armor: ["legs"],
      },
      {
        encounter: "Phry'zhia l'Insatiable",
        summary: "Boss final Ogre. Pile d'or à défendre.",
        weapons: [
          { name: "Matador 64", type: "Fusil à pompe", element: "Cinétique", hash: 2563012876 },
          { name: "Hero of Ages", type: "Fusil à fusion", element: "Stasis" },
          { name: "Gjallarhorn", type: "Lance-roquettes", element: "Solaire", exotic: true, hash: 1363886209 },
        ],
        armor: ["helmet", "chest"],
        extras: ["Quête exotique : Gjallarhorn (via le donjon)"],
      },
    ],
    armorSet: "Armure SIVA-tech",
    armorSetHashes: {
      helmet: 3473581026,
      arms: 2771648715,
      chest: 549825413,
      legs: 4287863773,
      class: 3500810712,
    },
    exotic: "Gjallarhorn — Lance-roquettes solaire (quête)",
  },
  {
    activityHash: 3012587626,
    type: "dungeon",
    name: "Duality",
    shortName: "Duality",
    year: 2022,
    recommendedPower: 1560,
    difficulties: ["Normal", "Maître"],
    destination: "Mindscape de Calus",
    expansion: "Season of the Haunted",
    fireteamSize: 3,
    duration: "35-50 min",
    matchmaking: false,
    seal: "Exorciste",
    secretChests: 3,
    encounters: [
      {
        encounter: "Ouvrir le coffre",
        summary: "Cloches + 2 dimensions. Puzzle d'accès.",
        weapons: [
          { name: "Unforgiven", type: "Pistolet-mitrailleur", element: "Solaire", hash: 3000847393 },
          { name: "Lingering Dread", type: "Lance-grenades", element: "Stasis", hash: 2026087437 },
          { name: "New Purpose", type: "Fusil à impulsion", element: "Vide", hash: 1780464822 },
        ],
        armor: ["arms"],
      },
      {
        encounter: "Cauchemar de Gahlran",
        summary: "Gauntlet + DPS sur Gahlran Sorrow-Bearer.",
        weapons: [
          { name: "New Purpose", type: "Fusil à impulsion", element: "Vide", hash: 1780464822 },
          { name: "Lingering Dread", type: "Lance-grenades", element: "Stasis", hash: 2026087437 },
          { name: "The Epicurean", type: "Fusil à fusion", element: "Vide" },
        ],
        armor: ["legs"],
      },
      {
        encounter: "Cauchemar de Caiatl",
        summary: "Boss final — plaques + DPS Princess Imperial.",
        weapons: [
          { name: "Stormchaser", type: "Fusil à fusion linéaire", element: "Arc", hash: 3652506829 },
          { name: "Unforgiven", type: "Pistolet-mitrailleur", element: "Solaire", hash: 3000847393 },
          { name: "Fixed Odds", type: "Mitrailleuse", element: "Solaire" },
          { name: "Heartshadow", type: "Épée", element: "Vide", exotic: true, hash: 3664831848 },
        ],
        armor: ["helmet", "chest"],
        extras: ["Arme exotique (drop aléatoire) : Heartshadow"],
      },
    ],
    armorSet: "Armure du Menagerie Nightmare",
    armorSetHashes: {
      helmet: 3270955774,
      arms: 2616310259,
      chest: 3570529565,
      legs: 2351264197,
      class: 737550160,
    },
    exotic: "Heartshadow — Épée vide exotique",
  },
  {
    activityHash: 1262462921,
    type: "dungeon",
    name: "Spire of the Watcher",
    shortName: "Spire",
    year: 2022,
    recommendedPower: 1570,
    difficulties: ["Normal", "Maître"],
    destination: "Mars — Flèche du Gardien",
    expansion: "Season of the Seraph",
    fireteamSize: 3,
    duration: "30-50 min",
    matchmaking: false,
    seal: "Shérif",
    secretChests: 2,
    encounters: [
      {
        encounter: "Ascension de la Flèche",
        summary: "Plateformes + shanks explosifs + plaques.",
        weapons: [
          { name: "Long Arm", type: "Fusil de reconnaissance", element: "Vide", hash: 8293111 },
          { name: "Wilderflight", type: "Lance-grenades", element: "Arc" },
          { name: "Liminal Vigil", type: "Arme de poing", element: "Stasis", hash: 3138208275 },
        ],
        armor: ["arms"],
      },
      {
        encounter: "Akelous, la Divinité Incarnée",
        summary: "Canons à activer + chrono + DPS Hydra.",
        weapons: [
          { name: "Terminus Horizon", type: "Mitrailleuse", element: "Cinétique", hash: 487205709 },
          { name: "Long Arm", type: "Fusil de reconnaissance", element: "Vide", hash: 8293111 },
          { name: "Wilderflight", type: "Lance-grenades", element: "Arc" },
        ],
        armor: ["legs"],
      },
      {
        encounter: "Persys, la Compilation Primordiale",
        summary: "Boss final Vex Hydra. Arènes avec relais.",
        weapons: [
          { name: "Terminus Horizon", type: "Mitrailleuse", element: "Cinétique", hash: 487205709 },
          { name: "Liminal Vigil", type: "Arme de poing", element: "Stasis", hash: 3138208275 },
          { name: "Long Arm", type: "Fusil de reconnaissance", element: "Vide", hash: 8293111 },
          { name: "Hierarchy of Needs", type: "Arc", element: "Solaire", exotic: true, hash: 4174431791 },
        ],
        armor: ["helmet", "chest"],
        extras: ["Arme exotique (drop aléatoire) : Hierarchy of Needs"],
      },
    ],
    armorSet: "Armure Spire-tech",
    armorSetHashes: {
      helmet: 2599025960,
      arms: 3933500353,
      chest: 436695703,
      legs: 119121067,
      class: 506181038,
    },
    exotic: "Hierarchy of Needs — Arc solaire exotique",
  },
  {
    activityHash: 2004855007,
    type: "dungeon",
    name: "Warlord's Ruin",
    shortName: "Warlord",
    year: 2023,
    recommendedPower: 1810,
    difficulties: ["Normal", "Maître"],
    destination: "EDZ — Forteresse des Seigneurs de Fer",
    expansion: "Season of the Wish",
    fireteamSize: 3,
    duration: "40-60 min",
    matchmaking: false,
    seal: "Implacable",
    secretChests: 2,
    encounters: [
      {
        encounter: "Rathil, Premier Chevalier Brisé",
        summary: "Charges d'arc + Hive. Gèle ton chemin dans la neige.",
        weapons: [
          { name: "Vengeful Whisper", type: "Arc", element: "Cinétique" },
          { name: "Dragoncult Sickle", type: "Épée", element: "Arc" },
          { name: "Indebted Kindness", type: "Arme de poing", element: "Arc", hash: 3381450498 },
        ],
        armor: ["arms"],
      },
      {
        encounter: "Lieu des Pleurs",
        summary: "Locus of Wailing Grief — puzzle couleur des sigils.",
        weapons: [
          { name: "Vengeful Whisper", type: "Arc", element: "Cinétique" },
          { name: "Naeem's Lance", type: "Fusil de précision", element: "Stasis", hash: 2806569825 },
          { name: "Indebted Kindness", type: "Arme de poing", element: "Arc", hash: 3381450498 },
        ],
        armor: ["legs"],
      },
      {
        encounter: "Hefnd, Chimère Flétrie",
        summary: "Boss final — DPS sur la Chimère corrompue.",
        weapons: [
          { name: "Naeem's Lance", type: "Fusil de précision", element: "Stasis", hash: 2806569825 },
          { name: "Dragoncult Sickle", type: "Épée", element: "Arc" },
          { name: "Indebted Kindness", type: "Arme de poing", element: "Arc", hash: 3381450498 },
          { name: "Buried Bloodline", type: "Arme de poing", element: "Vide", exotic: true, hash: 3886719505 },
        ],
        armor: ["helmet", "chest"],
        extras: ["Arme exotique (drop aléatoire) : Buried Bloodline"],
      },
    ],
    armorSet: "Armure Warlord's Ruin",
    armorSetHashes: {
      helmet: 2792429007,
      arms: 652593750,
      chest: 3788388762,
      legs: 2963224754,
      class: 3012281579,
    },
    exotic: "Buried Bloodline — Arme de poing secondaire vide",
  },
  {
    activityHash: 1375089621,
    type: "dungeon",
    name: "Pit of Heresy",
    shortName: "Pit",
    year: 2019,
    recommendedPower: 940,
    difficulties: ["Normal", "Maître"],
    destination: "Lune — Scarlet Keep",
    expansion: "Shadowkeep",
    fireteamSize: 3,
    duration: "25-40 min",
    matchmaking: false,
    seal: "Fléau de la Ruche",
    encounters: [
      {
        encounter: "Sentiers des Rêves",
        summary: "Boucliers runiques à briser + survie.",
        weapons: [
          { name: "Premonition", type: "Fusil à impulsion", element: "Cinétique" },
        ],
        armor: ["arms"],
      },
      {
        encounter: "Les Tours",
        summary: "Épée d'ombre + ogres à exécuter sur chaque tour.",
        weapons: [
          { name: "Premonition", type: "Fusil à impulsion", element: "Cinétique" },
        ],
        armor: ["legs"],
      },
      {
        encounter: "Zulmak, Instrument de Torment",
        summary: "Purifier les cristaux + frapper Zulmak avec l'épée Cleaver.",
        weapons: [
          { name: "Premonition", type: "Fusil à impulsion", element: "Cinétique" },
          { name: "Xenophage", type: "Mitrailleuse", element: "Solaire", exotic: true },
        ],
        armor: ["helmet", "chest"],
        extras: ["Quête exotique : Xenophage (via le donjon)"],
      },
    ],
    armorSet: "Armure Dreambane",
    exotic: "Xenophage — Mitrailleuse solaire (quête)",
  },
  {
    activityHash: 1077850348,
    type: "dungeon",
    name: "Prophecy",
    shortName: "Prophecy",
    year: 2020,
    recommendedPower: 1060,
    difficulties: ["Normal"],
    destination: "Domaine des Neuf",
    expansion: "Season of Arrivals",
    fireteamSize: 3,
    duration: "35-60 min",
    matchmaking: false,
    encounters: [
      {
        encounter: "Phalanx Echo",
        summary: "Plaques lumière/ombre + DPS Phalanx Taken.",
        weapons: [
          { name: "Trust", type: "Revolver", element: "Solaire" },
          { name: "Relentless", type: "Fusil à impulsion", element: "Cinétique" },
        ],
        armor: ["arms"],
      },
      {
        encounter: "Le Labyrinthe",
        summary: "Toboggan psychédélique + survie.",
        weapons: [
          { name: "A Sudden Death", type: "Fusil à pompe", element: "Arc" },
          { name: "Judgment", type: "Revolver", element: "Cinétique" },
        ],
        armor: ["legs"],
      },
      {
        encounter: "Cathedral of Kelgorath",
        summary: "Knights + plaques à activer.",
        weapons: [
          { name: "Prosecutor", type: "Fusil automatique", element: "Arc" },
          { name: "Adjudicator", type: "Pistolet-mitrailleur", element: "Stasis" },
        ],
        armor: ["chest"],
      },
      {
        encounter: "Le Kell Echo",
        summary: "Boss final hybride. DPS en rotation.",
        weapons: [
          { name: "Judgment", type: "Revolver", element: "Cinétique" },
          { name: "The Long Walk", type: "Fusil de précision", element: "Cinétique" },
        ],
        armor: ["helmet"],
      },
    ],
    armorSet: "Armure Moonfang-X7",
    exotic: "Aucune arme exotique · cosmétiques (sparrow, ghost, ship)",
  },
  {
    activityHash: 313828469,
    type: "dungeon",
    name: "Ghosts of the Deep",
    shortName: "Ghosts",
    year: 2023,
    recommendedPower: 1810,
    difficulties: ["Normal", "Maître"],
    destination: "Titan — Mer Méthane",
    expansion: "Season of the Deep",
    fireteamSize: 3,
    duration: "40-70 min",
    matchmaking: false,
    seal: "Abysses",
    secretChests: 2,
    encounters: [
      {
        encounter: "Ecthar, Shield of Savathûn",
        summary: "Boucliers Hive + DPS après rituel.",
        weapons: [
          { name: "No Survivors", type: "Pistolet-mitrailleur", element: "Stasis" },
          { name: "New Pacific Epitaph", type: "Lance-grenades", element: "Stasis" },
        ],
        armor: ["arms"],
      },
      {
        encounter: "Simmumah ur-Nokru",
        summary: "Wizard Lucent + invocations.",
        weapons: [
          { name: "Greasy Luck", type: "Lance-grenades", element: "Arc" },
          { name: "Tinasha's Mastery", type: "Lance-grenades", element: "Vide" },
        ],
        armor: ["legs"],
      },
      {
        encounter: "Lightbearer Hive",
        summary: "Boss final Lucent. DPS à la Navigator.",
        weapons: [
          { name: "The Navigator", type: "Fusil traceur", element: "Strand", exotic: true },
          { name: "No Survivors", type: "Pistolet-mitrailleur", element: "Stasis" },
        ],
        armor: ["helmet", "chest"],
        extras: ["Arme exotique (drop aléatoire) : The Navigator"],
      },
    ],
    armorSet: "Armure des Profondeurs",
    exotic: "The Navigator — Fusil traceur strand",
  },
  {
    activityHash: 2915918323,
    type: "dungeon",
    name: "Sundered Doctrine",
    shortName: "Sundered",
    year: 2025,
    recommendedPower: 2000,
    difficulties: ["Normal", "Maître"],
    destination: "Monde du Trône — Pyramide engloutie",
    expansion: "Episode: Heresy",
    fireteamSize: 3,
    duration: "45-70 min",
    matchmaking: false,
    seal: "Hérétique",
    secretChests: 2,
    encounters: [
      {
        encounter: "Kerrev, le Vengeur",
        summary: "Puzzle symboles Lucent Hive + DPS.",
        weapons: [
          { name: "Truthteller", type: "Lance-grenades", element: "Vide" },
          { name: "Consecrated Mind", type: "Fusil à impulsion", element: "Vide" },
        ],
        armor: ["arms"],
      },
      {
        encounter: "Le Livre des Héros Perdus",
        summary: "Salle des runes. Ordre de lecture.",
        weapons: [
          { name: "A Sudden Death", type: "Fusil à pompe", element: "Arc" },
          { name: "Pro Memoria", type: "Mitrailleuse", element: "Stasis" },
        ],
        armor: ["legs"],
      },
      {
        encounter: "Zoetic Lockset",
        summary: "Boss final. Verrouillage par runes en DPS.",
        weapons: [
          { name: "Finality's Auger", type: "Fusil à fusion linéaire", element: "Solaire", exotic: true },
          { name: "Consecrated Mind", type: "Fusil à impulsion", element: "Vide" },
        ],
        armor: ["helmet", "chest"],
        extras: ["Arme exotique (drop aléatoire) : Finality's Auger"],
      },
    ],
    armorSet: "Armure Flain",
    exotic: "Finality's Auger — Fusil à fusion linéaire solaire",
  },
];