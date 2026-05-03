import { useTranslation } from "react-i18next";
import { LogoLoader } from "./logo-loader";

/**
 * Shared loading placeholder for feature pages. Keeps the visual language
 * consistent across Dashboard, Inventory, Vendors, Reports, etc.
 */
export function LoadingState({
  label,
  size = "md",
}: {
  label?: string;
  size?: "sm" | "md" | "lg";
}) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-4 fade-in-slow">
      <LogoLoader size={size} showBar />
      <span className="text-[11px] uppercase tracking-[0.28em] font-extrabold text-white/45">
        {label ?? t("common.loading")}
      </span>
    </div>
  );
}