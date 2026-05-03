import { useEffect, useState, type ReactElement } from "react";

// Version string injected at build time via Vite `define`. See vite.config.ts.
declare const __APP_VERSION__: string;
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { startAuthFlow } from "@/api/oauth";
import { useAuthStore } from "@/store/auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import cruzerLogo from "@/assets/cruzer-logo.png";
import bungieLogo from "@/assets/bungie-logo.png";
import { LogoLoader } from "@/components/logo-loader";
import { TitleBar } from "@/components/title-bar";
import { Flag } from "@/components/flag";
import {
  IconInventory,
  IconScope,
  IconShield,
  IconCheck,
  IconNewspaper,
  IconWrench,
} from "@/components/icon";

type Feature = {
  icon: ReactElement;
  key: string;
  descKey: string;
};

const FEATURES: Feature[] = [
  {
    icon: <IconInventory size={20} />,
    key: "inventory",
    descKey: "login.feature.inventory",
  },
  {
    icon: <IconScope size={20} />,
    key: "rolls",
    descKey: "login.feature.godRolls",
  },
  {
    icon: <IconShield size={20} />,
    key: "armor",
    descKey: "login.feature.armor",
  },
  {
    icon: <IconCheck size={20} />,
    key: "checklist",
    descKey: "login.feature.checklist",
  },
  {
    icon: <IconNewspaper size={20} />,
    key: "news",
    descKey: "login.feature.news",
  },
  {
    icon: <IconWrench size={20} />,
    key: "tools",
    descKey: "login.feature.xur",
  },
];

// Starfield generator — deterministic positions for CSS stars
const STARS = Array.from({ length: 80 }, (_, i) => ({
  top: (i * 37) % 100,
  left: (i * 53 + 7) % 100,
  size: (i % 3) + 1,
  delay: (i * 0.13) % 4,
  duration: 2 + ((i * 0.17) % 3),
}));

