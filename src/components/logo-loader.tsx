import cruzerLogo from "@/assets/cruzer-logo.png";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<Size, number> = {
  sm: 40,
  md: 72,
  lg: 112,
  xl: 168,
};

/**
 * Animated loading logo. Shows the Cruzer mark with:
 *  - A conic sweep ring rotating around it
 *  - A pulsing drop-shadow glow
 *  - An initial reveal animation on mount
 *  - Optional caption + progress bar
 */
export function LogoLoader({
  size = "lg",
  label,
  progress,
  showBar = false,
  className = "",
}: {
  size?: Size;
  label?: string;
  progress?: number; // 0-100
  showBar?: boolean;
  className?: string;
}) {
  const px = SIZE_PX[size];
  const ringPx = Math.round(px * 1.4);

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div
        className="relative flex items-center justify-center"
        style={{ width: ringPx, height: ringPx }}
      >
        {/* Outer rotating conic ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(243,7,94,0.8), rgba(243,7,94,0) 40%, rgba(168,85,247,0.6) 65%, rgba(243,7,94,0) 100%)",
            WebkitMask:
              "radial-gradient(circle, transparent 52%, #000 54%, #000 65%, transparent 67%)",
            mask:
              "radial-gradient(circle, transparent 52%, #000 54%, #000 65%, transparent 67%)",
            animation: "logoSpin 2.2s linear infinite",
          }}
        />
        {/* Inner counter-rotating faint ring */}
        <div
          className="absolute inset-2 rounded-full"
          style={{
            background:
              "conic-gradient(from 180deg, rgba(255,255,255,0.25), rgba(255,255,255,0) 50%)",
            WebkitMask:
              "radial-gradient(circle, transparent 60%, #000 62%, #000 70%, transparent 72%)",
            mask:
              "radial-gradient(circle, transparent 60%, #000 62%, #000 70%, transparent 72%)",
            animation: "logoSpin 3.6s linear infinite reverse",
          }}
        />
        {/* Logo itself */}
        <img
          src={cruzerLogo}
          alt="Cruzer"
          width={px}
          height={px}
          className="logo-pulse logo-reveal relative z-10"
          style={{ objectFit: "contain" }}
        />
      </div>
      {label && (
        <div className="text-[11px] uppercase tracking-[0.28em] font-extrabold text-white/60 text-center fade-in-slow">
          {label}
        </div>
      )}
      {showBar && (
        <div
          className="h-0.75 rounded-full overflow-hidden relative"
          style={{
            width: Math.round(px * 2.2),
            background: "rgba(255,255,255,0.08)",
          }}
        >
          {typeof progress === "number" ? (
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${Math.max(0, Math.min(100, progress))}%`,
                background:
                  "linear-gradient(90deg, #f3075e, #a855f7)",
                boxShadow: "0 0 10px rgba(243,7,94,0.6)",
              }}
            />
          ) : (
            <div
              className="absolute inset-y-0 w-1/3 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #f3075e, transparent)",
                animation: "shimmerBg 1.4s linear infinite",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}