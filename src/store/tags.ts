import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SK_TAGS } from "@/constants/storageKeys";

export type ItemTag =
  | "favorite"
  | "keep"
  | "junk"
  | "infuse"
  | "archive";

export const TAG_META: Record<ItemTag, { color: string; label: string }> = {
  favorite: { color: "#fbbf24", label: "Favori" },
  keep: { color: "#f3075e", label: "Garder" },
  junk: { color: "#ef4444", label: "Jeter" },
  infuse: { color: "#a855f7", label: "Infuser" },
  archive: { color: "#8b8fa1", label: "Archive" },
};

export const TAG_ORDER: ItemTag[] = ["favorite", "keep", "infuse", "junk", "archive"];

interface TagsState {
  tags: Record<string, ItemTag>;
  notes: Record<string, string>;
  setTag: (id: string, tag: ItemTag | null) => void;
  setNote: (id: string, note: string) => void;
  getTag: (id: string | undefined) => ItemTag | null;
  getNote: (id: string | undefined) => string;
}

export const useTagsStore = create<TagsState>()(
  persist(
    (set, get) => ({
      tags: {},
      notes: {},
      setTag: (id, tag) =>
        set((s) => {
          const tags = { ...s.tags };
          if (tag === null) delete tags[id];
          else tags[id] = tag;
          return { tags };
        }),
      setNote: (id, note) =>
        set((s) => {
          const notes = { ...s.notes };
          if (note.trim() === "") delete notes[id];
          else notes[id] = note;
          return { notes };
        }),
      getTag: (id) => (id ? (get().tags[id] ?? null) : null),
      getNote: (id) => (id ? (get().notes[id] ?? "") : ""),
    }),
    {
      name: SK_TAGS,
      storage: createJSONStorage(() => localStorage),
    }
  )
);