export function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const rememberMe = useAuthStore((s) => s.rememberMe);
  const setRememberMe = useAuthStore((s) => s.setRememberMe);
  // When auth lands from another window (main window finishing OAuth → the
  // overlay webview sees the shared Zustand/localStorage token arrive), jump
  // to the dashboard. Otherwise the overlay stays stuck on /login even
  // though the user is already authenticated.
  const accessToken = useAuthStore((s) => s.accessToken);
  useEffect(() => {
    if (accessToken) {
      navigate("/", { replace: true });
    }
  }, [accessToken, navigate]);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const url = await startAuthFlow();
      try {
        const { open } = await import("@tauri-apps/plugin-shell");
        await open(url);
      } catch {
        window.location.href = url;
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05050a] flex flex-col">
      {/* -------- Window controls bar -------- */}
      <div className="relative z-30">
        <TitleBar />
      </div>

      {/* -------- Animated starfield -------- */}
      <div className="absolute inset-0 pointer-events-none">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: s.size,
              height: s.size,
              opacity: 0.4,
              animation: `starTwinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
              boxShadow: s.size > 1 ? "0 0 4px rgba(255,255,255,0.8)" : undefined,
            }}
          />
        ))}
      </div>

      {/* -------- Nebula layers -------- */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(243,7,94,0.18) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 15% 90%, rgba(168,85,247,0.22) 0%, transparent 55%), radial-gradient(ellipse 45% 35% at 90% 10%, rgba(6,182,212,0.12) 0%, transparent 55%)",
        }}
      />

      {/* -------- Top chrome (below TitleBar) -------- */}
      <div className="absolute top-12.5 left-5 right-5 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 border border-bungie-border/60 backdrop-blur-sm">
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-live"
            style={{ boxShadow: "0 0 8px #34d399" }}
          />
          <span className="text-[9px] uppercase tracking-[0.3em] font-extrabold text-white/70">
            Online
          </span>
          <span className="text-white/20">·</span>
          <span className="text-[9px] uppercase tracking-[0.3em] font-mono text-white/50">
            v{__APP_VERSION__}
          </span>
        </div>
        <LanguageSwitcher />
      </div>

      {/* -------- Main split -------- */}
      <div className="relative z-10 flex-1 grid lg:grid-cols-[1fr_1fr] gap-0 items-center">
        {/* ============ LEFT — Hero ============ */}
        <div className="flex items-center justify-center p-8 lg:p-12 relative">
          <div className="max-w-xl w-full flex flex-col items-center text-center">
            {/* Top: logo + title side by side */}
            <div className="flex items-center justify-center gap-5 mb-6">
              {loading ? (
                <LogoLoader size="md" />
              ) : (
                <img
                  src={cruzerLogo}
                  alt="Cruzer"
                  width={96}
                  height={96}
                  className="logo-reveal logo-pulse shrink-0"
                  style={{
                    objectFit: "contain",
                    filter: "drop-shadow(0 0 28px rgba(243,7,94,0.55))",
                  }}
                />
              )}
              <div className="min-w-0 text-left">
                <h1 className="glitch text-6xl lg:text-7xl font-black tracking-[-0.03em] leading-[0.9]">
                  <span data-text="CRUZER" className="text-gradient">
                    CRUZER
                  </span>
                </h1>
                <div className="flex items-center gap-2.5 mt-2">
                  <span
                    className="h-0.5 w-8"
                    style={{
                      background:
                        "linear-gradient(90deg, rgba(243,7,94,0.9), rgba(243,7,94,0))",
                    }}
                  />
                  <span className="text-[11px] uppercase tracking-[0.5em] font-black text-bungie-accent">
                    Compagnon
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[13px] text-white/70 leading-relaxed mb-8 max-w-md mx-auto">
              {t("app.tagline")} — outils tactiques, inventaire live,
              loot tables et actualités Bungie dans une appli portable.
            </p>

            {/* Feature grid — all 6 visible */}
            <div className="hidden lg:block">
              <div className="text-[10px] uppercase tracking-[0.3em] font-extrabold text-white/55 mb-3 flex items-center justify-center gap-2">
                <span className="h-px w-10 bg-linear-to-r from-transparent to-white/30" />
                <span>Embarque avec</span>
                <span className="h-px w-10 bg-linear-to-l from-transparent to-white/30" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {FEATURES.map((f, i) => (
                  <div
                    key={f.key}
                    className="group flex items-center gap-3 p-3 rounded-lg transition-all hover:-translate-y-0.5 fade-in-up"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(20,12,30,0.6), rgba(7,7,13,0.4))",
                      border: "1px solid rgba(243,7,94,0.18)",
                      animationDelay: `${0.15 + i * 0.05}s`,
                    }}
                  >
                    <div
                      className="w-11 h-11 rounded-md flex items-center justify-center shrink-0 text-bungie-accent group-hover:scale-110 transition-transform self-center"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(243,7,94,0.2), rgba(243,7,94,0.04))",
                        border: "1px solid rgba(243,7,94,0.35)",
                        boxShadow: "0 0 16px rgba(243,7,94,0.2) inset",
                      }}
                    >
                      {f.icon}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="text-[13px] font-extrabold uppercase tracking-wider text-white">
                        {t(`nav.${f.key}`)}
                      </div>
                      <div className="text-[11px] text-white/65 mt-0.5 leading-snug line-clamp-2">
                        {t(f.descKey)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom stats strip */}
              <div
                className="mt-6 flex items-center justify-between gap-4 px-4 py-3 rounded-lg"
                style={{
                  background: "rgba(7,7,13,0.5)",
                  border: "1px solid rgba(243,7,94,0.15)",
                }}
              >
                <Stat value="6+" label="Outils" />
                <Divider />
                <Stat value="100 %" label="Gratuit" />
                <Divider />
                <LangStat />
              </div>
            </div>
          </div>
        </div>

        {/* ============ RIGHT — Login card ============ */}
        <div className="flex items-center justify-center p-8 lg:p-14">
          <div className="w-full max-w-lg fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div
              className="relative rounded-xl overflow-hidden"
              style={{
                background:
                  "linear-gradient(145deg, rgba(20,12,30,0.9), rgba(7,7,13,0.85))",
                border: "1px solid rgba(243,7,94,0.25)",
                backdropFilter: "blur(14px)",
                boxShadow:
                  "0 40px 100px -20px rgba(243,7,94,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset",
              }}
            >
              {/* Top accent line */}
              <div
                className="h-0.5"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(243,7,94,0.8), rgba(168,85,247,0.6), transparent)",
                }}
              />

              <div className="p-8 space-y-6">
                {/* Mini header */}
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] font-extrabold">
                  <span className="text-white/70">Identification</span>
                  <span className="flex items-center gap-2 text-emerald-300">
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                      style={{ boxShadow: "0 0 6px #34d399" }}
                    />
                    Sécurisé
                  </span>
                </div>

                <div>
                  <div className="text-[26px] font-black text-white leading-tight">
                    Connecte-toi
                  </div>
                  <div className="text-[11px] text-white/65 mt-1.5 leading-relaxed">
                    Via ton compte <span className="text-white font-semibold">Bungie.net</span> ·
                    OAuth 2.0 · aucun mot de passe n'est stocké.
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="relative w-full h-14 rounded-lg overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background:
                      "linear-gradient(135deg, #f3075e 0%, #c00650 50%, #a855f7 120%)",
                    boxShadow:
                      "0 0 0 1px rgba(255,255,255,0.1) inset, 0 18px 44px -12px rgba(243,7,94,0.8)",
                  }}
                >
                  <span
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                      backgroundSize: "200% 100%",
                      animation: "shimmerBg 1.6s linear infinite",
                    }}
                  />
                  <span className="relative flex items-center justify-center gap-3 text-white font-extrabold text-[13px] uppercase tracking-[0.22em] leading-none">
                    <span className="leading-none">Se connecter avec</span>
                    <img
                      src={bungieLogo}
                      alt="Bungie"
                      className="shrink-0 block"
                      style={{
                        filter:
                          "brightness(0) invert(1) drop-shadow(0 0 6px rgba(255,255,255,0.55))",
                        height: 14,
                        width: "auto",
                      }}
                    />
                    {loading && (
                      <span className="text-[11px] opacity-80 normal-case tracking-normal leading-none">
                        · {t("auth.connecting")}
                      </span>
                    )}
                    {!loading && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="group-hover:translate-x-1 transition-transform shrink-0"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    )}
                  </span>
                </button>

                {/* Remember toggle */}
                <label className="flex items-center gap-3 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer sr-only"
                  />
                  <div
                    className={`w-11 h-6 rounded-full relative transition-all ${
                      rememberMe
                        ? "bg-bungie-accent/90"
                        : "bg-white/10 border border-bungie-border"
                    }`}
                    style={
                      rememberMe
                        ? { boxShadow: "0 0 12px rgba(243,7,94,0.5)" }
                        : undefined
                    }
                  >
                    <div
                      className={`absolute top-0.75 w-4.5 h-4.5 rounded-full bg-white transition-all ${
                        rememberMe ? "left-5.25" : "left-0.75"
                      }`}
                      style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }}
                    />
                  </div>
                  <span className="text-[14px] text-white/85 group-hover:text-white transition-colors">
                    {t("auth.rememberMe")}
                  </span>
                </label>

                {error && (
                  <div className="text-[13px] text-red-300 border border-red-500/40 bg-red-500/5 rounded-md p-3.5 flex items-start gap-2.5 leading-relaxed">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="shrink-0 mt-0.5"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5M12 16h.01" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Trust card */}
                <div
                  className="flex items-center gap-3 p-3.5 rounded-md"
                  style={{
                    background: "rgba(52,211,153,0.06)",
                    border: "1px solid rgba(52,211,153,0.22)",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="shrink-0 text-emerald-300"
                  >
                    <rect x="4" y="10" width="16" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                  <p className="text-[12px] text-white/75 leading-relaxed">
                    {t("auth.disclaimer")}
                  </p>
                </div>
              </div>
            </div>

            {/* Below card: compact feature pills (mobile / small screens) */}
            <div className="mt-6 lg:hidden">
              <div className="grid grid-cols-3 gap-2">
                {FEATURES.map((f) => (
                  <div
                    key={f.key}
                    className="flex flex-col items-center gap-1 py-2.5 rounded-md bg-white/4 border border-bungie-border/50"
                  >
                    <span className="text-bungie-accent">{f.icon}</span>
                    <span className="text-[9px] uppercase tracking-widest text-white/50">
                      {t(`nav.${f.key}`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer under card */}
            <div className="mt-5 flex items-center justify-between text-[9px] uppercase tracking-[0.3em] text-white/25 font-extrabold">
              <span className="font-mono text-white/40">BUILD · PORTABLE</span>
              <span>{t("login.notAffiliated")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Star twinkle keyframes (inline to avoid touching global CSS) */}
      <style>{`
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="text-[18px] font-black leading-none text-gradient"
        style={{ textShadow: "0 0 14px rgba(243,7,94,0.4)" }}
      >
        {value}
      </div>
      <div className="text-[9px] uppercase tracking-[0.22em] font-bold text-white/45 mt-1">
        {label}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <span
      className="h-8 w-px shrink-0"
      style={{
        background:
          "linear-gradient(180deg, transparent, rgba(243,7,94,0.3), transparent)",
      }}
    />
  );
}

const LANG_CODES = ["fr", "us", "es", "de", "it", "br", "jp", "kr", "ru", "cn"];

function LangStat() {
  return (
    <div className="flex flex-col items-center min-w-0">
      <div className="flex items-center gap-0.75 leading-none">
        {LANG_CODES.map((c) => (
          <Flag key={c} code={c} size={11} />
        ))}
      </div>
      <div className="text-[9px] uppercase tracking-[0.22em] font-bold text-white/45 mt-2">
        10 Langues
      </div>
    </div>
  );
}