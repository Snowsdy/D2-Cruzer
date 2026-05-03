// Tauceti / DIM-style search DSL:
//   text matches name or type
//   is:weapon, is:armor, is:equipped, is:exotic, is:legendary, is:rare, is:uncommon, is:common
//   type:auto, type:handcannon, ... (matches itemTypeDisplayName)
//   tag:keep, tag:junk, tag:favorite, tag:infuse, tag:archive
//   damage:solar|arc|void|stasis|strand
//   power:>=500, power:<1800, power:500..520
//   stat:total>60  (armor total stat)
//   perk:outlaw  (matches any perk name on the item)  — v2, needs socket data
//
// Any term may be prefixed with `-` to negate.
// Terms are AND by default.

import type { DestinyItemComponent } from "bungie-api-ts/destiny2"
import type { DestinyInventoryItemDefinition } from "bungie-api-ts/destiny2"
import type { ItemTag } from "@/store/tags"
import { type StatValues, sumArmorStats } from "@/constants/stats"

export interface ItemContext {
  def: DestinyInventoryItemDefinition | undefined
  stats?: StatValues
  power?: number
  tag?: ItemTag | null
  equipped?: boolean
  inVault?: boolean
}

type Predicate = (item: DestinyItemComponent, ctx: ItemContext) => boolean

const DAMAGE_TYPE = {
  kinetic: 1,
  arc: 2,
  solar: 3,
  void: 4,
  stasis: 6,
  strand: 7,
} as const

const TIER = {
  common: 2,
  uncommon: 3,
  rare: 4,
  legendary: 5,
  exotic: 6,
} as const

function textPredicate(term: string): Predicate {
  const needle = term.toLowerCase()
  return (_it, ctx) => {
    const name = ctx.def?.displayProperties?.name?.toLowerCase() ?? ""
    const type = ctx.def?.itemTypeDisplayName?.toLowerCase() ?? ""
    return name.includes(needle) || type.includes(needle)
  }
}

function parsePower(value: string): Predicate | null {
  const rangeMatch = value.match(/^(\d+)\.\.(\d+)$/)
  if (rangeMatch) {
    const [, lo, hi] = rangeMatch
    return (_it, ctx) =>
      (ctx.power ?? 0) >= Number(lo) && (ctx.power ?? 0) <= Number(hi)
  }
  const cmpMatch = value.match(/^(>=|<=|>|<|=)?\s*(\d+)$/)
  if (!cmpMatch) return null
  const op = cmpMatch[1] ?? "="
  const n = Number(cmpMatch[2])
  return (_it, ctx) => {
    const p = ctx.power ?? 0
    switch (op) {
      case ">=":
        return p >= n
      case "<=":
        return p <= n
      case ">":
        return p > n
      case "<":
        return p < n
      default:
        return p === n
    }
  }
}

function parseStat(value: string): Predicate | null {
  // stat:total>60 form
  const m = value.match(/^(total)(>=|<=|>|<|=)(\d+)$/)
  if (!m) return null
  const op = m[2]
  const n = Number(m[3])
  return (_it, ctx) => {
    const total = sumArmorStats(ctx.stats)
    switch (op) {
      case ">=":
        return total >= n
      case "<=":
        return total <= n
      case ">":
        return total > n
      case "<":
        return total < n
      default:
        return total === n
    }
  }
}

function termPredicate(raw: string): Predicate | null {
  const colon = raw.indexOf(":")
  if (colon === -1) return textPredicate(raw)

  const key = raw.slice(0, colon).toLowerCase()
  const value = raw.slice(colon + 1).toLowerCase()

  switch (key) {
    case "is": {
      switch (value) {
        case "weapon":
          return (_it, ctx) => ctx.def?.itemType === 3
        case "armor":
          return (_it, ctx) => ctx.def?.itemType === 2
        case "equipped":
          return (_it, ctx) => !!ctx.equipped
        case "vault":
          return (_it, ctx) => !!ctx.inVault
        case "exotic":
          return (_it, ctx) => ctx.def?.inventory?.tierType === TIER.exotic
        case "legendary":
          return (_it, ctx) => ctx.def?.inventory?.tierType === TIER.legendary
        case "rare":
          return (_it, ctx) => ctx.def?.inventory?.tierType === TIER.rare
        case "uncommon":
          return (_it, ctx) => ctx.def?.inventory?.tierType === TIER.uncommon
        case "common":
          return (_it, ctx) => ctx.def?.inventory?.tierType === TIER.common
        case "tagged":
          return (_it, ctx) => !!ctx.tag
      }
      return null
    }
    case "type":
      return (_it, ctx) =>
        (ctx.def?.itemTypeDisplayName ?? "").toLowerCase().includes(value)
    case "tag":
      return (_it, ctx) => ctx.tag === value
    case "damage": {
      const hash = (DAMAGE_TYPE as Record<string, number>)[value]
      if (hash == null) return null
      return (_it, ctx) => ctx.def?.defaultDamageType === hash
    }
    case "power":
      return parsePower(value)
    case "stat":
      return parseStat(value)
    default:
      return null
  }
}

export function parseQuery(query: string): Predicate[] {
  const terms: Predicate[] = []
  const tokens = query.match(/(?:[^\s"]+|"[^"]*")+/g) ?? []
  for (const token of tokens) {
    let negated = false
    let t = token
    if (t.startsWith("-")) {
      negated = true
      t = t.slice(1)
    }
    t = t.replace(/^"|"$/g, "")
    if (!t) continue
    const pred = termPredicate(t)
    if (!pred) continue
    terms.push(negated ? (it, c) => !pred(it, c) : pred)
  }
  return terms
}

export function matches(
  predicates: Predicate[],
  item: DestinyItemComponent,
  ctx: ItemContext
): boolean {
  if (predicates.length === 0) return true
  return predicates.every((p) => p(item, ctx))
}
