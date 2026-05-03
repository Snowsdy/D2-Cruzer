interface Props {
  value: number;
  max?: number;
  tier?: boolean;
  color?: string;
}

/**
 * Horizontal bar with tier ticks. Renders cleanly for both per-piece stats
 * (default max 100) and character total stats (max 200 after Armor 3.0):
 * tick density scales with the max so we never flood a 200pt bar with 19 marks.
 */
export function StatBar({
  value,
  max = 100,
  tier = true,
  color = "#f3075e",
}: Props) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  // Coarser ticks past 100 so the bar doesn't become striped noise.
  const step = max <= 100 ? 10 : 50;
  const tickCount = Math.max(0, Math.floor(max / step) - 1);
  const filled = Math.floor(value / step);

  return (
    <div className="relative h-1.5 rounded-full bg-white/8 overflow-visible">
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 8px ${color}55`,
        }}
      />
      {tier &&
        Array.from({ length: tickCount }).map((_, i) => {
          const tickValue = (i + 1) * step;
          const leftPct = (tickValue / max) * 100;
          return (
            <span
              key={i}
              className="absolute -top-0.5 h-2.25 w-px pointer-events-none"
              style={{
                left: `${leftPct}%`,
                background:
                  i < filled ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.12)",
              }}
            />
          );
        })}
    </div>
  );
}