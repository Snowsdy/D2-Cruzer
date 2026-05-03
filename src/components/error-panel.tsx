import { useTranslation } from "react-i18next"
import { isABungieApiError } from "@/api/bungie"

/**
 * Consistent error panel for feature pages. Accepts any unknown error and
 * surfaces the most useful bits (Bungie error code / HTTP status / message).
 */
export function ErrorPanel({
  error,
  onRetry,
  title,
}: {
  error: unknown
  onRetry?: () => void
  title?: string
}) {
  const { t } = useTranslation()
  const details = describe(error, t)
  const effectiveTitle = title ?? t("errorPanel.title")
  return (
    <div
      className="panel mx-auto max-w-lg rounded-xl border p-5"
      style={{
        background:
          "linear-gradient(180deg, rgba(239,68,68,0.08), rgba(7,7,13,0.5))",
        borderColor: "rgba(239,68,68,0.45)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-black text-red-300"
          style={{
            background: "rgba(239,68,68,0.14)",
            border: "1px solid rgba(239,68,68,0.45)",
          }}
        >
          ⚠
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold text-white">
            {effectiveTitle}
          </div>
          <div className="mt-1 text-[12px] leading-relaxed wrap-break-word text-red-200/90">
            {details.message}
          </div>
          {details.hint && (
            <div className="mt-2 text-[11px] leading-snug text-white/55">
              {details.hint}
            </div>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 h-8 rounded-md border border-red-400/50 bg-red-500/20 px-3 text-[11px] font-bold tracking-wider text-red-200 uppercase transition-colors hover:bg-red-500/30"
            >
              {t("common.retry")}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

type TFn = (k: string) => string
function describe(err: unknown, t: TFn): { message: string; hint?: string } {
  if (isABungieApiError(err)) {
    const hint =
      err.status === 401
        ? t("errorPanel.sessionExpired")
        : err.status === 503
          ? t("errorPanel.maintenance")
          : err.errorCode
            ? `Bungie error code ${err.errorCode}.`
            : undefined
    return { message: err.message || t("errorPanel.unknownBungie"), hint }
  }
  if (err instanceof Error) return { message: err.message }
  if (typeof err === "string") return { message: err }
  return { message: t("errorPanel.unknown") }
}
