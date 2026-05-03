import { useState } from "react"
import { useTranslation } from "react-i18next"

interface Props {
  url: string
  siteName: string
  accentBorder: string
}

export function EmbeddedSite({ url, siteName, accentBorder }: Props) {
  const { t } = useTranslation()
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  const open = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-shell")
      await open(url)
    } catch {
      window.open(url, "_blank")
    }
  }

  return (
    <div
      className={`panel relative overflow-hidden rounded-xl border ${accentBorder}`}
    >
      <div className="border-bungie-border flex items-center justify-between border-b bg-black/40 px-4 py-2">
        <div className="text-bungie-muted text-xs">
          {t("reports.embedded")}{" "}
          <span className="text-bungie-accent">{siteName}</span> ·{" "}
          <span className="opacity-60">{new URL(url).host}</span>
        </div>
        <button
          onClick={open}
          className="text-bungie-accent text-xs hover:underline"
        >
          {t("reports.openExternal")} →
        </button>
      </div>
      <div
        className="relative bg-black"
        style={{ height: "calc(100vh - 14rem)" }}
      >
        {!loaded && !errored && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-bungie-muted">{t("common.loading")}</p>
          </div>
        )}
        {errored && (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="max-w-md space-y-3 text-center">
              <p className="font-semibold text-red-400">
                {t("reports.embedFailed")}
              </p>
              <p className="text-bungie-muted text-sm">
                {t("reports.embedFallback")}
              </p>
              <button onClick={open} className="btn-primary">
                {t("reports.openExternal")} →
              </button>
            </div>
          </div>
        )}
        <iframe
          src={url}
          title={siteName}
          className="h-full w-full"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  )
}
