import { bungieGet } from "./bungie";

export interface AggregateActivity {
  activityHash: number;
  values: Record<string, { basic: { value: number; displayValue: string } }>;
}

export interface AggregateActivityResponse {
  activities: AggregateActivity[];
}

export async function getAggregateActivityStats(
  membershipType: number,
  membershipId: string,
  characterId: string
): Promise<AggregateActivityResponse> {
  return bungieGet<AggregateActivityResponse>(
    `/Destiny2/${membershipType}/Account/${membershipId}/Character/${characterId}/Stats/AggregateActivityStats/`
  );
}

export interface ActivityHistoryEntry {
  period: string;
  activityDetails: {
    referenceId: number;
    instanceId: string;
    mode: number;
    modes: number[];
  };
  values: Record<string, { basic: { value: number; displayValue: string } }>;
}

export interface ActivityHistoryResponse {
  activities?: ActivityHistoryEntry[];
}

export async function getActivityHistory(
  membershipType: number,
  membershipId: string,
  characterId: string,
  mode: number,
  count = 250
): Promise<ActivityHistoryResponse> {
  return bungieGet<ActivityHistoryResponse>(
    `/Destiny2/${membershipType}/Account/${membershipId}/Character/${characterId}/Stats/Activities/?mode=${mode}&count=${count}&page=0`
  );
}

export interface PgcrEntry {
  player: {
    destinyUserInfo: {
      membershipId: string;
      displayName: string;
    };
  };
  characterId: string;
  values: Record<string, { basic: { value: number; displayValue: string } }>;
}

export interface PgcrResponse {
  period: string;
  activityDetails: {
    referenceId: number;
    instanceId: string;
    mode: number;
  };
  entries: PgcrEntry[];
}

export async function getPgcr(instanceId: string): Promise<PgcrResponse> {
  return bungieGet<PgcrResponse>(
    `/Destiny2/Stats/PostGameCarnageReport/${instanceId}/`,
    { auth: false }
  );
}

// Bungie activity mode codes — https://bungie-net.github.io/multi/schema_Destiny-HistoricalStats-Definitions-DestinyActivityModeType.html
export const ActivityModes = {
  Story: 2,
  Strike: 3,
  Raid: 4,
  AllPvP: 5,
  Patrol: 6,
  AllPvE: 7,
  Reserved9: 9,
  Control: 10,
  Clash: 12,
  Crimson: 15,
  Nightfall: 16,
  HeroicNightfall: 17,
  AllStrikes: 18,
  IronBanner: 19,
  AllMayhem: 25,
  Supremacy: 31,
  PrivateMatchesAll: 32,
  Survival: 37,
  Countdown: 38,
  TrialsOfTheNine: 39,
  Social: 40,
  TrialsCountdown: 41,
  TrialsSurvival: 42,
  IronBannerControl: 43,
  IronBannerClash: 44,
  IronBannerSupremacy: 45,
  ScoredNightfall: 46,
  ScoredHeroicNightfall: 47,
  Rumble: 48,
  AllDoubles: 49,
  Doubles: 50,
  PrivateMatchesClash: 51,
  PrivateMatchesControl: 52,
  PrivateMatchesSupremacy: 53,
  PrivateMatchesCountdown: 54,
  PrivateMatchesSurvival: 55,
  PrivateMatchesMayhem: 56,
  PrivateMatchesRumble: 57,
  HeroicAdventure: 58,
  Showdown: 59,
  Lockdown: 60,
  Scorched: 61,
  ScorchedTeam: 62,
  Gambit: 63,
  AllPvECompetitive: 64,
  Breakthrough: 65,
  BlackArmoryRun: 66,
  Salvage: 67,
  IronBannerSalvage: 68,
  PvPCompetitive: 69,
  PvPQuickplay: 70,
  ClashQuickplay: 71,
  ClashCompetitive: 72,
  ControlQuickplay: 73,
  ControlCompetitive: 74,
  GambitPrime: 75,
  Reckoning: 76,
  Menagerie: 77,
  VexOffensive: 78,
  NightmareHunt: 79,
  Elimination: 80,
  Momentum: 81,
  Dungeon: 82,
  Sundial: 83,
  TrialsOfOsiris: 84,
  Dares: 85,
  Offensive: 86,
  LostSector: 87,
  Rift: 88,
  ZoneControl: 89,
  IronBannerRift: 90,
  IronBannerZoneControl: 91,
} as const;