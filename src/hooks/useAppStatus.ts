/**
 * React Query subscription to the maintainer-controlled `status.json`.
 *
 * Cadence:
 *   - First fetch on app mount (via Layout)
 *   - Re-fetch every 3 minutes while the window is focused
 *   - No retry storm — one attempt, fail silently, try again next interval
 */
import { useQuery } from "@tanstack/react-query";
import {
  EMPTY_APP_STATUS,
  fetchAppStatus,
  activeAnnouncements,
  type AppStatus,
  type Announcement,
} from "@/api/appStatus";
import { useDismissedAnnouncements } from "@/store/dismissedAnnouncements";

export function useAppStatus() {
  const query = useQuery<AppStatus>({
    queryKey: ["appStatus"],
    queryFn: ({ signal }) =>
      fetchAppStatus(signal).then((s) => s ?? EMPTY_APP_STATUS),
    staleTime: 60_000,
    refetchInterval: 3 * 60_000,
    retry: false,
  });
  return query;
}

/**
 * Convenience wrapper returning the currently-visible announcements —
 * expired ones filtered out and dismissed ones subtracted. Ready to render.
 */
export function useVisibleAnnouncements(): Announcement[] {
  const { data } = useAppStatus();
  const dismissedIds = useDismissedAnnouncements((s) => s.ids);
  if (!data) return [];
  return activeAnnouncements(data.announcements).filter(
    (a) => !dismissedIds.includes(a.id)
  );
}