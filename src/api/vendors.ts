import { bungieGet } from "./bungie"
import type {
  DestinyVendorResponse,
  DestinyVendorDefinition,
} from "bungie-api-ts/destiny2"

export async function getVendorDef(
  hash: number,
  locale = "en"
): Promise<DestinyVendorDefinition> {
  return bungieGet<DestinyVendorDefinition>(
    `/Destiny2/Manifest/DestinyVendorDefinition/${hash}/?lc=${encodeURIComponent(locale)}`,
    { auth: false }
  )
}

// Canonical vendor hashes live in `/shared/vendors.ts` — imported here so
// the Cruzer desktop app and the Discord bot always agree on which hash
// maps to which vendor. See that file for the full list.
export { VendorHashes } from "../../shared/vendors"
export type { VendorKey } from "../../shared/vendors"

/**
 * Fetch a vendor's live state for a given character.
 * Components 400/401/402 cover vendor info, categories and per-sale data.
 */
export async function getVendor(
  membershipType: number,
  membershipId: string,
  characterId: string,
  vendorHash: number,
  components: number[] = [400, 401, 402, 304, 305, 307, 310]
): Promise<DestinyVendorResponse> {
  return bungieGet<DestinyVendorResponse>(
    `/Destiny2/${membershipType}/Profile/${membershipId}/Character/${characterId}/Vendors/${vendorHash}/?components=${components.join(",")}`
  )
}
