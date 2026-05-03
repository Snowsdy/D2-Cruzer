/**
 * NPC color palette — shared with the app's VendorsView (src/features/tools/
 * VendorsView.tsx → each entry's `accent` Tailwind class maps to one of
 * these hues) and the bot's embed author colour.
 *
 * Numeric hex so both renderers can consume directly.
 */

export const NPC_COLOR: Record<string, number> = {
  zavala: 0x38bdf8,
  shaxx: 0xf87171,
  drifter: 0x34d399,
  banshee: 0xfbbf24,
  saint: 0xc084fc,
  ada: 0xfb923c,
  hawthorne: 0x2dd4bf,
  ikora: 0x818cf8,
  eververse: 0x38bdf8,
  xur: 0xfacc15,
  crow: 0x60a5fa,
  eris: 0x22d3ee,
  mara: 0xa78bfa,
  rahool: 0xf59e0b,
  ghost: 0xe8ecf1,
  cruzer: 0xf3075e,
};