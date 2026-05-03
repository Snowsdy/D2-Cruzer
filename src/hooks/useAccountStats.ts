import { useQuery } from "@tanstack/react-query";
import { getAccountStats } from "@/api/stats";
import { useSelectedMembership } from "./useProfile";

export function useAccountStats() {
  const membership = useSelectedMembership();

  return useQuery({
    queryKey: ["accountStats", membership?.membershipType, membership?.membershipId],
    queryFn: () => getAccountStats(membership!.membershipType, membership!.membershipId),
    enabled: !!membership,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}