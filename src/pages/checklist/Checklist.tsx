import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useQueries, useQuery } from "@tanstack/react-query"
import { getPublicMilestones, getMilestoneDef } from "@/api/milestones"
import { useManifestStore } from "@/store/manifest"
import { useProfile } from "@/hooks/useProfile"
import { Components } from "@/api/profile"
import { getItemDef } from "@/api/itemDef"
import { ItemPreviewModal } from "@/components/item-preview-modal"
import { Dropdown } from "@/components/dropdown"
import {
  getRecordDef,
  isObjectiveComplete,
  isRedeemed,
  isVisible,
} from "@/api/records"
import { ITEM_TYPE } from "@/constants/bungieHashes"
import { fmtCountdownDHM as fmtCountdown } from "@/utils/format"
import { ACCENTS } from "@/constants/uiAccents"
import type {
  DestinyPublicMilestone,
  DestinyMilestoneDefinition,
  DestinyMilestone,
  DestinyObjectiveProgress,
  DestinyInventoryItemDefinition,
  DestinyRecordComponent,
  DestinyRecordDefinition,
} from "bungie-api-ts/destiny2"

// Pursuits bucket — holds bounties and quest steps.
const PURSUITS_BUCKET = 1345459588

type MilestoneState = "done" | "claim" | "todo"

function computeMilestoneState(
  cm: DestinyMilestone | undefined
): MilestoneState | "missing" {
  if (!cm) return "missing"

  const quests = cm.availableQuests ?? []
  const activities = cm.activities ?? []
  const rewards = cm.rewards ?? []

  const anyRewardUnclaimed = rewards.some((r) =>
    r.entries?.some((e) => e.earned && !e.redeemed)
  )

  if (quests.length > 0) {
    const allQuestsDone = quests.every((q) => q.status?.completed)
    const anyQuestUnclaimed = quests.some(
      (q) => q.status?.completed && !q.status?.redeemed
    )
    if (!allQuestsDone) return "todo"
    if (anyQuestUnclaimed || anyRewardUnclaimed) return "claim"
    return "done"
  }

  if (activities.length > 0) {
    const allDone = activities.every((a) => {
      const phases = a.phases ?? []
      const challenges = a.challenges ?? []
      const phasesOk = phases.length === 0 || phases.every((p) => p.complete)
      const challengesOk =
        challenges.length === 0 ||
        challenges.every((c) => c.objective?.complete)
      return phasesOk && challengesOk
    })
    if (!allDone) return "todo"
    return anyRewardUnclaimed ? "claim" : "done"
  }

  return anyRewardUnclaimed ? "claim" : "todo"
}

function aggregateStates(states: MilestoneState[]): MilestoneState {
  if (states.length === 0) return "todo"
  if (states.some((s) => s === "todo")) return "todo"
  if (states.some((s) => s === "claim")) return "claim"
  return "done"
}

function sumObjectiveProgress(objectives: DestinyObjectiveProgress[]): number {
  return objectives.reduce((acc, o) => acc + (o.progress ?? 0), 0)
}

const { text: ACCENT, border: ACCENT_BORDER } = ACCENTS.checklist

// Destiny 2 weekly reset: Tuesday 17:00 UTC.
function nextWeeklyReset(now = new Date()): Date {
  const target = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      17,
      0,
      0,
      0
    )
  )
  let delta = (2 - now.getUTCDay() + 7) % 7
  if (delta === 0 && target.getTime() <= now.getTime()) delta = 7
  target.setUTCDate(target.getUTCDate() + delta)
  return target
}

// Daily reset: every day 17:00 UTC.
function nextDailyReset(now = new Date()): Date {
  const target = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      17,
      0,
      0,
      0
    )
  )
  if (target.getTime() <= now.getTime()) {
    target.setUTCDate(target.getUTCDate() + 1)
  }
  return target
}

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

interface EnrichedMilestone {
  hash: number
  raw: DestinyPublicMilestone
  def?: DestinyMilestoneDefinition
  order: number
  isWeekly: boolean
  endsAt?: Date
  state: MilestoneState
  charStates: Array<{ charId: string; state: MilestoneState | "missing" }>
}

