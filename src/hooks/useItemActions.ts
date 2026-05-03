import { useMutation, useQueryClient } from "@tanstack/react-query";
import { equipItem, transferItem, type ActionErrorPayload } from "@/api/actions";
import { useSelectedMembership } from "./useProfile";
import { toast } from "@/store/toast";
import i18n from "@/i18n";

function describeError(e: unknown): string {
  if (e && typeof e === "object" && "status" in e && "message" in e) {
    const err = e as ActionErrorPayload;
    return `${err.message || "Unknown"} (${err.status}${
      err.error_code ? ` code ${err.error_code}` : ""
    })`;
  }
  return e instanceof Error ? e.message : String(e);
}

export function useItemActions() {
  const qc = useQueryClient();
  const membership = useSelectedMembership();
  const membershipType = membership?.membershipType ?? 0;

  // Always refetch profile after any mutation settles so UI mirrors server state.
  // Bungie API has ~500-1500ms eventual consistency after a successful transfer,
  // so we refetch immediately AND again after 1s/2.5s to catch the final state.
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["profile"] });
    setTimeout(() => qc.refetchQueries({ queryKey: ["profile"] }), 1000);
    setTimeout(() => qc.refetchQueries({ queryKey: ["profile"] }), 2500);
  };

  const equip = useMutation({
    mutationFn: async (params: {
      itemInstanceId: string;
      characterId: string;
    }) => {
      await equipItem({ ...params, membershipType });
    },
    onSuccess: () => {
      toast.success(i18n.t("toasts.itemEquipped"));
      invalidate();
    },
    onError: (e) => {
      toast.error(i18n.t("toasts.equipFailed", { error: describeError(e) }));
      invalidate();
    },
  });

  const moveToCharacter = useMutation({
    mutationFn: async (params: {
      itemInstanceId: string;
      itemReferenceHash: number;
      fromCharacterId: string | null;
      toCharacterId: string;
    }) => {
      if (
        params.fromCharacterId &&
        params.fromCharacterId !== params.toCharacterId
      ) {
        await transferItem({
          itemInstanceId: params.itemInstanceId,
          itemReferenceHash: params.itemReferenceHash,
          stackSize: 1,
          toVault: true,
          characterId: params.fromCharacterId,
          membershipType,
        });
        // Invalidate between steps so UI reflects the intermediate vault state
        invalidate();
      }
      if (
        !params.fromCharacterId ||
        params.fromCharacterId !== params.toCharacterId
      ) {
        await transferItem({
          itemInstanceId: params.itemInstanceId,
          itemReferenceHash: params.itemReferenceHash,
          stackSize: 1,
          toVault: false,
          characterId: params.toCharacterId,
          membershipType,
        });
      }
    },
    onSuccess: () => {
      toast.success(i18n.t("toasts.itemTransferred"));
      invalidate();
    },
    onError: (e) => {
      toast.error(i18n.t("toasts.transferFailed", { error: describeError(e) }));
      invalidate();
    },
  });

  const moveToVault = useMutation({
    mutationFn: async (params: {
      itemInstanceId: string;
      itemReferenceHash: number;
      fromCharacterId: string;
    }) => {
      await transferItem({
        itemInstanceId: params.itemInstanceId,
        itemReferenceHash: params.itemReferenceHash,
        stackSize: 1,
        toVault: true,
        characterId: params.fromCharacterId,
        membershipType,
      });
    },
    onSuccess: () => {
      toast.success(i18n.t("toasts.sentToVault"));
      invalidate();
    },
    onError: (e) => {
      toast.error(i18n.t("toasts.vaultTransferFailed", { error: describeError(e) }));
      invalidate();
    },
  });

  return { equip, moveToCharacter, moveToVault, membershipType };
}