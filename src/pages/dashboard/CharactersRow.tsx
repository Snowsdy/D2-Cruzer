/**
 * Dashboard widget — wide, emblem-backed tiles for each Guardian.
 *
 * Complements the header's CharacterSelector (which is a compact pill row
 * for navigation) by surfacing richer per-character context on the
 * Dashboard: class, power, total time played, last-seen relative date.
 * Clicking a tile sets the active character and drops the user into
 * Inventory for that Guardian.
 */

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/useProfile";
import { useCharacterStore } from "@/store/character";
import { useManifestStore } from "@/store/manifest";
import { getName } from "@/api/manifest";

function relativeDay(
  iso: string | undefined,
  t: (key: string, opts?: Record<string, unknown>) => string
): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  if (days <= 0) return t("dashboard.characters.today");
  if (days === 1) return t("dashboard.characters.yesterday");
  if (days < 30) return t("dashboard.characters.daysAgo", { n: days });
  return t("dashboard.characters.monthsAgo", { n: Math.floor(days / 30) });
}

export function CharactersRow() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const setActive = useCharacterStore((s) => s.setActiveCharacter);
  const activeId = useCharacterStore((s) => s.activeCharacterId);
  const manifest = useManifestStore((s) => s.manifest);

  const chars = profile.data?.characters?.data;
  if (!chars) return null;
  const list = Object.values(chars).sort(
    (a, b) =>
      new Date(b.dateLastPlayed).getTime() -
      new Date(a.dateLastPlayed).getTime()
  );

  if (list.length === 0) return null;

  const goToChar = (cid: string) => {
    setActive(cid);
    navigate("/inventory");
  };

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-[11px] uppercase tracking-[0.28em] font-extrabold text-bungie-muted">
          {t("dashboard.characters.title", "Tes Gardiens")}
        </h2>
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/30">
          {t("dashboard.characters.hint", "Clique pour ouvrir l'inventaire")}
        </span>
      </div>

      <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => {
          const className = manifest
            ? getName(manifest.DestinyClassDefinition, c.classHash)
            : "…";
          const classIcon =
            manifest?.DestinyClassDefinition?.[c.classHash]?.displayProperties
              ?.icon;
          const emblem = c.emblemBackgroundPath || c.emblemPath;
          const hoursPlayed = Math.round(Number(c.minutesPlayedTotal ?? 0) / 60);
          const isActive = c.characterId === activeId;

          return (
            <button
              key={c.characterId}
              onClick={() => goToChar(c.characterId)}
              className={`relative overflow-hidden rounded-xl text-left group h-24 transition-all hover:-translate-y-0.5 ${
                isActive
                  ? "shadow-[0_0_0_1px_rgba(243,7,94,0.6),0_0_28px_rgba(243,7,94,0.25)]"
                  : "shadow-[0_0_0_1px_rgba(31,32,48,0.6)] hover:shadow-[0_0_0_1px_rgba(243,7,94,0.45)]"
              }`}
              style={{
                background: emblem
                  ? `linear-gradient(90deg, rgba(7,7,13,0.9) 0%, rgba(7,7,13,0.4) 60%, transparent 100%), url(https://www.bungie.net${emblem})`
                  : "linear-gradient(180deg, rgba(17,17,29,0.85), rgba(13,13,22,0.85))",
                backgroundSize: "cover",
                backgroundPosition: "center right",
              }}
            >
              {/* Accent ribbon on active */}
              {isActive && (
                <span className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-bungie-accent to-bungie-accent/40" />
              )}

              <div className="relative h-full flex items-center gap-3 p-3 pl-4">
                {classIcon && (
                  <div
                    className={`w-12 h-12 shrink-0 rounded-lg flex items-center justify-center ${
                      isActive ? "bg-bungie-accent/15" : "bg-black/50"
                    } border ${
                      isActive
                        ? "border-bungie-accent/60"
                        : "border-white/10"
                    }`}
                  >
                    <img
                      src={`https://www.bungie.net${classIcon}`}
                      alt=""
                      className="w-8 h-8"
                    />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-extrabold tracking-tight text-white truncate">
                      {className}
                    </span>
                    {isActive && (
                      <span className="text-[8.5px] uppercase tracking-[0.2em] font-extrabold text-bungie-accent">
                        Actif
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-2xl font-extrabold text-[#f5a623] tabular-nums leading-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                      ◆ {c.light}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] font-semibold text-white/60">
                    <span className="tabular-nums">
                      {hoursPlayed.toLocaleString()} h
                    </span>
                    <span className="w-0.5 h-0.5 rounded-full bg-white/30" />
                    <span>
                      {relativeDay(c.dateLastPlayed, (k, o) =>
                        String(t(k, o as never))
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}