/**
 * Well-known Bungie vendor hashes — single source of truth for BOTH the
 * Cruzer desktop app (src/features/tools/VendorsView.tsx) AND the Discord
 * bot (bot/src/commands/vendors/*). When Bungie rotates or retires a
 * vendor, update this file alone — everything downstream picks it up.
 *
 * No React, no Tauri, no Bungie SDK imports — pure TS data so the bot
 * (Node) and the app (Vite/Tauri) can both consume it with identical
 * module graphs.
 */

export const VendorHashes = {
  Xur: 2190858386,
  Zavala: 69482069,
  Shaxx: 3603221665,
  Drifter: 248695599,
  Banshee: 672118013,
  SaintFourteen: 765357505,
  /** Lord Saladin — Iron Banner. */
  LordSaladin: 895295461,
  /** Ada-1 — Synthweaver (mods, shaders, transmog). */
  Ada1: 350061650,
  /** Suraya Hawthorne — Clan rewards. */
  Hawthorne: 3347378076,
  /** Ikora Rey — Warlock vanguard / quest archive. */
  Ikora: 1976548992,
  /** Eververse (Tess Everis) — Bright Dust / cosmetics. */
  Eververse: 3361454721,
  /** Master Rahool — Cryptarch, Tour. */
  Rahool: 2255782930,
} as const

export type VendorKey = keyof typeof VendorHashes
