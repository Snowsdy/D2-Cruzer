/* eslint-disable react-hooks/set-state-in-effect */
/**
 * "Quoi de neuf" — release-note modal shown once per new version.
 *
 * On app mount we compare `__APP_VERSION__` (injected at build time) against
 * the last version the user acknowledged, stored in localStorage. First
 * launch after an update pops the modal; dismiss writes the current version
 * so it never shows again for that release. Dev builds reuse whatever
 * version is in package.json, which is fine — you'll just see the modal
 * once after bumping.
 *
 * Kept intentionally inline (no heavy framer-motion / markdown renderer) —
 * the content is a curated highlight reel, not the full CHANGELOG.
 */

import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

declare const __APP_VERSION__: string;

const STORAGE_KEY = "cruzer:lastSeenVersion";

/**
 * Highlights for the currently-shipping version. Add a new entry when
 * bumping `package.json` and the modal re-fires for everyone.
 */
interface Highlight {
  emoji: string;
  title: string;
  body: string;
  accent?: "accent" | "warm" | "emerald" | "sky" | "purple";
}

const RELEASES: Record<string, { headline: string; items: Highlight[] }> = {
  "0.2.2": {
    headline: "Fermeture propre, sélecteurs fonctionnels, labels clarifiés.",
    items: [
      {
        emoji: "🪟",
        title: "Fermeture propre de l'app",
        body: "Fermer la fenêtre tue vraiment le processus. Plus besoin du gestionnaire de tâches pour relancer Cruzer après l'avoir fermé.",
        accent: "accent",
      },
      {
        emoji: "🎭",
        title: "Changement de personnage dans le modal Saison",
        body: "Le sélecteur de perso dans le pop-up de saison est maintenant un vrai dropdown — sélectionner un Gardien l'active partout dans l'app.",
        accent: "purple",
      },
      {
        emoji: "📊",
        title: "\"Saison écoulée\" au lieu de \"Saison\"",
        body: "Le pourcentage du passage du temps dans la saison est désormais explicite.",
        accent: "sky",
      },
    ],
  },
  "0.2.1": {
    headline: "Overlay en jeu, bot Discord, auto-update.",
    items: [
      {
        emoji: "🎮",
        title: "Overlay en jeu",
        body: "L'app se superpose à Destiny 2 et Marathon automatiquement. Toggle avec F9 (marche même en pleine partie). Détection par nom de process — plus de faux positifs.",
        accent: "accent",
      },
      {
        emoji: "🤖",
        title: "Bot Discord intégré",
        body: "Nouveau hub `/bot` avec statut live, commandes slash, leaderboard 24h. Le bot partage l'auth Bungie avec l'app.",
        accent: "purple",
      },
      {
        emoji: "⚡",
        title: "Démarrage plus rapide",
        body: "Plus de gel disque/réseau au lancement. Le catalogue d'items (~40 MB) n'est chargé qu'à l'ouverture de la Database.",
        accent: "emerald",
      },
      {
        emoji: "🖼️",
        title: "Images d'articles réparées",
        body: "Les TWID et articles Bungie utilisent du lazy-loading client-side — on le gère maintenant côté serveur. Images visibles partout.",
        accent: "warm",
      },
      {
        emoji: "🔄",
        title: "Mises à jour automatiques",
        body: "Auto-updater signé branché sur cruzer.gg. Nouvelles versions récupérées au prochain lancement. GitHub Actions publie à chaque tag push.",
        accent: "sky",
      },
    ],
  },
  "0.2.0": {
    headline: "Redesign complet + thèmes + bot dashboard.",
    items: [
      {
        emoji: "🎨",
        title: "Header redesigné",
        body: "Hiérarchie plus claire, brand CRUZER à côté du logo, switch D2 ↔ Marathon déplacé, pills de navigation avec underline accent.",
      },
      {
        emoji: "🌈",
        title: "Thèmes fonctionnels",
        body: "Sombre (défaut), Minuit (noir profond), Nébuleuse (voile violet).",
      },
      {
        emoji: "🌍",
        title: "Traduction massive",
        body: "~87 chaînes passées en i18n, 10 locales alignées.",
      },
      {
        emoji: "📊",
        title: "Dashboard bot Discord",
        body: "Nouvelle page /bot avec hero, tuiles modules, leaderboard.",
      },
    ],
  },
};

