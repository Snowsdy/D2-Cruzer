import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function base(size = 16, props: SVGProps<SVGSVGElement>) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  }
}

/* -------------------------------------------------------------------------- */
/* Navigation & shell                                                         */
/* -------------------------------------------------------------------------- */
export const IconHome = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M3 12L12 3l9 9" />
    <path d="M5 10v10h14V10" />
  </svg>
)

export const IconInventory = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 8h18" />
    <path d="M9 4v4M15 4v4" />
  </svg>
)

export const IconScope = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
  </svg>
)

export const IconShield = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
  </svg>
)

export const IconCheck = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12l3 3 5-6" />
  </svg>
)

export const IconNewspaper = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <rect x="3" y="4" width="14" height="16" rx="1" />
    <path d="M17 8h4v10a2 2 0 01-2 2" />
    <path d="M7 8h6M7 12h6M7 16h6" />
  </svg>
)

export const IconWrench = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.7 2.7-2.1-2.1 2.7-2.7z" />
  </svg>
)

export const IconRefresh = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M21 12a9 9 0 01-9 9 9 9 0 01-7.4-3.9" />
    <path d="M3 12a9 9 0 019-9 9 9 0 017.4 3.9" />
    <path d="M21 3v6h-6M3 21v-6h6" />
  </svg>
)

export const IconLogout = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M15 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4" />
    <path d="M10 17l-5-5 5-5M5 12h12" />
  </svg>
)

export const IconSearch = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
)

export const IconRunner = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <circle cx="13" cy="4" r="2" />
    <path d="M4 22l4-7 3-3 3 5 4-1" />
    <path d="M11 12l-3-4 5-1 3 2" />
  </svg>
)

// Destiny 2 tricorn (three-pointed triangle, the official game symbol).
export const IconDestiny = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)} fill="currentColor" stroke="none">
    <path d="M12 2 L20 16 L17.5 16 L12 7 L6.5 16 L4 16 Z" />
    <path d="M7.5 18 L16.5 18 L15 20.5 L9 20.5 Z" />
  </svg>
)

// Marathon stylised "M" with athletic stride curve.
export const IconMarathon = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)} fill="none" stroke="currentColor" strokeWidth="2.4">
    <path
      d="M4 20 L4 4 L12 14 L20 4 L20 20"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

/* -------------------------------------------------------------------------- */
/* Inventory tabs                                                             */
/* -------------------------------------------------------------------------- */
export const IconGrid = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <rect x="3" y="3" width="8" height="8" rx="1" />
    <rect x="13" y="3" width="8" height="8" rx="1" />
    <rect x="3" y="13" width="8" height="8" rx="1" />
    <rect x="13" y="13" width="8" height="8" rx="1" />
  </svg>
)

export const IconUser = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
  </svg>
)

export const IconBot = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <rect x="4" y="8" width="16" height="12" rx="2" />
    <path d="M12 4v4" />
    <circle cx="12" cy="4" r="1.2" />
    <circle cx="9" cy="13" r="1.1" fill="currentColor" />
    <circle cx="15" cy="13" r="1.1" fill="currentColor" />
    <path d="M9 17h6" />
  </svg>
)

export const IconVault = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="12" cy="12" r="4" />
    <path d="M12 8v1M12 15v1M16 12h-1M9 12H8" />
  </svg>
)

export const IconLightning = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
  </svg>
)

export const IconList = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <circle cx="4" cy="6" r="1" />
    <circle cx="4" cy="12" r="1" />
    <circle cx="4" cy="18" r="1" />
  </svg>
)

export const IconDiamond = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M12 2l5 7-5 13-5-13 5-7z" />
  </svg>
)

export const IconMail = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
)

export const IconCopy = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
)

/* -------------------------------------------------------------------------- */
/* Misc                                                                       */
/* -------------------------------------------------------------------------- */
export const IconSparkle = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" />
  </svg>
)

export const IconStar = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)} fill="currentColor" stroke="none">
    <path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 18l-6.2 3 1.2-6.8-5-4.9 6.9-1L12 2z" />
  </svg>
)

export const IconTrash = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M4 6h16M9 6V4h6v2M7 6v14h10V6" />
  </svg>
)

export const IconArchive = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <rect x="3" y="3" width="18" height="5" rx="1" />
    <path d="M4 8v12h16V8" />
    <path d="M10 13h4" />
  </svg>
)

export const IconArrowUp = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </svg>
)

export const IconCheckmark = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M5 12l4 4L19 7" />
  </svg>
)

export const IconCompare = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M16 3l4 4-4 4M20 7H8M8 21l-4-4 4-4M4 17h12" />
  </svg>
)

export const IconChart = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M3 20h18" />
    <rect x="6" y="12" width="3" height="8" />
    <rect x="11" y="6" width="3" height="14" />
    <rect x="16" y="9" width="3" height="11" />
  </svg>
)

export const IconBook = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M4 4h11a3 3 0 013 3v13H7a3 3 0 01-3-3V4z" />
    <path d="M4 17h14" />
  </svg>
)

export const IconGear = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 01-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 012.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 012.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z" />
  </svg>
)

export const IconGlobe = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
  </svg>
)

export const IconPlug = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M9 2v6M15 2v6" />
    <path d="M6 8h12v4a6 6 0 01-12 0V8z" />
    <path d="M12 18v4" />
  </svg>
)

export const IconPackage = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M3 8l9-5 9 5v9l-9 5-9-5V8z" />
    <path d="M3 8l9 5 9-5M12 13v9" />
  </svg>
)

export const IconSword = ({ size, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
    <path d="M13 19l6-6" />
    <path d="M16 16l4 4" />
    <path d="M19 21l2-2" />
  </svg>
)
