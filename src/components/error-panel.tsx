import { useTranslation } from "react-i18next";
import { isABungieApiError } from "@/api/bungie";

/**
 * Consistent error panel for feature pages. Accepts any unknown error and
 * surfaces the most useful bits (Bungie error code / HTTP status / message).
 */
export function ErrorPanel({
  error,
  onRetry,
  title,
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  const { t } = useTranslation();
  const details = describe(error, t);
  const effectiveTitle = title ?? t("errorPanel.title");
  return (
    <div
      className="panel p-5 border rounded-xl max-w-lg mx-auto"
      style={{
        background:
          "linear-gradient(180deg, rgba(239,68,68,0.08), rgba(7,7,13,0.5))",
        borderColor: "rgba(239,68,68,0.45)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-lg font-black text-red-300"
          style={{
            background: "rgba(239,68,68,0.14)",
            border: "1px solid rgba(239,68,68,0.45)",
          }}
        >
          ⚠
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold text-white">{effectiveTitle}</div>
          <div className="text-[12px] text-red-200/90 mt-1 leading-relaxed wrap-break-word">
            {details.message}
          </div>
          {details.hint && (
            <div className="text-[11px] text-white/55 mt-2 leading-snug">
              {details.hint}
            </div>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 h-8 px-3 rounded-md bg-red-500/20 border border-red-400/50 hover:bg-red-500/30 text-red-200 text-[11px] font-bold uppercase tracking-wider transition-colors"
            >
              {t("common.retry")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

type TFn = (k: string) => string;
function describe(err: unknown, t: TFn): { message: string; hint?: string } {
  if (isABungieApiError(err)) {
    const hint =
      err.status === 401
        ? t("errorPanel.sessionExpired")
        : err.status === 503
          ? t("errorPanel.maintenance")
          : err.errorCode
            ? `Bungie error code ${err.errorCode}.`
            : undefined;
    return { message: err.message || t("errorPanel.unknownBungie"), hint };
  }
  if (err instanceof Error) return { message: err.message };
  if (typeof err === "string") return { message: err };
  return { message: t("errorPanel.unknown") };
}
