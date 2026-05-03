import { ActivityList } from "./ActivityList";
import { ActivityModes } from "../../api/activityStats";

export function RaidsView() {
  return (
    <ActivityList
      activityMode={ActivityModes.Raid}
      accentText="text-red-300"
      accentBorder="border-red-500/40"
    />
  );
}