import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

interface UpdateInfo {
  version: string
  date?: string
  body?: string
  download: () => Promise<void>
  install: () => Promise<void>
}

/**
 * Checks for Tauri app updates on mount and whenever the user hits "refresh".
 * Displays a banner when one is available and drives the download → install → relaunch flow.
 *
 * The endpoint + signing key are configured in `src-tauri/tauri.conf.json > plugins.updater`.
 */
export function UpdateBanner() {
  const { t } = useTranslation()
  const [update, setUpdate] = useState<UpdateInfo | null>(null)
  const [state, setState] = useState<
    "idle" | "downloading" | "ready" | "error"
  >("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { check } = await import("@tauri-apps/plugin-updater")
        const found = await check()
        if (cancelled || !found) return

        let total = 0
        let got = 0
        setUpdate({
          version: found.version,
          date: found.date,
          body: found.body,
          download: async () => {
            setState("downloading")
            await found.download((ev) => {
              if (ev.event === "Started") {
                total = ev.data.contentLength ?? 0
                got = 0
              } else if (ev.event === "Progress") {
                got += ev.data.chunkLength
                setProgress(total > 0 ? got / total : 0)
              } else if (ev.event === "Finished") {
                setProgress(1)
              }
            })
            setState("ready")
          },
          install: async () => {
            await found.install()
            const { relaunch } = await import("@tauri-apps/plugin-process")
            await relaunch()
          },
        })
      } catch (e) {
        // Silent for expected "no release yet" errors — don't scare the user.
        // These happen when GitHub Releases is empty, network is offline, or
        // the signature doesn't match. None are actionable from the UI.
        const msg = String(e).toLowerCase()
        const expected =
          msg.includes("could not fetch") ||
          msg.includes("valid release json") ||
          msg.includes("network") ||
          msg.includes("status code: 404") ||
          msg.includes("timeout") ||
          msg.includes("dns") ||
          msg.includes("connect") ||
          // reqwest surfaces transport failures as "error sending request"
          // — don't surface those to the user either.
          msg.includes("error sending request") ||
          msg.includes("resolve") ||
          msg.includes("failed to lookup") ||
          msg.includes("unreachable")
        if (import.meta.env.DEV || expected) {
          console.warn("[updater]", e)
        } else {
          setError(String(e))
          setState("error")
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!update && state !== "error") return null

  if (state === "error") {
    return (
      <div className="flex items-center gap-2 border-b border-red-500/30 bg-red-500/10 px-5 py-2 text-xs text-red-300">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        <span>
          {t("update.error")}: {error}
        </span>
      </div>
    )
  }

  if (!update) return null

  return (
    <div className="from-bungie-accent/15 via-bungie-accent/5 border-bungie-accent/30 flex items-center gap-3 border-b bg-linear-to-r to-transparent px-5 py-2 text-xs">
      <span className="text-bungie-accent inline-flex items-center gap-2 font-semibold tracking-wider uppercase">
        <span className="bg-bungie-accent h-1.5 w-1.5 animate-pulse rounded-full" />
        {t("update.available")}
      </span>
      <span className="font-bold text-white">v{update.version}</span>
      {update.date && (
        <span className="text-bungie-muted">· {update.date.split(" ")[0]}</span>
      )}

      <div className="flex-1" />

      {state === "idle" && (
        <button
          onClick={() => void update.download()}
          className="bg-bungie-accent h-7 rounded-full px-3 text-[11px] font-bold text-black transition hover:brightness-110"
        >
          {t("update.download")}
        </button>
      )}
      {state === "downloading" && (
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-black/40">
            <div
              className="bg-bungie-accent h-full transition-[width] duration-200"
              style={{ width: `${(progress * 100).toFixed(0)}%` }}
            />
          </div>
          <span className="text-bungie-muted tabular-nums">
            {(progress * 100).toFixed(0)}%
          </span>
        </div>
      )}
      {state === "ready" && (
        <button
          onClick={() => void update.install()}
          className="h-7 rounded-full bg-emerald-400 px-3 text-[11px] font-bold text-black transition hover:brightness-110"
        >
          {t("update.installRestart")}
        </button>
      )}
    </div>
  )
}
