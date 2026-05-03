import { trackedInvoke } from "@/lib/tauri"

export interface D2CheckpointBot {
  name: string
  steam: string
  membershipId: string
  activityHash: number
  encounter: number
  premium: boolean
}

export const fetchD2CheckpointBots = () =>
  trackedInvoke<D2CheckpointBot[]>("d2checkpoint_bots")

export const fetchD2CheckpointAlerts = () =>
  trackedInvoke<unknown>("d2checkpoint_alerts")
