import { bungieGet } from "./bungie";
import type { DestinyItemResponse } from "bungie-api-ts/destiny2";

/**
 * Fetch an instanced item's components (sockets, stats, perks).
 * Only call when we have a real itemInstanceId.
 */
export async function getItemInstance(
  membershipType: number,
  membershipId: string,
  itemInstanceId: string,
  components: number[] = [302, 304, 305, 307, 309]
): Promise<DestinyItemResponse> {
  return bungieGet<DestinyItemResponse>(
    `/Destiny2/${membershipType}/Profile/${membershipId}/Item/${itemInstanceId}/?components=${components.join(",")}`
  );
}