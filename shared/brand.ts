/**
 * Visual brand constants — color palette, tagline, website URL. Read by
 * both the desktop app and the Discord bot so every surface renders with
 * the same hues.
 *
 * Colors are expressed as numeric hex (0xRRGGBB) so Discord.js embeds can
 * consume them directly. The app's Tailwind config references the same
 * values as hex strings — keep the two in sync when adjusting.
 */

export const BRAND = Object.freeze({
  /** Product name shown in UI chrome and embed footers. */
  name: "Cruzer",
  tagline: "Compagnon Destiny 2 · Marathon ready",
  website: "https://cruzer.gg",

  /** Canonical version bumped at release time. App (Cargo.toml) reads the
   *  same number; bot reports it via `/bot`. */
  version: "0.0.3",

  /** Core magenta — used for highlights, buttons, dashboard accent. */
  colorPrimary: 0xf3075e,
  /** Softer pink — hover states. */
  colorPrimarySoft: 0xff3d82,
  /** Secondary purple — gradient pair with primary. */
  colorAccent: 0xa855f7,
  /** Marathon lime — ONLY for Marathon-branded surfaces. */
  colorMarathon: 0xc7ff00,
  /** Warm amber — used for cautions + exotic tier indicators. */
  colorWarm: 0xf5a623,

  /** Status colours — shared with the Bungie status dashboard. */
  colorSuccess: 0x35e488,
  colorWarn: 0xfbbf24,
  colorError: 0xef4444,
  colorMuted: 0x8b8fa1,
})

export type BrandColor = keyof typeof BRAND
