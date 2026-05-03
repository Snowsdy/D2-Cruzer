import { Link } from "react-router-dom"
import { IconNewspaper } from "@/components/icon"
import marathonIcon from "@/assets/marathon-icon.png"

const GAME_INFO: { label: string; value: string }[] = [
  { label: "Développeur", value: "Bungie" },
  { label: "Éditeur", value: "Sony Interactive Entertainment" },
  { label: "Genre", value: "Extraction shooter · PvPvE" },
  { label: "Perspective", value: "FPS" },
  { label: "Plateformes", value: "PC (Steam) · PS5 · Xbox Series" },
  { label: "Moteur", value: "Tiger Engine (maison)" },
  { label: "Cross-play", value: "Oui" },
  { label: "Sortie", value: "Annoncée, pas de date fixée" },
]

const COMMUNITY = [
  { label: "Site officiel", href: "https://www.marathonthegame.com/" },
  { label: "Steam", href: "https://store.steampowered.com/app/2818120/" },
  {
    label: "r/MarathonTheGame",
    href: "https://www.reddit.com/r/MarathonTheGame/",
  },
  { label: "@MarathonTheGame", href: "/news" },
  {
    label: "Bungie News Marathon",
    href: "https://www.bungie.net/en/News?category=Marathon",
  },
  { label: "YouTube Bungie", href: "https://www.youtube.com/@Bungie" },
]

const SOURCES = [
  { label: "Bungie News", href: "https://www.bungie.net/en/News" },
  { label: "Bungie Dev Portal", href: "https://www.bungie.net/en/Application" },
  {
    label: "Bungie-net/api (GitHub)",
    href: "https://github.com/Bungie-net/api",
  },
  { label: "@BungieHelp (Tweets)", href: "/news" },
]

async function openExternal(url: string) {
  if (url.startsWith("/")) return
  try {
    const { open } = await import("@tauri-apps/plugin-shell")
    await open(url)
  } catch {
    window.open(url, "_blank")
  }
}

export function Marathon() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border-2 border-[#c7ff00]/40 bg-linear-to-br from-[#c7ff00]/10 via-[#c7ff00]/5 to-transparent p-7">
        <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-[#c7ff00]/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start gap-5 md:flex-nowrap">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#c7ff00]/40 shadow-[0_0_24px_rgba(199,255,0,0.25)]">
            <img
              src={marathonIcon}
              alt="Marathon"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] tracking-[0.25em] text-[#c7ff00]/80 uppercase">
              Bungie — Extraction Shooter
            </div>
            <h1 className="mt-1 text-4xl leading-none font-extrabold tracking-tight md:text-5xl">
              Marathon
            </h1>
            <p className="text-bungie-muted mt-3 max-w-xl text-sm">
              Cruzer Compagnon accueillera Marathon dès publication de l'API
              publique Bungie. Toutes les features listées ci-dessous sont
              prêtes côté UI, en attente de branchement API.
            </p>
          </div>
        </div>
      </section>

      {/* API status card */}
      <section className="panel border border-[#c7ff00]/20 p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          <div className="text-[10px] font-bold tracking-[0.25em] text-amber-300 uppercase">
            Statut API · En attente
          </div>
        </div>
        <h2 className="mb-3 text-xl font-bold">
          Pas de date annoncée pour l'API Marathon
        </h2>
        <div className="text-bungie-muted max-w-2xl space-y-2 text-sm leading-relaxed">
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

        <div className="border-bungie-border/60 mt-5 border-t pt-4">
          <div className="text-bungie-muted mb-3 text-[10px] tracking-widest uppercase">
            Sources à surveiller
          </div>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((s) =>
              s.href.startsWith("/") ? (
                <Link
                  key={s.label}
                  to={s.href}
                  className="border-bungie-border flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors hover:border-[#c7ff00]/40"
                >
                  {s.label}
                </Link>
              ) : (
                <button
                  key={s.label}
                  onClick={() => openExternal(s.href)}
                  className="border-bungie-border flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors hover:border-[#c7ff00]/40"
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
        <h2 className="mb-4 text-lg font-bold">Le jeu</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Lore/pitch */}
          <div className="panel border border-[#c7ff00]/20 p-5 md:col-span-2">
            <div className="mb-2 text-[10px] font-bold tracking-widest text-[#c7ff00] uppercase">
              Synopsis
            </div>
            <p className="text-bungie-text/90 text-sm leading-relaxed">
              Tau Ceti IV. Colonie perdue. Les Runners, silhouettes
              cybernétiques aux consciences transférées, plongent dans les
              vestiges de l'UESC Marathon pour extraire artefacts, armes et
              secrets — en s'entretuant. Reboot ambitieux de la trilogie culte
              Bungie de 1994-96, transposée en extraction shooter multijoueur
              compétitif.
            </p>
            <p className="text-bungie-muted mt-3 text-xs leading-relaxed">
              Sessions courtes, loot persistant dans un stash entre les matchs,
              risque/récompense : emporter le butin hors-zone ou le perdre à la
              mort. Arsenal d'armes SF, implants modifiant les capacités, une
              roster de Runners aux kits asymétriques.
            </p>
          </div>

          {/* Game info grid */}
          <div className="panel p-5">
            <div className="mb-3 text-[10px] font-bold tracking-widest text-[#c7ff00] uppercase">
              Fiche
            </div>
            <dl className="space-y-2 text-xs">
              {GAME_INFO.map((row) => (
                <div key={row.label} className="flex justify-between gap-2">
                  <dt className="text-bungie-muted shrink-0">{row.label}</dt>
                  <dd className="text-bungie-text/90 text-right font-medium">
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
        <h2 className="mb-4 text-lg font-bold">Liens & communauté</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {COMMUNITY.map((c) =>
            c.href.startsWith("/") ? (
              <Link
                key={c.label}
                to={c.href}
                className="panel group flex items-center justify-between gap-3 p-4 transition-colors hover:border-[#c7ff00]/40"
              >
                <span className="text-sm font-semibold">{c.label}</span>
                <span className="text-[#c7ff00] transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            ) : (
              <button
                key={c.label}
                onClick={() => openExternal(c.href)}
                className="panel group flex items-center justify-between gap-3 p-4 text-left transition-colors hover:border-[#c7ff00]/40"
              >
                <span className="text-sm font-semibold">{c.label}</span>
                <span className="text-[#c7ff00] transition-transform group-hover:translate-x-0.5">
                  ↗
                </span>
              </button>
            )
          )}
        </div>
      </section>

      {/* News CTA */}
      <section className="panel flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#c7ff00]/30 bg-[#c7ff00]/10 text-[#c7ff00]">
            <IconNewspaper size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">Actualités Marathon</div>
            <div className="text-bungie-muted mt-0.5 text-xs">
              Annonces Bungie, dev updates, patch notes — filtrés Marathon
            </div>
          </div>
        </div>
        <Link
          to="/news"
          className="flex h-9 items-center gap-2 rounded-full bg-[#c7ff00] px-4 text-xs font-bold text-black transition hover:brightness-110"
        >
          Voir le flux
        </Link>
      </section>
    </div>
  )
}
