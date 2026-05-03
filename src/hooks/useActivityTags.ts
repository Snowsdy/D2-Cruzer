import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useProfile } from "./useProfile";
import { useSelectedMembership } from "./useProfile";
import {
  getActivityHistory,
  getPgcr,
  type ActivityHistoryEntry,
} from "@/api/activityStats";

/**
 * Per-activity computed tags from real PGCR (Post Game Carnage Report) data.
 * Caps at MAX_INSTANCES per activity to bound the number of API calls.
 */
const MAX_INSTANCES_PER_ACTIVITY = 25;
const MAX_TOTAL_PGCRS = 200;

export interface ActivityTags {
  flawlessTotal: number;
  flawlessSolo: number;
  soloClears: number;
  duoClears: number;
  trioClears: number;
  fastestMs: number;
  totalAnalyzed: number;
  // Extended stats
  avgDurationMs: number;
  totalDurationMs: number;
  myKills: number; // sum of user's character kills across analyzed runs
  myDeaths: number;
  myAssists: number;
  bestKillsSingleRun: number;
  bestKdSingleRun: number; // kills/deaths ratio of best run
  lastCompletedISO: string | null; // most recent completion date
}

export function useActivityTags(mode: number) {
  const { profile } = useProfile();
  const membership = useSelectedMembership();
  const characterIds = useMemo(() => {
    return profile.data?.characters?.data
    ? Object.keys(profile.data.characters.data)
    : []
  }, [profile]);

  // Step 1: Fetch activity history for each character × mode
  const historyQueries = useQueries({
    queries: characterIds.map((cid) => ({
      queryKey: [
        "activityHistory",
        membership?.membershipType,
        membership?.membershipId,
        cid,
        mode,
      ],
      queryFn: () =>
        getActivityHistory(
          membership!.membershipType,
          membership!.membershipId,
          cid,
          mode
        ),
      enabled: !!membership,
      staleTime: 30_000,
      refetchInterval: 60_000,
    })),
  });

  // Step 2: Collect instance ids per activity hash, cap to MAX_INSTANCES_PER_ACTIVITY
  const instancesByActivity = useMemo(() => {
    const map = new Map<number, ActivityHistoryEntry[]>();
    for (const q of historyQueries) {
      const acts = q.data?.activities ?? [];
      for (const a of acts) {
        const completed = (a.values.completed?.basic.value ?? 0) === 1;
        if (!completed) continue;
        const arr = map.get(a.activityDetails.referenceId) ?? [];
        if (arr.length < MAX_INSTANCES_PER_ACTIVITY) {
          arr.push(a);
          map.set(a.activityDetails.referenceId, arr);
        }
      }
    }
    return map;
  }, [historyQueries]);

  // Step 3: Build flat list of instances to fetch PGCRs for, capped globally.
  // Keep the period and the user's character id so we can attribute stats correctly.
  const allInstances = useMemo(() => {
    const list: {
      activityHash: number;
      instanceId: string;
      period: string;
    }[] = [];
    for (const [activityHash, entries] of instancesByActivity) {
      for (const e of entries) {
        list.push({
          activityHash,
          instanceId: e.activityDetails.instanceId,
          period: e.period,
        });
        if (list.length >= MAX_TOTAL_PGCRS) break;
      }
      if (list.length >= MAX_TOTAL_PGCRS) break;
    }
    return list;
  }, [instancesByActivity]);

  // Step 4: Fetch PGCRs in parallel (TanStack throttles + caches infinitely)
  const pgcrQueries = useQueries({
    queries: allInstances.map((inst) => ({
      queryKey: ["pgcr", inst.instanceId],
      queryFn: () => getPgcr(inst.instanceId),
      staleTime: Infinity,
      gcTime: Infinity,
    })),
  });

  const isLoading =
    historyQueries.some((q) => q.isLoading) ||
    pgcrQueries.some((q) => q.isLoading);

  // User's destiny membership ids — needed to identify which entry is "us"
  const userMembershipId = membership?.membershipId;
  const userCharacterIds = useMemo(() => {
    return new Set(characterIds)
  }, [characterIds]);

  // Step 5: Compute tags per activity hash from the PGCRs
  const tagsByActivity = useMemo(() => {
    const map = new Map<number, ActivityTags>();
    allInstances.forEach((inst, i) => {
      const pgcr = pgcrQueries[i]?.data;
      if (!pgcr) return;

      const t: ActivityTags = map.get(inst.activityHash) ?? {
        flawlessTotal: 0,
        flawlessSolo: 0,
        soloClears: 0,
        duoClears: 0,
        trioClears: 0,
        fastestMs: 0,
        totalAnalyzed: 0,
        avgDurationMs: 0,
        totalDurationMs: 0,
        myKills: 0,
        myDeaths: 0,
        myAssists: 0,
        bestKillsSingleRun: 0,
        bestKdSingleRun: 0,
        lastCompletedISO: null,
      };
      t.totalAnalyzed += 1;

      const fireteamSize = pgcr.entries.length;
      if (fireteamSize === 1) t.soloClears += 1;
      else if (fireteamSize === 2) t.duoClears += 1;
      else if (fireteamSize === 3) t.trioClears += 1;

      const allFlawless = pgcr.entries.every(
        (e) =>
          (e.values.deaths?.basic.value ?? 999) === 0 &&
          (e.values.completed?.basic.value ?? 0) === 1
      );
      if (allFlawless) {
        t.flawlessTotal += 1;
        if (fireteamSize === 1) t.flawlessSolo += 1;
      }

      const dur = pgcr.entries[0]?.values.activityDurationSeconds?.basic.value ?? 0;
      const ms = dur * 1000;
      if (ms > 0) {
        t.totalDurationMs += ms;
        if (t.fastestMs === 0 || ms < t.fastestMs) t.fastestMs = ms;
      }

      // Find user's entry (matching membershipId OR matching one of our characterIds)
      const myEntry = pgcr.entries.find(
        (e) =>
          e.player.destinyUserInfo.membershipId === userMembershipId ||
          userCharacterIds.has(e.characterId)
      );
      if (myEntry) {
        const k = myEntry.values.kills?.basic.value ?? 0;
        const d = myEntry.values.deaths?.basic.value ?? 0;
        const a = myEntry.values.assists?.basic.value ?? 0;
        t.myKills += k;
        t.myDeaths += d;
        t.myAssists += a;
        if (k > t.bestKillsSingleRun) t.bestKillsSingleRun = k;
        const kd = d === 0 ? k : k / d;
        if (kd > t.bestKdSingleRun) t.bestKdSingleRun = kd;
      }

      // Track most recent completion date
      if (!t.lastCompletedISO || inst.period > t.lastCompletedISO) {
        t.lastCompletedISO = inst.period;
      }

      map.set(inst.activityHash, t);
    });

    // Compute averages
    for (const [, t] of map) {
      if (t.totalAnalyzed > 0) {
        t.avgDurationMs = Math.round(t.totalDurationMs / t.totalAnalyzed);
      }
    }
    return map;
  }, [allInstances, pgcrQueries, userMembershipId, userCharacterIds]);

  return { tagsByActivity, isLoading, totalAnalyzed: allInstances.length };
}