// On-demand loader for DestinyInventoryItemDefinition.
// The full table is ~50MB so we fetch individual item defs and let TanStack Query cache them.
// `lc` query param tells Bungie which locale to return the strings in.
import { bungieGet } from "./bungie";
import type { DestinyInventoryItemDefinition } from "bungie-api-ts/destiny2";

export async function getItemDef(
  hash: number,
  locale = "en"
): Promise<DestinyInventoryItemDefinition> {
  return bungieGet<DestinyInventoryItemDefinition>(
    `/Destiny2/Manifest/DestinyInventoryItemDefinition/${hash}/?lc=${encodeURIComponent(locale)}`,
    { auth: false }
  );
}