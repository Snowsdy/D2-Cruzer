import { create } from "zustand";
import { loadLightManifest, type LightManifest } from "@/api/manifest";

interface ManifestState {
  manifest: LightManifest | null;
  loading: boolean;
  error: string | null;
  load: (locale?: string) => Promise<void>;
}

// Tables that, if missing from an already-loaded manifest, indicate the
// in-memory copy is stale (e.g. user upgraded the app and we added a new
// table to LIGHT_TABLES). When any of these are missing we refetch so the
// sidebar crests / new features pick up the added data immediately.
const REQUIRED_TABLES: Array<keyof LightManifest> = [
  "DestinyInventoryBucketDefinition",
  "DestinyPresentationNodeDefinition",
  "DestinyItemCategoryDefinition",
];

export const useManifestStore = create<ManifestState>((set, get) => ({
  manifest: null,
  loading: false,
  error: null,
  load: async (locale = "fr") => {
    if (get().loading) return;
    const cur = get().manifest;
    const complete =
      cur &&
      cur.locale === locale &&
      REQUIRED_TABLES.every(
        (t) => cur[t] && Object.keys(cur[t] as object).length > 0
      );
    if (complete) return;
    set({ loading: true, error: null });
    try {
      const manifest = await loadLightManifest(locale);
      set({ manifest, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },
}));