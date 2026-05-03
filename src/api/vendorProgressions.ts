/**
 * Per-vendor progression-hash candidate lists.
 *
 * Bungie's vendor model is messy: each vendor can have several "rank"
 * progressions (seasonal, historical, commendation, etc.), and many of
 * them don't expose a usable icon in the manifest. We probe each hash in
 * declaration order until one resolves to a progression with a non-placeholder
 * icon — an empty list means "always fall back to the hand-drawn SVG crest".
 *
 * Keeping these hashes out of the UI layer means the VendorsView component
 * doesn't carry a 30-line opaque lookup table mid-file, and a seasonal
 * Bungie change (new progression hash) is a one-file edit.
 */

import type { VendorKey } from "./vendors"

export const VENDOR_PROGRESSION: Record<VendorKey, readonly number[]> = {
  Zavala: [
    3481101973, // Vanguard rank (modern)
    457612306,
    3098668531,
    1357277879,
    1029083717,
  ],
  // Shaxx: progressions resolve to wrong icons — fall back to SVG crest.
  Shaxx: [],
  Drifter: [
    2772425241, // Infamy
    529303984,
    2000925172,
  ],
  // Banshee: hash 1471185389 resolves to the Trials icon — fall back to SVG.
  Banshee: [],
  SaintFourteen: [
    2755675426, // Trials rank
    1415474357,
    527867935,
  ],
  Ada1: [
    4196566271, // Synthweaver
    2196952403,
    350061650,
  ],
  Hawthorne: [
    3008065600, // Clan
    698955066,
    1864559178,
  ],
  // Ikora has no dedicated progression — always SVG.
  Ikora: [],
  Eververse: [
    3261072412, // Eververse
    3550620567,
  ],
  // Xûr has no persistent rank progression — always fall back to the SVG crest.
  Xur: [],
  LordSaladin: [],
  Rahool: [],
}
