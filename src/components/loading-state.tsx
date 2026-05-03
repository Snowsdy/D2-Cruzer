import { useTranslation } from "react-i18next"
import { LogoLoader } from "./logo-loader"

/**
 * Shared loading placeholder for feature pages. Keeps the visual language
 * consistent across Dashboard, Inventory, Vendors, Reports, etc.
 */
export function LoadingState({
  label,
  size = "md",
}: {
  label?: string
  size?: "sm" | "md" | "lg"
}) {
  const { t } = useTranslation()
  return (
    <div className="fade-in-slow flex flex-col items-center justify-center gap-4 py-14">
      <LogoLoader size={size} showBar />
      <span className="text-[11px] font-extrabold tracking-[0.28em] text-white/45 uppercase">
        {label ?? t("common.loading")}
      </span>
    </div>
  )
}
