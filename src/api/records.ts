import { bungieGet } from "./bungie";
import type { DestinyRecordDefinition } from "bungie-api-ts/destiny2";

export async function getRecordDef(
  hash: number,
  locale = "en"
): Promise<DestinyRecordDefinition> {
  return bungieGet<DestinyRecordDefinition>(
    `/Destiny2/Manifest/DestinyRecordDefinition/${hash}/?lc=${encodeURIComponent(locale)}`,
    { auth: false }
  );
}

// DestinyRecordState bit flags.
export const RecordState = {
  None: 0,
  RecordRedeemed: 1,
  RewardUnavailable: 2,
  ObjectiveNotCompleted: 4,
  Obscured: 8,
  Invisible: 16,
  EntitlementUnowned: 32,
  CanEquipTitle: 64,
} as const;

export function isVisible(state: number): boolean {
  return (state & RecordState.Invisible) === 0;
}

export function isObjectiveComplete(state: number): boolean {
  return (state & RecordState.ObjectiveNotCompleted) === 0;
}

export function isRedeemed(state: number): boolean {
  return (state & RecordState.RecordRedeemed) !== 0;
}

export function isRewardAvailable(state: number): boolean {
  return (state & RecordState.RewardUnavailable) === 0;
}