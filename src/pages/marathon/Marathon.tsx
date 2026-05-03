import { Link } from "react-router-dom";
import { IconNewspaper } from "@/components/icon";
import marathonIcon from "@/assets/marathon-icon.png";

const GAME_INFO: { label: string; value: string }[] = [
  { label: "Développeur", value: "Bungie" },
  { label: "Éditeur", value: "Sony Interactive Entertainment" },
  { label: "Genre", value: "Extraction shooter · PvPvE" },
  { label: "Perspective", value: "FPS" },
  { label: "Plateformes", value: "PC (Steam) · PS5 · Xbox Series" },
  { label: "Moteur", value: "Tiger Engine (maison)" },
  { label: "Cross-play", value: "Oui" },
  { label: "Sortie", value: "Annoncée, pas de date fixée" },
];

const COMMUNITY = [
  { label: "Site officiel", href: "https://www.marathonthegame.com/" },
  { label: "Steam", href: "https://store.steampowered.com/app/2818120/" },
  { label: "r/MarathonTheGame", href: "https://www.reddit.com/r/MarathonTheGame/" },
  { label: "@MarathonTheGame", href: "/news" },
  { label: "Bungie News Marathon", href: "https://www.bungie.net/en/News?category=Marathon" },
  { label: "YouTube Bungie", href: "https://www.youtube.com/@Bungie" },
];

const SOURCES = [
  { label: "Bungie News", href: "https://www.bungie.net/en/News" },
  { label: "Bungie Dev Portal", href: "https://www.bungie.net/en/Application" },
  { label: "Bungie-net/api (GitHub)", href: "https://github.com/Bungie-net/api" },
  { label: "@BungieHelp (Tweets)", href: "/news" },
];

async function openExternal(url: string) {
  if (url.startsWith("/")) return;
  try {
    const { open } = await import("@tauri-apps/plugin-shell");
    await open(url);
  } catch {
    window.open(url, "_blank");
  }
}

