type ClassName = "Warlock" | "Hunter" | "Titan";

interface Props {
  className: ClassName;
  size?: number;
  color?: string;
  opacity?: number;
}

/**
 * In-game-style class glyphs.
 * - Hunter: Equilateral arrow/triangle (sharp apex)
 * - Warlock: Stacked triangles (phoenix/book silhouette)
 * - Titan: Horn shield
 */
export function ClassGlyph({
  className,
  size = 64,
  color = "currentColor",
  opacity = 1,
}: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 100 100",
    fill: color,
    style: { opacity },
  };
  switch (className) {
    case "Hunter":
      return (
        <svg {...common}>
          <path d="M50 8 L90 92 L50 78 L10 92 Z" />
        </svg>
      );
    case "Warlock":
      return (
        <svg {...common}>
          <path d="M50 8 L84 60 L50 48 L16 60 Z" />
          <path d="M50 46 L84 92 L50 80 L16 92 Z" />
        </svg>
      );
    case "Titan":
      return (
        <svg {...common}>
          <path d="M20 18 L80 18 L80 60 C 80 80, 50 92, 50 92 C 50 92, 20 80, 20 60 Z" />
        </svg>
      );
  }
}