/**
 * Per-feature accent color pairs.
 *
 * Each feature view used to declare its own local `ACCENT` +
 * `ACCENT_BORDER` Tailwind classes. That worked, but meant:
 *   - two views could drift apart (e.g. one uses `-300`, another `-400`)
 *   - no single place to retune the palette across the app
 *   - the pattern got copy-pasted when a new view was added
 *
 * Key by feature name (matches the folder/view). Import just what you need:
 *
 *   import { ACCENTS } from "../../constants/uiAccents";
 *   const { text, border } = ACCENTS.ironBanner;
 */

export interface AccentPair {
  /** Tailwind `text-*` class for primary labels/numbers. */
  text: string;
  /** Tailwind `border-xxx-500/40` class for card outlines. */
  border: string;
}

export const ACCENTS = {
  checklist: { text: "text-pink-300", border: "border-pink-500/40" },
  checkpoints: { text: "text-pink-300", border: "border-pink-500/40" },
  xur: { text: "text-amber-300", border: "border-amber-500/40" },
  trials: { text: "text-amber-300", border: "border-amber-500/40" },
  ironBanner: { text: "text-red-300", border: "border-red-500/40" },
  nightfall: { text: "text-orange-300", border: "border-orange-500/40" },
  playtime: { text: "text-emerald-300", border: "border-emerald-500/40" },
} as const satisfies Record<string, AccentPair>;

export type AccentKey = keyof typeof ACCENTS;