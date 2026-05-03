import { useQuery } from "@tanstack/react-query"
import { bungieGet } from "../api/bungie"

/**
 * `GET /Platform/GlobalAlerts/` — maintenance / service banners.
 * See https://bungie-net.github.io/multi/schema_GlobalAlert.html
 */
interface GlobalAlert {
  AlertKey: string
  AlertHtml: string
  AlertTimestamp: string
  AlertLink: string
  AlertLevel: number
  AlertType: number
  StreamInfo: unknown
}

interface BungieSettings {
  systems?: Record<string, { enabled: boolean }>
}

export type MaintenanceSeverity = "info" | "warning" | "critical"

export interface GameStatus {
  /** True when Destiny 2 is currently disabled / under maintenance. */
  maintenance: boolean
  severity: MaintenanceSeverity
  message: string | null
  link: string | null
}

function alertSeverity(level: number): MaintenanceSeverity {
  // 0=Blue, 1=Yellow, 2=Red per Bungie schema.
  if (level >= 2) return "critical"
  if (level === 1) return "warning"
  return "info"
}

export function useGameStatus() {
  const alerts = useQuery({
    queryKey: ["globalAlerts"],
    queryFn: () => bungieGet<GlobalAlert[]>("/GlobalAlerts/", { auth: false }),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  const settings = useQuery({
    queryKey: ["bungieSettings"],
    queryFn: () => bungieGet<BungieSettings>("/Settings/", { auth: false }),
    staleTime: 2 * 60_000,
    refetchInterval: 2 * 60_000,
  })

  const status: GameStatus = (() => {
    const alertList = alerts.data ?? []
    const topAlert = alertList[0]

    const systems = settings.data?.systems ?? {}
    const destinyDown = systems.Destiny2?.enabled === false
    const profilesDown = systems.D2Profiles?.enabled === false

    if (topAlert) {
      return {
        maintenance: destinyDown || profilesDown,
        severity: alertSeverity(topAlert.AlertLevel),
        message: topAlert.AlertHtml,
        link: topAlert.AlertLink || null,
      }
    }
    if (destinyDown || profilesDown) {
      return {
        maintenance: true,
        severity: "critical",
        message:
          "Destiny 2 est actuellement en maintenance. L'API Bungie limite les actions jusqu'à la fin de l'opération.",
        link: null,
      }
    }
    return { maintenance: false, severity: "info", message: null, link: null }
  })()

  return { status, isLoading: alerts.isLoading || settings.isLoading }
}
