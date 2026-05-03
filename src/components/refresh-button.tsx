import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { IconRefresh } from "./icon";

/**
 * Only invalidate *dynamic* queries — keep static data (itemDef, manifest
 * tables, armor/perk defs) in the cache so refresh is instant instead of
 * triggering thousands of background fetches.
 */
const DYNAMIC_QUERY_KEYS = new Set([
  "profile",
  "memberships",
  "vendor",
  "vendors",
  "milestones",
  "news",
  "tweets",
  "xur",
  "activityHistory",
  "aggregateActivityStats",
  "pgcr",
  "d2checkpointBots",
  "d2checkpointAlerts",
  "season",
]);

export function RefreshButton() {
  const qc = useQueryClient();
  const anyFetching = useIsFetching() > 0;
  const { t } = useTranslation();

  const refresh = () => {
    qc.invalidateQueries({
      predicate: (q) => {
        const head = q.queryKey[0];
        return typeof head === "string" && DYNAMIC_QUERY_KEYS.has(head);
      },
    });
  };

  return (
    <button
      onClick={refresh}
      title={t("common.refresh")}
      className={`relative w-9 h-9 rounded-full flex items-center justify-center border border-bungie-border hover:border-bungie-accent/50 transition-colors ${
        anyFetching ? "text-bungie-accent" : "text-bungie-muted hover:text-white"
      }`}
    >
      <IconRefresh size={15} className={anyFetching ? "animate-spin" : ""} />
      <span
        className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
          anyFetching ? "bg-bungie-accent animate-pulse" : "bg-emerald-400"
        }`}
        title="Live · sync continu Bungie"
      />
    </button>
  );
}