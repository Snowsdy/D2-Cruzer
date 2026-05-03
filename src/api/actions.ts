// Item actions: equip, transfer (move between character ↔ vault).
// All routed through Rust commands so Bungie doesn't see a webview Origin header.
import { trackedInvoke } from "@/lib/tauri";
import { useAuthStore } from "@/store/auth";

const API_KEY = import.meta.env.VITE_BUNGIE_API_KEY as string;

export interface ActionErrorPayload {
  status: number;
  error_code: number | null;
  message: string;
}

async function getTokenOrThrow(): Promise<string> {
  const token = useAuthStore.getState().accessToken;
  if (!token) throw new Error("Not authenticated");
  return token;
}

export async function equipItem(params: {
  itemInstanceId: string;
  characterId: string;
  membershipType: number;
}): Promise<void> {
  await trackedInvoke("equip_item", {
    apiKey: API_KEY,
    accessToken: await getTokenOrThrow(),
    itemId: params.itemInstanceId,
    characterId: params.characterId,
    membershipType: params.membershipType,
  });
}

export async function transferItem(params: {
  itemReferenceHash: number;
  stackSize: number;
  toVault: boolean;
  itemInstanceId: string;
  characterId: string;
  membershipType: number;
}): Promise<void> {
  await trackedInvoke("transfer_item", {
    apiKey: API_KEY,
    accessToken: await getTokenOrThrow(),
    itemReferenceHash: params.itemReferenceHash,
    stackSize: params.stackSize,
    transferToVault: params.toVault,
    itemId: params.itemInstanceId,
    characterId: params.characterId,
    membershipType: params.membershipType,
  });
}