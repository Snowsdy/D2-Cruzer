import { bungieGet } from "./bungie";
import type {
  DestinyPublicMilestone,
  DestinyMilestoneDefinition,
} from "bungie-api-ts/destiny2";

export async function getPublicMilestones(): Promise<
  Record<string, DestinyPublicMilestone>
> {
  return bungieGet<Record<string, DestinyPublicMilestone>>(
    "/Destiny2/Milestones/",
    { auth: false }
  );
}

export async function getMilestoneDef(
  hash: number,
  locale = "en"
): Promise<DestinyMilestoneDefinition> {
  return bungieGet<DestinyMilestoneDefinition>(
    `/Destiny2/Manifest/DestinyMilestoneDefinition/${hash}/?lc=${encodeURIComponent(locale)}`,
    { auth: false }
  );
}