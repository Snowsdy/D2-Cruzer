// Minimal SVG flags — Windows doesn't render 🇫🇷 style emoji flags natively,
// so we draw them ourselves at small sizes. Aspect ratio 4:3, simple shapes.

type Props = { code: string; size?: number; className?: string }

export function Flag({ code, size = 18, className = "" }: Props) {
  const w = Math.round(size * 1.45)
  const h = size
  const common = {
    width: w,
    height: h,
    viewBox: "0 0 24 16",
    xmlns: "http://www.w3.org/2000/svg",
    className,
    style: {
      borderRadius: 2,
      overflow: "hidden",
      boxShadow: "0 0 0 1px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.4)",
      flexShrink: 0,
    } as React.CSSProperties,
  }

  switch (code.toLowerCase()) {
    case "fr":
      return (
        <svg {...common}>
          <rect width="8" height="16" fill="#0055A4" />
          <rect x="8" width="8" height="16" fill="#fff" />
          <rect x="16" width="8" height="16" fill="#EF4135" />
        </svg>
      )
    case "en":
    case "us":
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#B22234" />
          {[1, 3, 5, 7, 9, 11].map((y) => (
            <rect key={y} y={y + 0.2} width="24" height="1.2" fill="#fff" />
          ))}
          <rect width="10" height="8.6" fill="#3C3B6E" />
          {[...Array(9)].map((_, i) => (
            <circle
              key={i}
              cx={1 + (i % 5) * 2}
              cy={1 + Math.floor(i / 5) * 2}
              r="0.35"
              fill="#fff"
            />
          ))}
        </svg>
      )
    case "es":
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#AA151B" />
          <rect y="4" width="24" height="8" fill="#F1BF00" />
        </svg>
      )
    case "de":
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#000" />
          <rect y="5.33" width="24" height="5.34" fill="#DD0000" />
          <rect y="10.67" width="24" height="5.33" fill="#FFCE00" />
        </svg>
      )
    case "it":
      return (
        <svg {...common}>
          <rect width="8" height="16" fill="#009246" />
          <rect x="8" width="8" height="16" fill="#fff" />
          <rect x="16" width="8" height="16" fill="#CE2B37" />
        </svg>
      )
    case "pt-br":
    case "pt":
    case "br":
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#009C3B" />
          <polygon points="12,2.5 22,8 12,13.5 2,8" fill="#FFDF00" />
          <circle cx="12" cy="8" r="3" fill="#002776" />
          <path
            d="M9.2 7.2 Q 12 6 14.8 7.2"
            stroke="#fff"
            strokeWidth="0.4"
            fill="none"
          />
        </svg>
      )
    case "ja":
    case "jp":
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#fff" />
          <circle cx="12" cy="8" r="4.8" fill="#BC002D" />
        </svg>
      )
    case "ko":
    case "kr":
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#fff" />
          <circle cx="12" cy="8" r="3.2" fill="#CD2E3A" />
          <path
            d="M 12 4.8 A 1.6 1.6 0 0 1 12 8 A 1.6 1.6 0 0 0 12 11.2 A 3.2 3.2 0 0 1 12 4.8 Z"
            fill="#0047A0"
          />
          {/* corner bars */}
          <g stroke="#000" strokeWidth="0.45" strokeLinecap="square">
            <line x1="3.5" y1="3" x2="5.5" y2="3" />
            <line x1="3.5" y1="3.9" x2="5.5" y2="3.9" />
            <line x1="3.5" y1="4.8" x2="5.5" y2="4.8" />
            <line x1="18.5" y1="3" x2="20.5" y2="3" />
            <line x1="18.5" y1="3.9" x2="19.6" y2="3.9" />
            <line x1="19.4" y1="3.9" x2="20.5" y2="3.9" />
            <line x1="18.5" y1="4.8" x2="20.5" y2="4.8" />
            <line x1="3.5" y1="11.2" x2="4.6" y2="11.2" />
            <line x1="4.4" y1="11.2" x2="5.5" y2="11.2" />
            <line x1="3.5" y1="12.1" x2="5.5" y2="12.1" />
            <line x1="3.5" y1="13" x2="4.6" y2="13" />
            <line x1="4.4" y1="13" x2="5.5" y2="13" />
            <line x1="18.5" y1="11.2" x2="20.5" y2="11.2" />
            <line x1="18.5" y1="12.1" x2="20.5" y2="12.1" />
            <line x1="18.5" y1="13" x2="20.5" y2="13" />
          </g>
        </svg>
      )
    case "ru":
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#fff" />
          <rect y="5.33" width="24" height="5.34" fill="#0039A6" />
          <rect y="10.67" width="24" height="5.33" fill="#D52B1E" />
        </svg>
      )
    case "zh-chs":
    case "zh":
    case "cn":
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#DE2910" />
          <Star x={4} y={4.5} r={1.6} />
          <Star x={8} y={2.5} r={0.5} />
          <Star x={9.5} y={4} r={0.5} />
          <Star x={9.5} y={6} r={0.5} />
          <Star x={8} y={7.5} r={0.5} />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#6b7280" />
          <text
            x="12"
            y="11"
            textAnchor="middle"
            fontSize="7"
            fontWeight="bold"
            fill="#fff"
          >
            {code.slice(0, 2).toUpperCase()}
          </text>
        </svg>
      )
  }
}

function Star({ x, y, r }: { x: number; y: number; r: number }) {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const radius = i % 2 === 0 ? r : r * 0.45
    pts.push(`${x + Math.cos(angle) * radius},${y + Math.sin(angle) * radius}`)
  }
  return <polygon points={pts.join(" ")} fill="#FFDE00" />
}
