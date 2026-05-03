/**
 * Tier-based color mappings for items (Common → Exotic).
 *
 * Consolidated from six separate feature views that each declared their
 * own local `TIER_COLOR` / `TIER_BORDER` / `TIER_NAME_COLOR` / `TIER_GLOW`
 * maps with slightly different values and keys (by number, by Tailwind
 * class vs. by raw rgba). Keyed by `inventory.tierType` (2–6).
 */
import { TIER } from "./bungieHashes";

/** Tailwind border classes (`border-*`) keyed by tierType. */
export const TIER_BORDER_CLASS: Record<number, string> = {
  [TIER.Common]: "border-zinc-500",
  [TIER.Uncommon]: "border-green-500",
  [TIER.Rare]: "border-blue-500",
  [TIER.Legendary]: "border-purple-500",
  [TIER.Exotic]: "border-yellow-400",
};

/** Tailwind text classes for item names keyed by tierType. */
export const TIER_TEXT_CLASS: Record<number, string> = {
  [TIER.Common]: "text-zinc-300",
  [TIER.Uncommon]: "text-green-400",
  [TIER.Rare]: "text-blue-400",
  [TIER.Legendary]: "text-purple-400",
  [TIER.Exotic]: "text-yellow-300",
};

/** Raw rgba border colors (for inline styles / SVGs). */
export const TIER_BORDER_RGBA: Record<number, string> = {
  [TIER.Common]: "rgba(161,161,170,0.55)",
  [TIER.Uncommon]: "rgba(34,197,94,0.55)",
  [TIER.Rare]: "rgba(59,130,246,0.65)",
  [TIER.Legendary]: "rgba(168,85,247,0.65)",
  [TIER.Exotic]: "rgba(250,204,21,0.85)",
};

/** Outer glow (box-shadow) values keyed by tierType — Exotic only by default. */
export const TIER_GLOW: Record<number, string> = {
  [TIER.Legendary]: "0 0 10px rgba(168,85,247,0.35)",
  [TIER.Exotic]: "0 0 14px rgba(250,204,21,0.55)",
};

/** Human-readable rarity names (English). */
export const TIER_NAME: Record<number, string> = {
  [TIER.Common]: "Common",
  [TIER.Uncommon]: "Uncommon",
  [TIER.Rare]: "Rare",
  [TIER.Legendary]: "Legendary",
  [TIER.Exotic]: "Exotic",
};