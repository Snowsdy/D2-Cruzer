/**
 * Stylized raid / dungeon crest SVGs — used as fallback badges when the
 * Bungie PGCR image is missing or as a secondary decorative overlay.
 * All use the Destiny tricorn silhouette with per-activity color accent.
 */

type Props = { name: string; size?: number; className?: string };

const CREST_COLOR: Record<string, string> = {
  // Raids — tinted per expansion theme
  "Salvation's Edge": "#d946ef",
  "Root of Nightmares": "#06b6d4",
  "King's Fall": "#16a34a",
  "Vow of the Disciple": "#9333ea",
  "Deep Stone Crypt": "#38bdf8",
  "Last Wish": "#fbbf24",
  "Vault of Glass": "#34d399",
  "Garden of Salvation": "#84cc16",
  // Dungeons
  "Vesper's Host": "#0ea5e9",
  "The Shattered Throne": "#fbbf24",
  "Grasp of Avarice": "#eab308",
  Duality: "#dc2626",
  "Spire of the Watcher": "#ca8a04",
  "Warlord's Ruin": "#b91c1c",
  "Pit of Heresy": "#059669",
  Prophecy: "#f1f5f9",
  "Ghosts of the Deep": "#0891b2",
  "Sundered Doctrine": "#a855f7",
};

export function ActivityCrest({ name, size = 40, className = "" }: Props) {
  const color = CREST_COLOR[name] ?? "#f3075e";
  return (
    <div
      className={`relative rounded-md flex items-center justify-center ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 30% 30%, ${color}33, ${color}08 70%)`,
        border: `1px solid ${color}80`,
        boxShadow: `0 0 14px ${color}35 inset`,
      }}
    >
      <svg
        width={size * 0.58}
        height={size * 0.58}
        viewBox="0 0 100 100"
        fill={color}
        style={{ filter: `drop-shadow(0 0 6px ${color}aa)` }}
      >
        {/* Destiny tricorn silhouette */}
        <ellipse cx="50" cy="28" rx="7" ry="24" />
        <ellipse cx="50" cy="28" rx="7" ry="24" transform="rotate(120 50 55)" />
        <ellipse cx="50" cy="28" rx="7" ry="24" transform="rotate(240 50 55)" />
      </svg>
    </div>
  );
}