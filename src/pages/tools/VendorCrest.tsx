/**
 * Inline SVG crests per vendor — matched to the official Destiny 2
 * vendor emblems as closely as possible so we don't depend on the
 * Bungie manifest for the right icon (which is often a portrait).
 */

import type { VendorKey } from "@/api/vendors";
import { VENDOR_COLOR } from "@/constants/bungieHashes";
import type { SVGProps } from "react";

interface Props extends SVGProps<SVGSVGElement> {
  vendor: VendorKey;
  size?: number;
}

export function VendorCrest({
  vendor,
  size = 40,
  style,
  ...props
}: Props) {
  const color = VENDOR_COLOR[vendor];
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 64 64",
    style: {
      filter: `drop-shadow(0 0 6px ${color}66)`,
      ...style,
    },
    ...props,
  };

  switch (vendor) {
    // ===== VANGUARD — three stacked triangular segments forming a pyramid
    case "Zavala":
      return (
        <svg {...common}>
          <path d="M32 10 L52 44 L12 44 Z" fill={`${color}22`} stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M32 18 L44 38 L20 38 Z" fill={`${color}44`} stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M32 26 L38 34 L26 34 Z" fill={color} stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );

    // ===== CRUCIBLE — crossed blades forming an X
    case "Shaxx":
      return (
        <svg {...common} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
          {/* Left blade */}
          <path d="M14 14 L50 50" strokeWidth="4" />
          <path d="M14 14 L20 12 L18 18 Z" fill={color} stroke="none" />
          <path d="M50 50 L48 44 L44 48 Z" fill={color} stroke="none" />
          {/* Right blade */}
          <path d="M50 14 L14 50" strokeWidth="4" />
          <path d="M50 14 L44 12 L46 18 Z" fill={color} stroke="none" />
          <path d="M14 50 L16 44 L20 48 Z" fill={color} stroke="none" />
          {/* Center rivet */}
          <circle cx="32" cy="32" r="3" fill={color} />
        </svg>
      );

    // ===== GAMBIT — S-curve serpent in a thin circle
    case "Drifter":
      return (
        <svg {...common} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="32" cy="32" r="26" strokeWidth="2" />
          {/* S-shaped serpent body */}
          <path
            d="M20 22 Q32 14 44 22 Q32 32 20 42 Q32 50 44 42"
            strokeWidth="4"
          />
          {/* Serpent head dot */}
          <circle cx="20" cy="22" r="2.5" fill={color} />
          <circle cx="44" cy="42" r="2.5" fill={color} />
        </svg>
      );

    // ===== GUNSMITH — upright bullet silhouette
    case "Banshee":
      return (
        <svg {...common} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
          {/* Bullet tip (pointed top) */}
          <path d="M32 8 Q38 16 38 24 L26 24 Q26 16 32 8 Z" fill={color} stroke={color} strokeWidth="1.5" />
          {/* Casing (rectangular body) */}
          <rect x="24" y="24" width="16" height="28" rx="1" fill={`${color}40`} stroke={color} strokeWidth="2" />
          {/* Primer (base dot) */}
          <circle cx="32" cy="48" r="2.5" fill={color} />
          {/* Separator ring between tip & casing */}
          <line x1="24" y1="28" x2="40" y2="28" strokeWidth="1.5" />
        </svg>
      );

    // ===== TRIALS — hexagonal shield with a central numeric
    case "SaintFourteen":
      return (
        <svg {...common} fill="none" stroke={color} strokeLinejoin="round" strokeLinecap="round">
          {/* Hexagonal shield */}
          <path
            d="M32 6 L54 18 L54 42 L32 58 L10 42 L10 18 Z"
            fill={`${color}22`}
            stroke={color}
            strokeWidth="2.2"
          />
          <path
            d="M32 12 L48 22 L48 40 L32 52 L16 40 L16 22 Z"
            fill="none"
            stroke={color}
            strokeWidth="1"
            opacity="0.5"
          />
          {/* Central "30" numeric (Trials 30-minute win streak) */}
          <text
            x="32"
            y="38"
            textAnchor="middle"
            fontSize="16"
            fontWeight="900"
            fontFamily="monospace"
            fill={color}
            stroke="none"
          >
            30
          </text>
        </svg>
      );

    // ===== SYNTHWEAVER (Ada-1) — stylized humanoid figure
    case "Ada1":
      return (
        <svg {...common} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
          {/* Head (oval) */}
          <ellipse cx="32" cy="18" rx="7" ry="8" fill={`${color}40`} stroke={color} strokeWidth="2" />
          {/* Body (tapered torso — broad shoulders, narrow waist) */}
          <path
            d="M22 26 Q32 28 42 26 L38 52 Q32 54 26 52 Z"
            fill={`${color}30`}
            stroke={color}
            strokeWidth="2"
          />
          {/* Central seam */}
          <line x1="32" y1="28" x2="32" y2="50" strokeWidth="1.5" opacity="0.6" />
        </svg>
      );

    // ===== CLAN (Hawthorne) — heraldic wings with central diamond
    case "Hawthorne":
      return (
        <svg {...common} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
          {/* Left wing */}
          <path
            d="M32 20 Q24 14 14 16 Q16 22 22 26 Q18 28 14 32 Q20 36 26 34 Q22 38 18 42 Q24 44 30 40"
            fill={`${color}35`}
            stroke={color}
            strokeWidth="2"
          />
          {/* Right wing (mirrored) */}
          <path
            d="M32 20 Q40 14 50 16 Q48 22 42 26 Q46 28 50 32 Q44 36 38 34 Q42 38 46 42 Q40 44 34 40"
            fill={`${color}35`}
            stroke={color}
            strokeWidth="2"
          />
          {/* Central diamond crest */}
          <path d="M32 18 L38 32 L32 48 L26 32 Z" fill={color} stroke={color} strokeWidth="1.5" />
        </svg>
      );

    // ===== HIDDEN (Ikora) — three triangular peaks / mountain chevrons
    case "Ikora":
      return (
        <svg {...common} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
          {/* Front large peak */}
          <path d="M32 14 L52 48 L12 48 Z" fill={`${color}35`} stroke={color} strokeWidth="2" />
          {/* Back-left smaller peak */}
          <path d="M20 22 L10 48 L30 48 Z" fill={`${color}55`} stroke={color} strokeWidth="1.8" />
          {/* Back-right smaller peak */}
          <path d="M44 22 L34 48 L54 48 Z" fill={`${color}55`} stroke={color} strokeWidth="1.8" />
        </svg>
      );

    // ===== EVERVERSE — stylized "EV" letters
    case "Eververse":
      return (
        <svg {...common} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
          {/* Letter E */}
          <path
            d="M14 12 L14 52 L28 52 M14 12 L28 12 M14 32 L26 32"
            strokeWidth="3.5"
          />
          {/* Letter U / V (open at top) */}
          <path
            d="M36 12 L36 44 Q36 52 44 52 Q52 52 52 44 L52 12"
            strokeWidth="3.5"
          />
        </svg>
      );

    // ===== XÛR — Nine-pointed star (Agent of the Nine) with central eye
    case "Xur":
      return (
        <svg {...common} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round">
          {/* Nine-pointed star: 9 spikes around the center. Each pair of points
              is drawn as a filled triangle radiating outward. */}
          <g>
            <path d="M32 6 L35 22 L29 22 Z" fill={`${color}55`} stroke={color} strokeWidth="1.3" />
            <path d="M50 12 L41 25 L37 20 Z" fill={`${color}55`} stroke={color} strokeWidth="1.3" />
            <path d="M58 28 L42 30 L42 24 Z" fill={`${color}55`} stroke={color} strokeWidth="1.3" />
            <path d="M56 48 L41 40 L44 36 Z" fill={`${color}55`} stroke={color} strokeWidth="1.3" />
            <path d="M42 58 L36 42 L32 45 Z" fill={`${color}55`} stroke={color} strokeWidth="1.3" />
            <path d="M22 58 L28 42 L32 45 Z" fill={`${color}55`} stroke={color} strokeWidth="1.3" />
            <path d="M8 48 L23 40 L20 36 Z" fill={`${color}55`} stroke={color} strokeWidth="1.3" />
            <path d="M6 28 L22 30 L22 24 Z" fill={`${color}55`} stroke={color} strokeWidth="1.3" />
            <path d="M14 12 L23 25 L27 20 Z" fill={`${color}55`} stroke={color} strokeWidth="1.3" />
          </g>
          {/* Central ring */}
          <circle cx="32" cy="32" r="10" fill={`${color}22`} stroke={color} strokeWidth="1.8" />
          {/* Central eye slit */}
          <ellipse cx="32" cy="32" rx="6" ry="2.4" fill={color} stroke="none" />
          <circle cx="32" cy="32" r="1.6" fill="#0a0a10" stroke="none" />
        </svg>
      );

    default:
      return <svg {...common} />;
  }
}