export function Checklist() {
  const { t, i18n } = useTranslation()
  const now = useNow()
  const weekly = useMemo(() => nextWeeklyReset(now), [now])
  const daily = useMemo(() => nextDailyReset(now), [now])
  const manifest = useManifestStore((s) => s.manifest)

  // Pull character progressions (includes each character's milestone state).
  const { profile } = useProfile([
    Components.Profiles,
    Components.Characters,
    Components.CharacterProgressions,
    Components.CharacterInventories,
    Components.Records,
  ])
  const charProgressions = profile.data?.characterProgressions?.data
  const charInventories = profile.data?.characterInventories?.data
  const profileRecords = profile.data?.profileRecords?.data?.records
  const characterRecordsByChar = profile.data?.characterRecords?.data
  const characterIds = useMemo(
    () => (charProgressions ? Object.keys(charProgressions) : []),
    [charProgressions]
  )

  // Main tab selector
  const [tab, setTab] = useState<
    "milestones" | "bounties" | "quests" | "triumphs"
  >("milestones")

  // Filter state
  const [stateFilter, setStateFilter] = useState<
    "all" | "todo" | "claim" | "done"
  >("all")
  const [typeFilter, setTypeFilter] = useState<"all" | "weekly" | "daily">(
    "all"
  )
  const [charFilter, setCharFilter] = useState<string>("all")
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<"default" | "name" | "progress" | "endsAt">(
    "default"
  )
  const [previewHash, setPreviewHash] = useState<number | null>(null)

  const milestones = useQuery({
    queryKey: ["publicMilestones"],
    queryFn: getPublicMilestones,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const hashes = useMemo(() => {
    if (!milestones.data) return [] as number[]
    return Object.keys(milestones.data).map((k) => Number(k))
  }, [milestones.data])

  const defs = useQueries({
    queries: hashes.map((hash) => ({
      queryKey: ["milestoneDef", hash, i18n.language],
      queryFn: () => getMilestoneDef(hash, i18n.language),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  })

  const enriched: EnrichedMilestone[] = useMemo(() => {
    if (!milestones.data) return []
    return hashes.map((hash, i) => {
      const raw = milestones.data[String(hash)]
      const def = defs[i]?.data
      const end = raw?.endDate ? new Date(raw.endDate) : undefined

      const charStates = characterIds.map((cid) => {
        const cm = charProgressions?.[cid]?.milestones?.[hash]
        return { charId: cid, state: computeMilestoneState(cm) }
      })
      const activeStates = charStates
        .map((c) => c.state)
        .filter((s): s is MilestoneState => s !== "missing")
      const state = aggregateStates(activeStates)

      return {
        hash,
        raw,
        def,
        order: raw?.order ?? def?.defaultOrder ?? 999,
        isWeekly:
          !!end &&
          end.getTime() - new Date().getTime() > 24 * 60 * 60 * 1000 - 60_000,
        endsAt: end,
        state,
        charStates,
      }
    })
  }, [milestones.data, hashes, defs, characterIds, charProgressions])

  const allVisible = useMemo(() => {
    const list = enriched.filter((m) => !!m.def?.displayProperties?.name)
    const sorted = [...list]
    sorted.sort((a, b) => {
      if (sort === "name") {
        return (a.def?.displayProperties?.name ?? "").localeCompare(
          b.def?.displayProperties?.name ?? ""
        )
      }
      if (sort === "endsAt") {
        const ax = a.endsAt?.getTime() ?? Number.POSITIVE_INFINITY
        const bx = b.endsAt?.getTime() ?? Number.POSITIVE_INFINITY
        return ax - bx
      }
      if (sort === "progress") {
        // Milestones don't have a generic progress — fall back to state order.
        const order = { claim: 0, todo: 1, done: 2 } as const
        return order[a.state] - order[b.state]
      }
      return a.order - b.order
    })
    return sorted
  }, [enriched, sort])

  const totals = useMemo(() => {
    return {
      all: allVisible.length,
      todo: allVisible.filter((m) => m.state === "todo").length,
      claim: allVisible.filter((m) => m.state === "claim").length,
      done: allVisible.filter((m) => m.state === "done").length,
      weekly: allVisible.filter((m) => !m.endsAt || m.isWeekly).length,
      daily: allVisible.filter((m) => m.endsAt && !m.isWeekly).length,
    }
  }, [allVisible])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allVisible.filter((m) => {
      if (typeFilter === "weekly" && m.endsAt && !m.isWeekly) return false
      if (typeFilter === "daily" && (!m.endsAt || m.isWeekly)) return false
      if (charFilter !== "all") {
        const cs = m.charStates.find((c) => c.charId === charFilter)
        if (!cs || cs.state === "missing") return false
      }
      if (q) {
        const name = m.def?.displayProperties?.name?.toLowerCase() ?? ""
        const desc = m.def?.displayProperties?.description?.toLowerCase() ?? ""
        if (!name.includes(q) && !desc.includes(q)) return false
      }
      return true
    })
  }, [allVisible, typeFilter, charFilter, search])

  const todoItems = filtered.filter((m) => m.state === "todo")
  const claimItems = filtered.filter((m) => m.state === "claim")
  const doneItems = filtered.filter((m) => m.state === "done")

  // Pursuits (bounties + quest steps) per character.
  const pursuitsByChar = useMemo(() => {
    const map: Record<
      string,
      Array<{
        itemHash: number
        itemInstanceId?: string
        objectives: DestinyObjectiveProgress[]
      }>
    > = {}
    if (!charInventories || !charProgressions) return map
    for (const [cid, inv] of Object.entries(charInventories)) {
      const items = (inv.items ?? []).filter(
        (i) => i.bucketHash === PURSUITS_BUCKET
      )
      const prog = charProgressions[cid]
      map[cid] = items.map((i) => ({
        itemHash: i.itemHash,
        itemInstanceId: i.itemInstanceId,
        objectives:
          (
            prog?.uninstancedItemObjectives as
              | Record<string, DestinyObjectiveProgress[]>
              | undefined
          )?.[String(i.itemHash)] ?? [],
      }))
    }
    return map
  }, [charInventories, charProgressions])

  const pursuitCharIds = useMemo(() => {
    return charFilter === "all" ? characterIds : [charFilter]
  }, [charFilter, characterIds])

  // Unique pursuit item hashes across selected characters → load defs.
  const allPursuitHashes = useMemo(() => {
    const s = new Set<number>()
    for (const cid of pursuitCharIds) {
      for (const p of pursuitsByChar[cid] ?? []) s.add(p.itemHash)
    }
    return Array.from(s)
  }, [pursuitCharIds, pursuitsByChar])

  const pursuitDefsQueries = useQueries({
    queries: allPursuitHashes.map((hash) => ({
      queryKey: ["itemDef", hash, i18n.language],
      queryFn: () => getItemDef(hash, i18n.language),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  })

  const pursuitTypeByHash = useMemo(() => {
    const m = new Map<number, number>()
    allPursuitHashes.forEach((hash, i) => {
      const t = pursuitDefsQueries[i]?.data?.itemType
      if (typeof t === "number") m.set(hash, t)
    })
    return m
  }, [allPursuitHashes, pursuitDefsQueries])

  const splitPursuits = useMemo(() => {
    const bounties: Record<string, (typeof pursuitsByChar)[string]> = {}
    const quests: Record<string, (typeof pursuitsByChar)[string]> = {}
    const nameOf = (hash: number) => {
      const i = allPursuitHashes.indexOf(hash)
      return (
        pursuitDefsQueries[i]?.data?.displayProperties?.name?.toLowerCase() ??
        ""
      )
    }
    const progressOf = (p: {
      objectives: DestinyObjectiveProgress[]
    }): number => {
      if (p.objectives.length === 0) return 0
      return (
        p.objectives.reduce((acc, o) => {
          const target = o.completionValue || 1
          return acc + Math.min(1, (o.progress ?? 0) / target)
        }, 0) / p.objectives.length
      )
    }
    const cmp = (
      a: (typeof pursuitsByChar)[string][number],
      b: (typeof pursuitsByChar)[string][number]
    ) => {
      if (sort === "name")
        return nameOf(a.itemHash).localeCompare(nameOf(b.itemHash))
      if (sort === "progress") return progressOf(b) - progressOf(a)
      return 0
    }
    for (const cid of pursuitCharIds) {
      const list = pursuitsByChar[cid] ?? []
      const q = search.trim().toLowerCase()
      const filter = (p: (typeof list)[number]) => {
        if (!q) return true
        return nameOf(p.itemHash).includes(q)
      }
      bounties[cid] = list
        .filter(
          (p) =>
            pursuitTypeByHash.get(p.itemHash) === ITEM_TYPE.Bounty && filter(p)
        )
        .sort(cmp)
      quests[cid] = list
        .filter(
          (p) =>
            pursuitTypeByHash.get(p.itemHash) !== ITEM_TYPE.Bounty && filter(p)
        )
        .sort(cmp)
    }
    return { bounties, quests }
  }, [
    pursuitCharIds,
    pursuitsByChar,
    pursuitTypeByHash,
    search,
    allPursuitHashes,
    pursuitDefsQueries,
    sort,
  ])

  const totalBounties = pursuitCharIds.reduce(
    (acc, cid) => acc + (splitPursuits.bounties[cid]?.length ?? 0),
    0
  )
  const totalQuests = pursuitCharIds.reduce(
    (acc, cid) => acc + (splitPursuits.quests[cid]?.length ?? 0),
    0
  )

  // Aggregate records (profile + each character), filter to actionable ones.
  const allRecords = useMemo(() => {
    const merged = new Map<number, DestinyRecordComponent>()
    if (profileRecords) {
      for (const [hash, rec] of Object.entries(profileRecords)) {
        merged.set(Number(hash), rec)
      }
    }
    if (characterRecordsByChar) {
      for (const [cid, bag] of Object.entries(characterRecordsByChar)) {
        if (charFilter !== "all" && cid !== charFilter) continue
        const records = bag.records ?? {}
        for (const [hash, rec] of Object.entries(records)) {
          // Prefer entry with more progress if same record seen already.
          const existing = merged.get(Number(hash))
          if (!existing) merged.set(Number(hash), rec)
          else {
            const existingProg = sumObjectiveProgress(existing.objectives ?? [])
            const newProg = sumObjectiveProgress(rec.objectives ?? [])
            if (newProg > existingProg) merged.set(Number(hash), rec)
          }
        }
      }
    }
    return merged
  }, [profileRecords, characterRecordsByChar, charFilter])

  const recordState = (
    r: DestinyRecordComponent
  ): "claim" | "progress" | "done" | "hide" => {
    const s = r.state ?? 0
    if (!isVisible(s)) return "hide"
    if (isObjectiveComplete(s)) {
      return isRedeemed(s) ? "done" : "claim"
    }
    // In progress: only show if any objective has > 0 progress
    const hasProgress = (r.objectives ?? []).some((o) => (o.progress ?? 0) > 0)
    return hasProgress ? "progress" : "hide"
  }

  const actionableRecords = useMemo(() => {
    const list: Array<{
      hash: number
      rec: DestinyRecordComponent
      state: "claim" | "progress" | "done"
    }> = []
    for (const [hash, rec] of allRecords) {
      const st = recordState(rec)
      if (st === "hide") continue
      list.push({ hash, rec, state: st })
    }
    // claim first, then progress, then done
    const order = { claim: 0, progress: 1, done: 2 } as const
    list.sort((a, b) => order[a.state] - order[b.state])
    return list.slice(0, 120)
  }, [allRecords])

  const recordDefQueries = useQueries({
    queries: actionableRecords.map((r) => ({
      queryKey: ["recordDef", r.hash, i18n.language],
      queryFn: () => getRecordDef(r.hash, i18n.language),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  })

  const enrichedRecords = useMemo(() => {
    const q = search.trim().toLowerCase()
    const enriched = actionableRecords
      .map((r, i) => ({
        ...r,
        def: recordDefQueries[i]?.data,
      }))
      .filter((r) => {
        if (!r.def?.displayProperties?.name) return false
        if (!q) return true
        const name = r.def.displayProperties.name.toLowerCase()
        const desc = r.def.displayProperties.description?.toLowerCase() ?? ""
        return name.includes(q) || desc.includes(q)
      })
    const progressOf = (rec: DestinyRecordComponent): number => {
      const objs = rec.objectives ?? []
      if (objs.length === 0) return 0
      return (
        objs.reduce((acc, o) => {
          const target = o.completionValue || 1
          return acc + Math.min(1, (o.progress ?? 0) / target)
        }, 0) / objs.length
      )
    }
    const sorted = [...enriched]
    sorted.sort((a, b) => {
      if (sort === "name") {
        return (a.def?.displayProperties?.name ?? "").localeCompare(
          b.def?.displayProperties?.name ?? ""
        )
      }
      if (sort === "progress") return progressOf(b.rec) - progressOf(a.rec)
      // default: state priority
      const order = { claim: 0, progress: 1, done: 2 } as const
      return order[a.state] - order[b.state]
    })
    return sorted
  }, [actionableRecords, recordDefQueries, search, sort])

  const triumphClaim = enrichedRecords.filter((r) => r.state === "claim")
  const triumphProgress = enrichedRecords.filter((r) => r.state === "progress")
  const triumphDone = enrichedRecords.filter((r) => r.state === "done")
  const totalTriumphs = enrichedRecords.length

  const showTriumphClaim = stateFilter === "all" || stateFilter === "claim"
  const showTriumphProgress = stateFilter === "all" || stateFilter === "todo"
  const showTriumphDone = stateFilter === "all" || stateFilter === "done"

  const showTodo = stateFilter === "all" || stateFilter === "todo"
  const showClaim = stateFilter === "all" || stateFilter === "claim"
  const showDone = stateFilter === "all" || stateFilter === "done"

  const classDefs = manifest?.DestinyClassDefinition ?? {}
  const chars = profile.data?.characters?.data

  const loading = milestones.isLoading || defs.some((q) => q.isLoading)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">{t("nav.checklist")}</h1>
        <p className="text-bungie-muted mt-1 text-sm">
          {t("checklist.subtitle")}
        </p>
      </div>

      {/* Reset timers */}
      <div className="stagger grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className={`panel border p-4 ${ACCENT_BORDER}`}>
          <div className={`text-[10px] tracking-widest uppercase ${ACCENT}`}>
            {t("checklist.weeklyReset")}
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {fmtCountdown(weekly, now)}
          </div>
          <div className="text-bungie-muted mt-1 text-[10px]">
            {new Intl.DateTimeFormat(undefined, {
              weekday: "short",
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }).format(weekly)}
          </div>
        </div>
        <div className="panel border-bungie-border border p-4">
          <div className="text-bungie-muted text-[10px] tracking-widest uppercase">
            {t("checklist.dailyReset")}
          </div>
          <div className="mt-1 text-2xl font-bold tabular-nums">
            {fmtCountdown(daily, now)}
          </div>
          <div className="text-bungie-muted mt-1 text-[10px]">
            {new Intl.DateTimeFormat(undefined, {
              weekday: "short",
              hour: "2-digit",
              minute: "2-digit",
            }).format(daily)}
          </div>
        </div>
      </div>

      {/* Tab selector */}
      <div className="border-bungie-border flex w-fit gap-1 self-start rounded-full border bg-black/30 p-1">
        {(
          [
            {
              k: "milestones",
              label: t("checklist.tabMilestones"),
              count: allVisible.length,
            },
            {
              k: "bounties",
              label: t("checklist.tabBounties"),
              count: totalBounties,
            },
            {
              k: "quests",
              label: t("checklist.tabQuests"),
              count: totalQuests,
            },
            {
              k: "triumphs",
              label: t("checklist.tabTriumphs"),
              count: totalTriumphs,
            },
          ] as const
        ).map((x) => {
          const active = tab === x.k
          return (
            <button
              key={x.k}
              onClick={() => setTab(x.k)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs transition-all ${
                active
                  ? "bg-bungie-accent font-semibold text-black"
                  : "text-bungie-text/70 hover:text-white"
              }`}
            >
              {x.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                  active ? "bg-black/20" : "bg-white/5"
                }`}
              >
                {x.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Filter bar */}
      <div className="panel flex flex-wrap items-center gap-2 p-3">
        {tab === "milestones" && (
          <div className="border-bungie-border flex gap-1 rounded-full border bg-black/30 p-1">
            {(["all", "todo", "claim", "done"] as const).map((s) => {
              const active = stateFilter === s
              const label =
                s === "all"
                  ? t("checklist.filterAll")
                  : s === "todo"
                    ? t("checklist.todo")
                    : s === "claim"
                      ? t("checklist.claim")
                      : t("checklist.done")
              const count =
                s === "all"
                  ? totals.all
                  : s === "todo"
                    ? totals.todo
                    : s === "claim"
                      ? totals.claim
                      : totals.done
              const accent =
                s === "claim"
                  ? "bg-emerald-400 text-black"
                  : s === "todo"
                    ? "bg-amber-400 text-black"
                    : s === "done"
                      ? "bg-white/20 text-white"
                      : "bg-bungie-accent text-black"
              return (
                <button
                  key={s}
                  onClick={() => setStateFilter(s)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all ${
                    active
                      ? `${accent} font-semibold`
                      : "text-bungie-text/70 hover:text-white"
                  }`}
                >
                  {label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                      active ? "bg-black/20" : "bg-white/5"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {tab === "milestones" && (
          <div className="border-bungie-border flex gap-1 rounded-full border bg-black/30 p-1">
            {(["all", "weekly", "daily"] as const).map((s) => {
              const active = typeFilter === s
              const label =
                s === "all"
                  ? t("checklist.filterAll")
                  : s === "weekly"
                    ? t("checklist.weekly")
                    : t("checklist.daily")
              const count =
                s === "all"
                  ? totals.all
                  : s === "weekly"
                    ? totals.weekly
                    : totals.daily
              return (
                <button
                  key={s}
                  onClick={() => setTypeFilter(s)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all ${
                    active
                      ? "bg-bungie-accent font-semibold text-black"
                      : "text-bungie-text/70 hover:text-white"
                  }`}
                >
                  {label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
                      active ? "bg-black/20" : "bg-white/5"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {characterIds.length > 1 && (
          <div className="border-bungie-border flex gap-1 rounded-full border bg-black/30 p-1">
            <button
              onClick={() => setCharFilter("all")}
              className={`rounded-full px-3 py-1.5 text-xs transition-all ${
                charFilter === "all"
                  ? "bg-bungie-accent font-semibold text-black"
                  : "text-bungie-text/70 hover:text-white"
              }`}
            >
              {t("checklist.allChars")}
            </button>
            {characterIds.map((cid) => {
              const c = chars?.[cid]
              if (!c) return null
              const className =
                classDefs[c.classHash]?.displayProperties?.name ?? "?"
              const active = charFilter === cid
              return (
                <button
                  key={cid}
                  onClick={() => setCharFilter(cid)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-all ${
                    active
                      ? "bg-bungie-accent font-semibold text-black"
                      : "text-bungie-text/70 hover:text-white"
                  }`}
                >
                  {c.emblemPath && (
                    <img
                      src={`https://www.bungie.net${c.emblemPath}`}
                      alt=""
                      className="h-4 w-4 rounded"
                    />
                  )}
                  {className}
                </button>
              )
            })}
          </div>
        )}

        <Dropdown
          value={sort}
          onChange={(v) => setSort(v as typeof sort)}
          variant="pill"
          size="sm"
          options={[
            { value: "default", label: t("checklist.sortDefault") },
            { value: "name", label: t("checklist.sortName") },
            { value: "progress", label: t("checklist.sortProgress") },
            ...(tab === "milestones"
              ? [{ value: "endsAt", label: t("checklist.sortEndsAt") }]
              : []),
          ]}
        />

        <input
          type="search"
          placeholder={t("checklist.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-bungie-panel/60 border-bungie-border focus:border-bungie-accent/60 min-w-40 flex-1 rounded-full border px-3 py-1.5 text-xs focus:outline-none"
        />
      </div>

      {milestones.isError && (
        <div className="panel border border-red-500/40 p-4">
          <p className="mb-1 font-semibold text-red-400">{t("common.error")}</p>
          <p className="text-bungie-muted text-sm">
            {String(milestones.error)}
          </p>
        </div>
      )}

      {loading && allVisible.length === 0 && (
        <p className="text-bungie-muted text-sm">{t("common.loading")}</p>
      )}

      {/* Claim rewards (highest priority — actionable now) */}
      {tab === "milestones" && showClaim && claimItems.length > 0 && (
        <StateSection
          title={t("checklist.claim")}
          color="text-emerald-300"
          bullet="★"
          items={claimItems}
          now={now}
          t={t}
          manifest={manifest}
        />
      )}

      {/* Not completed */}
      {tab === "milestones" && showTodo && todoItems.length > 0 && (
        <StateSection
          title={t("checklist.todo")}
          color="text-amber-300"
          bullet="◐"
          items={todoItems}
          now={now}
          t={t}
          manifest={manifest}
        />
      )}

      {/* Completed */}
      {tab === "milestones" && showDone && doneItems.length > 0 && (
        <StateSection
          title={t("checklist.done")}
          color="text-bungie-muted"
          bullet="✓"
          items={doneItems}
          now={now}
          t={t}
          manifest={manifest}
        />
      )}

      {!loading &&
        filtered.length > 0 &&
        !(showClaim && claimItems.length > 0) &&
        !(showTodo && todoItems.length > 0) &&
        !(showDone && doneItems.length > 0) && (
          <p className="text-bungie-muted text-sm">
            {t("checklist.noneForFilter")}
          </p>
        )}

      {!loading && filtered.length === 0 && allVisible.length > 0 && (
        <p className="text-bungie-muted text-sm">
          {t("checklist.noneForFilter")}
        </p>
      )}

      {/* Bounties tab */}
      {tab === "bounties" && (
        <PursuitsSection
          kind="bounties"
          charIds={pursuitCharIds}
          dataByChar={splitPursuits.bounties}
          chars={chars}
          classDefs={classDefs}
          locale={i18n.language}
          t={t}
          emptyLabel={t("checklist.noBounties")}
          totalCount={totalBounties}
          onPreview={setPreviewHash}
        />
      )}

      {/* Quests tab */}
      {tab === "quests" && (
        <PursuitsSection
          kind="quests"
          charIds={pursuitCharIds}
          dataByChar={splitPursuits.quests}
          chars={chars}
          classDefs={classDefs}
          locale={i18n.language}
          t={t}
          emptyLabel={t("checklist.noQuests")}
          totalCount={totalQuests}
          onPreview={setPreviewHash}
        />
      )}

      {/* Triumphs tab */}
      {tab === "triumphs" && (
        <>
          {totalTriumphs === 0 && !profile.isLoading && (
            <div className="panel text-bungie-muted p-6 text-center text-sm">
              {t("checklist.noTriumphs")}
            </div>
          )}

          {showTriumphClaim && triumphClaim.length > 0 && (
            <TriumphsSection
              title={t("checklist.claim")}
              color="text-emerald-300"
              bullet="★"
              items={triumphClaim}
            />
          )}

          {showTriumphProgress && triumphProgress.length > 0 && (
            <TriumphsSection
              title={t("checklist.inProgress")}
              color="text-amber-300"
              bullet="◐"
              items={triumphProgress}
            />
          )}

          {showTriumphDone && triumphDone.length > 0 && (
            <TriumphsSection
              title={t("checklist.done")}
              color="text-bungie-muted"
              bullet="✓"
              items={triumphDone}
            />
          )}
        </>
      )}

      {previewHash !== null && (
        <ItemPreviewModal
          itemHash={previewHash}
          onClose={() => setPreviewHash(null)}
        />
      )}
    </div>
  )
}

function StateSection({
  title,
  color,
  bullet,
  items,
  now,
  t,
  manifest,
}: {
  title: string
  color: string
  bullet: string
  items: EnrichedMilestone[]
  now: Date
  t: (key: string) => string
  manifest: ReturnType<typeof useManifestStore.getState>["manifest"]
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <span className={color}>{bullet}</span>
        <span>{title}</span>
        <span className="text-bungie-muted text-xs">({items.length})</span>
      </h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((m) => (
          <MilestoneCard
            key={m.hash}
            m={m}
            now={now}
            t={t}
            manifest={manifest}
          />
        ))}
      </div>
    </section>
  )
}

function MilestoneCard({
  m,
  now,
  t,
  manifest,
}: {
  m: EnrichedMilestone
  now: Date
  t: (key: string) => string
  manifest: ReturnType<typeof useManifestStore.getState>["manifest"]
}) {
  const name = m.def?.displayProperties?.name ?? `Milestone ${m.hash}`
  const description = m.def?.displayProperties?.description ?? ""
  const icon = m.def?.displayProperties?.icon

  // Resolve activity names and a fallback banner image from the activity
  // manifest when the milestone itself has no image.
  const actDefs = manifest?.DestinyActivityDefinition ?? {}
  const activities = m.raw?.activities ?? []
  const activityInfos = activities
    .map((a) => {
      const def = actDefs[a.activityHash]
      return {
        hash: a.activityHash,
        name: def?.displayProperties?.name,
        pgcrImage: def?.pgcrImage,
        modifiers: a.modifierHashes?.length ?? 0,
      }
    })
    .filter((x) => !!x.name || !!x.pgcrImage)

  const fallbackBanner = activityInfos.find((a) => a.pgcrImage)?.pgcrImage
  const bannerPath = m.def?.image || fallbackBanner

  const endHint = m.endsAt
    ? `${t("checklist.endsIn")} ${fmtCountdown(m.endsAt, now)}`
    : null

  const stateBadge =
    m.state === "claim"
      ? {
          label: `★ ${t("checklist.reward")}`,
          cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        }
      : m.state === "done"
        ? {
            label: `✓ ${t("checklist.stateDone")}`,
            cls: "bg-white/5 text-bungie-muted border-white/10",
          }
        : {
            label: `◐ ${t("checklist.stateTodo")}`,
            cls: "bg-amber-500/15 text-amber-300 border-amber-500/40",
          }

  return (
    <div
      className="panel relative flex min-h-40 flex-col overflow-hidden p-4"
      style={
        bannerPath
          ? {
              backgroundImage: `linear-gradient(180deg, rgba(7,7,13,0.45), rgba(7,7,13,0.94)), url(https://www.bungie.net${bannerPath})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : {
              backgroundImage:
                "linear-gradient(135deg, rgba(243,7,94,0.08), rgba(131,24,67,0.03))",
            }
      }
    >
      <div className="flex items-start gap-3">
        {icon && (
          <img
            src={`https://www.bungie.net${icon}`}
            alt=""
            className="h-10 w-10 shrink-0 rounded border border-white/20 bg-black/50"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="leading-tight font-bold text-white drop-shadow">
            {name}
          </div>
          {endHint && (
            <div className="mt-0.5 text-[10px] tracking-widest text-amber-300/80 uppercase">
              {endHint}
            </div>
          )}
        </div>
        <span
          className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase ${stateBadge.cls}`}
        >
          {stateBadge.label}
        </span>
      </div>

      {description && (
        <p className="mt-3 line-clamp-3 text-xs text-white/75">{description}</p>
      )}

      {activityInfos.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1 pt-3">
          {activityInfos.slice(0, 3).map((a) => (
            <span
              key={a.hash}
              className="max-w-50 truncate rounded-full border border-pink-400/40 bg-pink-400/10 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-pink-200 uppercase"
              title={a.name}
            >
              {a.name ?? `#${a.hash}`}
              {a.modifiers > 0 && (
                <span className="ml-1 opacity-60">·{a.modifiers}</span>
              )}
            </span>
          ))}
          {activityInfos.length > 3 && (
            <span className="text-bungie-muted self-center text-[10px]">
              +{activityInfos.length - 3}
            </span>
          )}
        </div>
      )}

      {m.charStates.length > 0 && (
        <div className="mt-1 flex items-center gap-1 border-t border-white/5 pt-2">
          <span className="text-bungie-muted text-[9px] tracking-widest uppercase">
            {t("checklist.perChar")}
          </span>
          {m.charStates.map((c) => {
            const color =
              c.state === "done"
                ? "bg-emerald-400"
                : c.state === "claim"
                  ? "bg-amber-400"
                  : c.state === "todo"
                    ? "bg-red-400/70"
                    : "bg-white/10"
            return (
              <span
                key={c.charId}
                className={`h-2.5 w-2.5 rounded-full ${color}`}
                title={`${c.charId}: ${c.state}`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function TriumphsSection({
  title,
  color,
  bullet,
  items,
}: {
  title: string
  color: string
  bullet: string
  items: Array<{
    hash: number
    rec: DestinyRecordComponent
    state: "claim" | "progress" | "done"
    def?: DestinyRecordDefinition
  }>
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <span className={color}>{bullet}</span>
        <span>{title}</span>
        <span className="text-bungie-muted text-xs">({items.length})</span>
      </h2>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <TriumphCard key={item.hash} item={item} />
        ))}
      </div>
    </section>
  )
}

function TriumphCard({
  item,
}: {
  item: {
    hash: number
    rec: DestinyRecordComponent
    state: "claim" | "progress" | "done"
    def?: DestinyRecordDefinition
  }
}) {
  const def = item.def
  const name = def?.displayProperties?.name ?? `Triumph ${item.hash}`
  const description = def?.displayProperties?.description ?? ""
  const icon = def?.displayProperties?.icon
  const objectives = item.rec.objectives ?? []

  const accentBorder =
    item.state === "claim"
      ? "border-emerald-500/50"
      : item.state === "done"
        ? "border-white/10"
        : "border-amber-500/30"

  const accentText =
    item.state === "claim"
      ? "text-emerald-300"
      : item.state === "done"
        ? "text-bungie-muted"
        : "text-amber-300"

  return (
    <div
      className={`panel flex gap-3 border p-3 ${accentBorder} transition-colors hover:border-white/30`}
    >
      {icon && (
        <img
          src={`https://www.bungie.net${icon}`}
          alt=""
          className="h-10 w-10 shrink-0 rounded border border-white/20 bg-black/40"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-white">
            {name}
          </span>
          <span
            className={`rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-widest uppercase ${accentBorder} ${accentText}`}
          >
            {item.state === "claim" ? "★" : item.state === "done" ? "✓" : "◐"}
          </span>
        </div>
        {description && (
          <p className="text-bungie-muted mt-0.5 line-clamp-2 text-[11px]">
            {description}
          </p>
        )}
        {objectives.length > 0 && (
          <div className="mt-2 space-y-1">
            {objectives.slice(0, 2).map((o, i) => {
              const target = o.completionValue || 1
              const prog = Math.min(target, o.progress ?? 0)
              const pct = (prog / target) * 100
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-[10px] tabular-nums">
                    <span className="text-bungie-muted">
                      {prog.toLocaleString()} / {target.toLocaleString()}
                    </span>
                    <span
                      className={
                        o.complete ? "text-emerald-300" : "text-white/60"
                      }
                    >
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-black/40">
                    <div
                      className={`h-full ${o.complete ? "bg-emerald-400/70" : "bg-pink-400/60"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {objectives.length > 2 && (
              <div className="text-bungie-muted text-[10px]">
                +{objectives.length - 2}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

type PursuitEntry = {
  itemHash: number
  itemInstanceId?: string
  objectives: DestinyObjectiveProgress[]
}

function PursuitsSection({
  kind,
  charIds,
  dataByChar,
  chars,
  classDefs,
  locale,
  t,
  emptyLabel,
  totalCount,
  onPreview,
}: {
  kind: "bounties" | "quests"
  charIds: string[]
  dataByChar: Record<string, PursuitEntry[]>
  chars: Record<string, { classHash: number; emblemPath?: string }> | undefined
  classDefs: Record<
    number,
    { displayProperties?: { name?: string } } | undefined
  >
  locale: string
  t: (key: string) => string
  emptyLabel: string
  totalCount: number
  onPreview: (hash: number) => void
}) {
  const accentText = kind === "bounties" ? "text-amber-300" : "text-pink-300"
  const headerBullet = kind === "bounties" ? "◈" : "☰"
  const title =
    kind === "bounties"
      ? t("checklist.bountiesTitle")
      : t("checklist.questsTitle")

  if (totalCount === 0) {
    return (
      <div className="panel text-bungie-muted p-6 text-center text-sm">
        {emptyLabel}
      </div>
    )
  }

  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <span className={accentText}>{headerBullet}</span>
        <span>{title}</span>
        <span className="text-bungie-muted text-xs">({totalCount})</span>
      </h2>
      <div className="space-y-4">
        {charIds.map((cid) => {
          const list = dataByChar[cid] ?? []
          if (list.length === 0) return null
          const c = chars?.[cid]
          const className =
            classDefs[c?.classHash ?? 0]?.displayProperties?.name ?? "—"
          return (
            <div key={cid}>
              <h3 className="text-bungie-muted mb-2 flex items-center gap-2 text-xs font-semibold">
                {c?.emblemPath && (
                  <img
                    src={`https://www.bungie.net${c.emblemPath}`}
                    alt=""
                    className="h-5 w-5 rounded border border-white/10"
                  />
                )}
                <span className="text-white">{className}</span>
                <span>·</span>
                <span>
                  {list.length} {t("checklist.pursuitsCount")}
                </span>
              </h3>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {list.map((p, i) => (
                  <PursuitCard
                    key={`${p.itemInstanceId ?? p.itemHash}-${i}`}
                    itemHash={p.itemHash}
                    objectives={p.objectives}
                    locale={locale}
                    t={t}
                    onClick={onPreview}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function PursuitCard({
  itemHash,
  objectives,
  locale,
  t,
  onClick,
}: {
  itemHash: number
  objectives: DestinyObjectiveProgress[]
  locale: string
  t: (key: string) => string
  onClick: (hash: number) => void
}) {
  const { data: def } = useQuery<DestinyInventoryItemDefinition>({
    queryKey: ["itemDef", itemHash, locale],
    queryFn: () => getItemDef(itemHash, locale),
    staleTime: Infinity,
    gcTime: Infinity,
  })

  const name = def?.displayProperties?.name ?? `Item ${itemHash}`
  const icon = def?.displayProperties?.icon
  const typeName = def?.itemTypeDisplayName ?? ""
  const isBounty = def?.itemType === ITEM_TYPE.Bounty
  const allComplete =
    objectives.length > 0 && objectives.every((o) => o.complete)

  const progressPct =
    objectives.length > 0
      ? objectives.reduce((acc, o) => {
          const target = o.completionValue || 1
          return acc + Math.min(1, (o.progress ?? 0) / target)
        }, 0) / objectives.length
      : 0

  const accentBorder = allComplete
    ? "border-emerald-500/50"
    : isBounty
      ? "border-amber-500/30"
      : "border-pink-500/30"

  return (
    <button
      type="button"
      onClick={() => onClick(itemHash)}
      className={`panel flex cursor-pointer gap-3 border p-3 text-left transition-all hover:-translate-y-0.5 ${accentBorder} hover:border-white/40`}
    >
      {icon && (
        <img
          src={`https://www.bungie.net${icon}`}
          alt=""
          className="h-10 w-10 shrink-0 rounded border border-white/20 bg-black/40"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-white">
            {name}
          </span>
          {allComplete && (
            <span className="rounded border border-emerald-500/40 bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-emerald-300 uppercase">
              ✓ {t("checklist.pursuitDone")}
            </span>
          )}
        </div>
        {typeName && (
          <div className="text-bungie-muted text-[10px] tracking-widest uppercase">
            {typeName}
          </div>
        )}

        {objectives.length > 0 && (
          <div className="mt-2 space-y-1">
            {objectives.slice(0, 3).map((o, i) => {
              const target = o.completionValue || 1
              const prog = Math.min(target, o.progress ?? 0)
              const pct = (prog / target) * 100
              return (
                <div key={i}>
                  <div className="flex items-center justify-between text-[10px] tabular-nums">
                    <span className="text-bungie-muted">
                      {prog.toLocaleString()} / {target.toLocaleString()}
                    </span>
                    <span
                      className={
                        o.complete ? "text-emerald-300" : "text-white/60"
                      }
                    >
                      {Math.round(pct)}%
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-black/40">
                    <div
                      className={`h-full ${o.complete ? "bg-emerald-400/70" : "bg-pink-400/60"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {objectives.length > 3 && (
              <div className="text-bungie-muted text-[10px]">
                +{objectives.length - 3} {t("checklist.moreObjectives")}
              </div>
            )}
          </div>
        )}

        {objectives.length === 0 && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full bg-pink-400/60"
              style={{ width: `${progressPct * 100}%` }}
            />
          </div>
        )}
      </div>
    </button>
  )
}
