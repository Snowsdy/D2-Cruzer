import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

type Variant = "danger" | "primary";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "primary",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const effectiveConfirmLabel = confirmLabel ?? t("common.confirm");
  const effectiveCancelLabel = cancelLabel ?? t("common.cancel");
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  const accent = variant === "danger" ? "#ef4444" : "#f3075e";
  const accentBg = variant === "danger" ? "rgba(239,68,68,0.14)" : "rgba(243,7,94,0.14)";
  const accentBorder = variant === "danger" ? "rgba(239,68,68,0.55)" : "rgba(243,7,94,0.55)";
  const confirmCls =
    variant === "danger"
      ? "bg-red-500 hover:bg-red-400 text-white"
      : "bg-bungie-accent hover:brightness-110 text-black";

  const IconWarning = (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
  const IconQuestion = (
    <svg
      width="30"
      height="30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );

  const node = (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center p-6"
      onClick={onCancel}
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.9) 70%)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl overflow-hidden fade-in-scale"
        style={{
          background:
            "linear-gradient(180deg, rgba(22,14,30,0.96) 0%, rgba(7,7,13,0.96) 100%)",
          border: `1px solid ${accentBorder}`,
          boxShadow: `0 40px 100px -20px ${accent}66, 0 0 0 1px rgba(255,255,255,0.04) inset`,
        }}
      >
        {/* Top shimmer accent */}
        <div
          className="h-0.5"
          style={{
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          }}
        />

        {/* Body */}
        <div className="px-7 pt-8 pb-6 text-center">
          {/* Big icon */}
          <div
            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-5"
            style={{
              background: accentBg,
              border: `1.5px solid ${accentBorder}`,
              color: accent,
              boxShadow: `0 0 32px ${accent}55, inset 0 0 20px ${accent}25`,
            }}
          >
            {variant === "danger" ? IconWarning : IconQuestion}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
            {title}
          </h2>

          {/* Message */}
          <p className="mt-3 text-[13px] text-white/70 leading-relaxed max-w-sm mx-auto">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div
          className="px-7 pb-7 pt-1 grid grid-cols-2 gap-3"
        >
          <button
            onClick={onCancel}
            className="h-11 rounded-md bg-white/5 hover:bg-white/10 border border-bungie-border text-white/85 text-[13px] font-bold uppercase tracking-wider transition-colors"
          >
            {effectiveCancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`h-11 rounded-md text-[13px] font-extrabold uppercase tracking-wider transition-all ${confirmCls}`}
            style={{
              boxShadow: `0 10px 24px -8px ${accent}90`,
            }}
          >
            {effectiveConfirmLabel}
          </button>
        </div>

        {/* Footer hint */}
        <div className="px-7 pb-4 text-center text-[9px] uppercase tracking-[0.28em] font-bold text-white/30">
          <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[9px] text-white/60">
            Esc
          </kbd>{" "}
          {t("confirm.hint.esc")} ·{" "}
          <kbd className="px-1 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[9px] text-white/60">
            Enter
          </kbd>{" "}
          {t("confirm.hint.enter")}
        </div>
      </div>
    </div>
  );
  return createPortal(node, document.body);
}