export function Marathon() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-2xl border-2 border-[#c7ff00]/40 bg-linear-to-br from-[#c7ff00]/10 via-[#c7ff00]/5 to-transparent p-7"
      >
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-[#c7ff00]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-5 flex-wrap md:flex-nowrap">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-[#c7ff00]/40 shadow-[0_0_24px_rgba(199,255,0,0.25)] shrink-0">
            <img src={marathonIcon} alt="Marathon" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#c7ff00]/80">
              Bungie — Extraction Shooter
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-none mt-1">
              Marathon
            </h1>
            <p className="text-sm text-bungie-muted mt-3 max-w-xl">
              Cruzer Compagnon accueillera Marathon dès publication de l'API
              publique Bungie. Toutes les features listées ci-dessous sont prêtes
              côté UI, en attente de branchement API.
            </p>
          </div>
        </div>
      </section>

      {/* API status card */}
      <section className="panel p-6 border border-[#c7ff00]/20">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <div className="text-[10px] uppercase tracking-[0.25em] font-bold text-amber-300">
            Statut API · En attente
          </div>
        </div>
        <h2 className="text-xl font-bold mb-3">Pas de date annoncée pour l'API Marathon</h2>
        <div className="text-sm text-bungie-muted space-y-2 max-w-2xl leading-relaxed">
          <p>
            Bungie n'a publié aucune date pour une API publique Marathon. La
            sortie du jeu a été repoussée plusieurs fois et l'ouverture de l'API
            n'est pas documentée dans la roadmap publique.
          </p>
          <p>
            À titre de référence, l'API Destiny 2 est devenue publique environ
            un an après la sortie du jeu. Même ordre de grandeur est possible
            pour Marathon — sans garantie.
          </p>
          <p className="text-bungie-text/80">
            <span className="text-[#c7ff00]">→</span> Dès que Bungie publie la
            spec et l'endpoint Marathon, tu recevras une mise à jour automatique
            de Cruzer via le système d'auto-update.
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-bungie-border/60">
          <div className="text-[10px] uppercase tracking-widest text-bungie-muted mb-3">
            Sources à surveiller
          </div>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((s) =>
              s.href.startsWith("/") ? (
                <Link
                  key={s.label}
                  to={s.href}
                  className="px-3 h-8 rounded-full border border-bungie-border hover:border-[#c7ff00]/40 text-xs flex items-center gap-1.5 transition-colors"
                >
                  {s.label}
                </Link>
              ) : (
                <button
                  key={s.label}
                  onClick={() => openExternal(s.href)}
                  className="px-3 h-8 rounded-full border border-bungie-border hover:border-[#c7ff00]/40 text-xs flex items-center gap-1.5 transition-colors"
                >
                  {s.label} ↗
                </button>
              )
            )}
          </div>
        </div>
      </section>

      {/* About the game */}
      <section>
        <h2 className="text-lg font-bold mb-4">Le jeu</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {/* Lore/pitch */}
          <div className="panel p-5 md:col-span-2 border border-[#c7ff00]/20">
            <div className="text-[10px] uppercase tracking-widest text-[#c7ff00] font-bold mb-2">
              Synopsis
            </div>
            <p className="text-sm leading-relaxed text-bungie-text/90">
              Tau Ceti IV. Colonie perdue. Les Runners, silhouettes
              cybernétiques aux consciences transférées, plongent dans les
              vestiges de l'UESC Marathon pour extraire artefacts, armes et
              secrets — en s'entretuant. Reboot ambitieux de la trilogie
              culte Bungie de 1994-96, transposée en extraction shooter
              multijoueur compétitif.
            </p>
            <p className="text-xs text-bungie-muted mt-3 leading-relaxed">
              Sessions courtes, loot persistant dans un stash entre les
              matchs, risque/récompense : emporter le butin hors-zone ou le
              perdre à la mort. Arsenal d'armes SF, implants modifiant les
              capacités, une roster de Runners aux kits asymétriques.
            </p>
          </div>

          {/* Game info grid */}
          <div className="panel p-5">
            <div className="text-[10px] uppercase tracking-widest text-[#c7ff00] font-bold mb-3">
              Fiche
            </div>
            <dl className="space-y-2 text-xs">
              {GAME_INFO.map((row) => (
                <div key={row.label} className="flex justify-between gap-2">
                  <dt className="text-bungie-muted shrink-0">{row.label}</dt>
                  <dd className="text-right text-bungie-text/90 font-medium">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Community */}
      <section>
        <h2 className="text-lg font-bold mb-4">Liens & communauté</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {COMMUNITY.map((c) =>
            c.href.startsWith("/") ? (
              <Link
                key={c.label}
                to={c.href}
                className="panel p-4 flex items-center justify-between gap-3 hover:border-[#c7ff00]/40 transition-colors group"
              >
                <span className="font-semibold text-sm">{c.label}</span>
                <span className="text-[#c7ff00] group-hover:translate-x-0.5 transition-transform">
                  →
                </span>
              </Link>
            ) : (
              <button
                key={c.label}
                onClick={() => openExternal(c.href)}
                className="panel p-4 flex items-center justify-between gap-3 hover:border-[#c7ff00]/40 transition-colors group text-left"
              >
                <span className="font-semibold text-sm">{c.label}</span>
                <span className="text-[#c7ff00] group-hover:translate-x-0.5 transition-transform">
                  ↗
                </span>
              </button>
            )
          )}
        </div>
      </section>

      {/* News CTA */}
      <section className="panel p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-[#c7ff00]/10 border border-[#c7ff00]/30 flex items-center justify-center text-[#c7ff00] shrink-0">
            <IconNewspaper size={20} />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm">Actualités Marathon</div>
            <div className="text-xs text-bungie-muted mt-0.5">
              Annonces Bungie, dev updates, patch notes — filtrés Marathon
            </div>
          </div>
        </div>
        <Link
          to="/news"
          className="px-4 h-9 rounded-full bg-[#c7ff00] text-black font-bold text-xs flex items-center gap-2 hover:brightness-110 transition"
        >
          Voir le flux
        </Link>
      </section>
    </div>
  );
}