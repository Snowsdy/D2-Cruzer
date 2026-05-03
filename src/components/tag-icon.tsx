import type { ItemTag } from "@/store/tags";
import {
  IconStar,
  IconCheckmark,
  IconTrash,
  IconArrowUp,
  IconArchive,
} from "./icon";

interface Props {
  tag: ItemTag;
  size?: number;
}

export function TagIcon({ tag, size = 12 }: Props) {
  switch (tag) {
    case "favorite":
      return <IconStar size={size} />;
    case "keep":
      return <IconCheckmark size={size} />;
    case "junk":
      return <IconTrash size={size} />;
    case "infuse":
      return <IconArrowUp size={size} />;
    case "archive":
      return <IconArchive size={size} />;
  }
}