const ACCENT_TINTS: Record<NonNullable<Highlight["accent"]>, string> = {
  accent: "rgba(243,7,94,0.18)",
  warm: "rgba(245,166,35,0.18)",
  emerald: "rgba(52,211,153,0.15)",
  sky: "rgba(56,189,248,0.15)",
  purple: "rgba(168,85,247,0.18)",
};

const ACCENT_BORDERS: Record<NonNullable<Highlight["accent"]>, string> = {
  accent: "rgba(243,7,94,0.40)",
  warm: "rgba(245,166,35,0.40)",
  emerald: "rgba(52,211,153,0.40)",
  sky: "rgba(56,189,248,0.40)",
  purple: "rgba(168,85,247,0.40)",
};

function isNewerVersion(a: string, b: string): boolean {
  const pa = a.split(".").map((n) => Number(n) || 0);
  const pb = b.split(".").map((n) => Number(n) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x > y) return true;
    if (x < y) return false;
  }
  return false;
}

export function WhatsNewModal() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      const current = __APP_VERSION__;
      const release = RELEASES[current];
      // Only show when we have curated highlights for this version AND
      // the user has never seen them.
      if (!release) return;
      if (!seen || isNewerVersion(current, seen)) {
        setOpen(true);
      }
    } catch {
      /* localStorage unavailable — silently skip */
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, __APP_VERSION__);
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  if (!open) return null;
  const release = RELEASES[__APP_VERSION__];
  if (!release) return null;

  return (
    <Backdrop onClose={dismiss}>
      <div
        className="relative w-full max-w-160 max-h-[85vh] overflow-hidden rounded-2xl border animate-[dropdown-in_280ms_ease-out]"
        style={{
          background:
            "linear-gradient(180deg, rgba(17,17,29,0.96), rgba(7,7,13,0.96))",
          borderColor: "rgba(243,7,94,0.45)",
          boxShadow:
            "0 24px 72px -8px rgba(0,0,0,0.7), 0 0 60px rgba(243,7,94,0.18), 0 0 0 1px rgba(243,7,94,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent gradient top bar */}
        <div className="h-0.5 bg-linear-to-r from-transparent via-bungie-accent to-transparent" />

        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 border border-white/15 text-white/70 hover:text-white hover:border-white/40 transition-colors flex items-center justify-center"
          aria-label={t("common.close", "Fermer")}
        >
          ✕
        </button>

        {/* Header */}
        <div className="px-7 pt-7 pb-5">
          <div className="text-[10px] uppercase tracking-[0.3em] font-extrabold text-bungie-accent mb-1.5">
            Cruzer Compagnon · v{__APP_VERSION__}
          </div>
          <h2 className="text-[26px] font-extrabold tracking-tight leading-[1.15] text-white">
            {t("whatsNew.title", "Quoi de neuf")}
          </h2>
          <p className="text-sm text-bungie-muted mt-2">{release.headline}</p>
        </div>

        {/* Scrollable body */}
        <div className="px-7 pb-4 overflow-auto max-h-[55vh] space-y-2.5">
          {release.items.map((item, i) => {
            const tint = ACCENT_TINTS[item.accent ?? "accent"];
            const border = ACCENT_BORDERS[item.accent ?? "accent"];
            return (
              <div
                key={i}
                className="relative flex gap-3.5 rounded-xl p-3.5 transition-all hover:-translate-y-0.5"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(17,17,29,0.7), rgba(13,13,22,0.7))",
                  border: `1px solid ${border}`,
                }}
              >
                <div
                  className="w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-[18px]"
                  style={{ background: tint, border: `1px solid ${border}` }}
                >
                  {item.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-extrabold text-white leading-tight">
                    {item.title}
                  </div>
                  <p className="text-[12px] text-bungie-text/75 mt-1 leading-snug">
                    {item.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-bungie-border/40 px-7 py-4 flex items-center justify-between gap-3">
          <span className="text-[10px] uppercase tracking-[0.22em] font-bold text-white/40">
            {t("whatsNew.footerHint", "Change-log complet dans CHANGELOG.md")}
          </span>
          <button
            onClick={dismiss}
            className="h-9 px-5 rounded-md bg-bungie-accent hover:brightness-110 text-black font-extrabold text-[12px] uppercase tracking-wider transition-all"
          >
            {t("whatsNew.dismiss", "C'est parti")}
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

function Backdrop({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 backdrop-blur-md"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      {children}
    </div>
  );
}