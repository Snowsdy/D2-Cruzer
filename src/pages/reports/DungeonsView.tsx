import { ActivityList } from "./ActivityList";
import { ActivityModes } from "@/api/activityStats";

export function DungeonsView() {
  return (
    <ActivityList
      activityMode={ActivityModes.Dungeon}
      accentText="text-pink-300"
      accentBorder="border-pink-500/40"
    />
  );
}