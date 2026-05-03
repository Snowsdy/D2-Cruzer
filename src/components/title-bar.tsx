import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { getCurrentWindow } from "@tauri-apps/api/window"
import cruzerLogo from "@/assets/cruzer-logo.png"

export function TitleBar() {
  const { t } = useTranslation()
  const [isMax, setIsMax] = useState(false)

  useEffect(() => {
    const w = getCurrentWindow()
    let unlistenResize: (() => void) | undefined
    ;(async () => {
      try {
        setIsMax(await w.isMaximized())
        unlistenResize = await w.onResized(async () => {
          setIsMax(await w.isMaximized())
        })
      } catch {
        // No-op outside Tauri
      }
    })()
    return () => {
      unlistenResize?.()
    }
  }, [])

  const minimize = () => {
    void getCurrentWindow().minimize()
  }
  const toggleMax = () => {
    void getCurrentWindow().toggleMaximize()
  }
  const close = () => {
    void getCurrentWindow().close()
  }

  return (
    <div
      data-tauri-drag-region
      className="bg-bungie-bg border-bungie-border/60 relative flex h-9 items-center border-b pr-0 pl-3 text-[11px] select-none"
    >
      {/* Brand left */}
      <div
        className="pointer-events-none flex items-center gap-2"
        data-tauri-drag-region
      >
        <img
          src={cruzerLogo}
          alt=""
          className="logo-pulse h-4 w-4 drop-shadow-[0_0_4px_rgba(243,7,94,0.6)]"
        />
        <span className="text-gradient text-[11px] font-extrabold tracking-[0.18em] uppercase">
          Cruzer Compagnon
        </span>
      </div>

      {/* Drag region fills remaining space */}
      <div className="h-full flex-1" data-tauri-drag-region />

      {/* Window controls */}
      <div className="flex h-full items-stretch">
        <button
          onClick={minimize}
          title={t("common.minimize")}
          aria-label={t("common.minimize")}
          className="flex h-full w-11 items-center justify-center text-white/70 transition-colors hover:bg-white/8 hover:text-white"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <line x1="1" y1="5" x2="9" y2="5" />
          </svg>
        </button>
        <button
          onClick={toggleMax}
          title={isMax ? t("common.restore") : t("common.maximize")}
          aria-label={isMax ? t("common.restore") : t("common.maximize")}
          className="flex h-full w-11 items-center justify-center text-white/70 transition-colors hover:bg-white/8 hover:text-white"
        >
          {isMax ? (
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <rect x="2.5" y="0.5" width="7" height="7" />
              <rect
                x="0.5"
                y="2.5"
                width="7"
                height="7"
                fill="var(--bg, #07070d)"
              />
            </svg>
          ) : (
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <rect x="0.5" y="0.5" width="9" height="9" />
            </svg>
          )}
        </button>
        <button
          onClick={close}
          title={t("common.close")}
          aria-label={t("common.close")}
          className="flex h-full w-11 items-center justify-center text-white/70 transition-colors hover:bg-red-500 hover:text-white"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <line x1="1" y1="1" x2="9" y2="9" />
            <line x1="9" y1="1" x2="1" y2="9" />
          </svg>
        </button>
      </div>
    </div>
  )
}
